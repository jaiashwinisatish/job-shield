import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JobAnalysisRequest {
  job_url?: string;
  company_name?: string;
  recruiter_email?: string;
  recruiter_name?: string;
  job_description?: string;
  job_title?: string;
}

interface JobAnalysisResult {
  job_analysis: {
    job_url?: string;
    company_name?: string;
    recruiter_email?: string;
    recruiter_name?: string;
    job_title?: string;
    extracted_domain?: string;
  };
  final_risk_score: number;
  risk_level: 'legit' | 'suspicious' | 'high_risk';
  risk_summary: string;
  
  // Component scores
  component_scores: {
    domain_risk_score: number;
    company_verification_score: number;
    careers_page_match_score: number;
    email_authenticity_score: number;
    language_risk_score: number;
    community_risk_score: number;
  };
  
  // Detailed results
  verification_steps: Array<{
    id: string;
    label: string;
    status: 'pass' | 'fail' | 'warning' | 'unknown';
    detail: string;
    score_impact: number;
  }>;
  
  recruiter_details: {
    name?: string;
    email?: string;
    email_type: 'corporate' | 'personal' | 'unknown';
    company_association?: string;
    trust_score: number;
    red_flags: string[];
  };
  
  risk_factors: {
    high_risk: string[];
    medium_risk: string[];
    low_risk: string[];
  };
  
  recommendations: {
    immediate_actions: string[];
    verification_steps: string[];
    safety_tips: string[];
  };
  
  analysis_metadata: {
    analysis_duration_ms: number;
    components_analyzed: string[];
    confidence_score: number;
    api_version: string;
  };
}

// Risk scoring weights (total 100%)
const RISK_WEIGHTS = {
  domain_authenticity: 20,    // 20% weight
  company_verification: 25,   // 25% weight  
  careers_page_match: 15,    // 15% weight
  email_authenticity: 20,     // 20% weight
  language_analysis: 15,      // 15% weight
  community_intelligence: 5   // 5% weight
};

function extractDomainFromUrl(url: string): string | null {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function calculateFinalRiskScore(componentScores: {
  domain_risk_score: number;
  company_verification_score: number;
  careers_page_match_score: number;
  email_authenticity_score: number;
  language_risk_score: number;
  community_risk_score: number;
}): number {
  // Convert component scores to risk scores (inverse of verification scores)
  const domainRisk = componentScores.domain_risk_score;
  const companyRisk = 100 - componentScores.company_verification_score;
  const careersRisk = 100 - componentScores.careers_page_match_score;
  const emailRisk = componentScores.email_authenticity_score;
  const languageRisk = componentScores.language_risk_score;
  const communityRisk = componentScores.community_risk_score;
  
  const weightedScore = 
    (domainRisk * RISK_WEIGHTS.domain_authenticity / 100) +
    (companyRisk * RISK_WEIGHTS.company_verification / 100) +
    (careersRisk * RISK_WEIGHTS.careers_page_match / 100) +
    (emailRisk * RISK_WEIGHTS.email_authenticity / 100) +
    (languageRisk * RISK_WEIGHTS.language_analysis / 100) +
    (communityRisk * RISK_WEIGHTS.community_intelligence / 100);
  
  return Math.round(Math.min(100, Math.max(0, weightedScore)));
}

function getRiskLevel(score: number): 'legit' | 'suspicious' | 'high_risk' {
  if (score <= 30) return 'legit';
  if (score <= 60) return 'suspicious';
  return 'high_risk';
}

function generateRiskSummary(riskLevel: string, componentScores: any): string {
  const level = riskLevel.toUpperCase();
  const mainIssues = [];
  
  if (componentScores.domain_risk_score >= 70) mainIssues.push('suspicious domain');
  if (componentScores.company_verification_score <= 30) mainIssues.push('unverified company');
  if (componentScores.careers_page_match_score <= 30) mainIssues.push('no official job listing');
  if (componentScores.email_authenticity_score >= 70) mainIssues.push('suspicious recruiter email');
  if (componentScores.language_risk_score >= 70) mainIssues.push('scam language patterns');
  if (componentScores.community_risk_score >= 70) mainIssues.push('community scam reports');
  
  if (riskLevel === 'legit') {
    return `${level}: This job appears to be legitimate with proper company verification and professional communication channels.`;
  } else if (riskLevel === 'suspicious') {
    const issues = mainIssues.slice(0, 2).join(' and ');
    return `${level}: This job shows some concerning signs including ${issues}. Additional verification recommended before proceeding.`;
  } else {
    const issues = mainIssues.slice(0, 3).join(', ');
    return `${LEVEL}: Multiple red flags detected including ${issues}. This appears to be a potential job scam - extreme caution advised.`;
  }
}

function generateVerificationSteps(componentResults: any): Array<{
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warning' | 'unknown';
  detail: string;
  score_impact: number;
}> {
  const steps = [];
  
  // Domain verification
  if (componentResults.domain) {
    steps.push({
      id: 'domain_check',
      label: 'Domain Authenticity',
      status: componentResults.domain.risk_score <= 30 ? 'pass' : 
              componentResults.domain.risk_score <= 60 ? 'warning' : 'fail',
      detail: componentResults.domain.is_suspicious ? 
        'Domain appears suspicious or uses free platform' : 
        'Domain appears legitimate with proper SSL',
      score_impact: componentResults.domain.risk_score
    });
  }
  
  // Company verification
  if (componentResults.company) {
    steps.push({
      id: 'company_verification',
      label: 'Company Verification',
      status: componentResults.company.confidence_score >= 70 ? 'pass' : 
              componentResults.company.confidence_score >= 40 ? 'warning' : 'fail',
      detail: componentResults.company.is_legitimate ? 
        'Company verified through official sources' : 
        'Company could not be properly verified',
      score_impact: 100 - componentResults.company.confidence_score
    });
  }
  
  // Careers page matching
  if (componentResults.careers) {
    steps.push({
      id: 'careers_match',
      label: 'Official Job Listing',
      status: componentResults.careers.match_confidence >= 70 ? 'pass' : 
              componentResults.careers.match_confidence >= 40 ? 'warning' : 'fail',
      detail: componentResults.careers.matching_jobs_found > 0 ? 
        `Found ${componentResults.careers.matching_jobs_found} matching job(s) on official careers page` : 
        'No matching jobs found on official careers page',
      score_impact: 100 - componentResults.careers.match_confidence
    });
  }
  
  // Email verification
  if (componentResults.email) {
    steps.push({
      id: 'email_verification',
      label: 'Recruiter Email',
      status: componentResults.email.risk_score <= 30 ? 'pass' : 
              componentResults.email.risk_score <= 60 ? 'warning' : 'fail',
      detail: componentResults.email.is_corporate_domain ? 
        'Corporate email domain - good sign' : 
        'Personal or suspicious email domain detected',
      score_impact: componentResults.email.risk_score
    });
  }
  
  // Language analysis
  if (componentResults.language) {
    steps.push({
      id: 'language_analysis',
      label: 'Scam Language Detection',
      status: componentResults.language.overall_risk_score <= 30 ? 'pass' : 
              componentResults.language.overall_risk_score <= 60 ? 'warning' : 'fail',
      detail: `Found ${componentResults.language.detected_patterns.length} suspicious language patterns`,
      score_impact: componentResults.language.overall_risk_score
    });
  }
  
  return steps;
}

function generateRecommendations(riskLevel: string, componentResults: any): {
  immediate_actions: string[];
  verification_steps: string[];
  safety_tips: string[];
} {
  const recommendations = {
    immediate_actions: [],
    verification_steps: [],
    safety_tips: []
  };
  
  if (riskLevel === 'high_risk') {
    recommendations.immediate_actions.push(
      '🚨 STOP: Do not share any personal information or documents',
      '💳 Do NOT make any payments or share financial information',
      '📢 Report this job posting to protect others',
      '🛑 Cease all communication with the recruiter'
    );
  } else if (riskLevel === 'suspicious') {
    recommendations.immediate_actions.push(
      '⚠️ Proceed with extreme caution',
      '🔍 Verify company through official website only',
      '📞 Contact company directly to confirm job posting',
      '📋 Do not share sensitive documents yet'
    );
  } else {
    recommendations.immediate_actions.push(
      '✅ Job appears legitimate - proceed with normal caution',
      '🔍 Still verify through official company channels',
      '📋 Follow standard job application security practices'
    );
  }
  
  // Verification steps
  recommendations.verification_steps.push(
    'Visit the company\'s official website directly',
    'Search for the job listing on the company\'s careers page',
    'Verify the recruiter on LinkedIn',
    'Check for the company on business registration databases',
    'Look for employee reviews on legitimate platforms'
  );
  
  // Safety tips
  recommendations.safety_tips.push(
    'Never pay for a job or training',
    'Don\'t share bank details or credit card information',
    'Be cautious of urgency tactics',
    'Verify identity before sharing personal documents',
    'Use official communication channels only'
  );
  
  return recommendations;
}

async function callEdgeFunction(functionName: string, data: any, supabaseUrl: string, serviceKey: string): Promise<any> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Function ${functionName} failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const requestData: JobAnalysisRequest = await req.json();
    
    if (!requestData.job_url && !requestData.company_name && !requestData.recruiter_email && !requestData.job_description) {
      return new Response(
        JSON.stringify({ error: "At least one of job_url, company_name, recruiter_email, or job_description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract domain
    const extractedDomain = requestData.job_url ? extractDomainFromUrl(requestData.job_url) : null;

    // Initialize component results
    const componentResults: any = {};
    const componentScores = {
      domain_risk_score: 0,
      company_verification_score: 0,
      careers_page_match_score: 0,
      email_authenticity_score: 0,
      language_risk_score: 0,
      community_risk_score: 0
    };

    const componentsAnalyzed = [];

    // 1. Domain Analysis
    if (extractedDomain) {
      componentsAnalyzed.push('domain_analysis');
      const domainResult = await callEdgeFunction('domain-verify', {
        domain: extractedDomain
      }, supabaseUrl, supabaseServiceKey);
      
      if (domainResult) {
        componentResults.domain = domainResult;
        componentScores.domain_risk_score = domainResult.risk_score || 0;
      }
    }

    // 2. Company Verification
    if (requestData.company_name || extractedDomain) {
      componentsAnalyzed.push('company_verification');
      const companyResult = await callEdgeFunction('company-verify', {
        company_name: requestData.company_name,
        domain: extractedDomain
      }, supabaseUrl, supabaseServiceKey);
      
      if (companyResult) {
        componentResults.company = companyResult;
        componentScores.company_verification_score = companyResult.confidence_score || 0;
      }
    }

    // 3. Careers Page Matching
    if (extractedDomain && requestData.job_title) {
      componentsAnalyzed.push('careers_matching');
      const careersResult = await callEdgeFunction('careers-match', {
        company_domain: extractedDomain,
        job_title: requestData.job_title,
        company_name: requestData.company_name
      }, supabaseUrl, supabaseServiceKey);
      
      if (careersResult) {
        componentResults.careers = careersResult;
        componentScores.careers_page_match_score = careersResult.match_confidence || 0;
      }
    }

    // 4. Email Verification
    if (requestData.recruiter_email) {
      componentsAnalyzed.push('email_verification');
      const emailResult = await callEdgeFunction('email-verify', {
        email: requestData.recruiter_email,
        company_domain: extractedDomain,
        company_name: requestData.company_name
      }, supabaseUrl, supabaseServiceKey);
      
      if (emailResult) {
        componentResults.email = emailResult;
        componentScores.email_authenticity_score = emailResult.risk_score || 0;
      }
    }

    // 5. Language Analysis
    if (requestData.job_description) {
      componentsAnalyzed.push('language_analysis');
      const languageResult = await callEdgeFunction('language-scan', {
        text: requestData.job_description
      }, supabaseUrl, supabaseServiceKey);
      
      if (languageResult) {
        componentResults.language = languageResult;
        componentScores.language_risk_score = languageResult.overall_risk_score || 0;
      }
    }

    // 6. Community Intelligence (check existing scam reports)
    if (requestData.company_name || requestData.recruiter_email || extractedDomain) {
      componentsAnalyzed.push('community_intelligence');
      try {
        const { data: scamReports, error } = await supabase
          .from('scam_reports')
          .select('*')
          .or(`company_name.eq.${requestData.company_name || ''},recruiter_email.eq.${requestData.recruiter_email || ''}`)
          .limit(10);

        if (!error && scamReports) {
          const reportCount = scamReports.length;
          componentScores.community_risk_score = Math.min(100, reportCount * 20);
          componentResults.community = { report_count: reportCount, reports: scamReports };
        }
      } catch (error) {
        console.error('Community intelligence check failed:', error);
      }
    }

    // Calculate final risk score
    const finalRiskScore = calculateFinalRiskScore(componentScores);
    const riskLevel = getRiskLevel(finalRiskScore);
    const riskSummary = generateRiskSummary(riskLevel, componentScores);

    // Generate verification steps
    const verificationSteps = generateVerificationSteps(componentResults);

    // Generate recommendations
    const recommendations = generateRecommendations(riskLevel, componentResults);

    // Generate recruiter details
    const recruiterDetails = {
      name: requestData.recruiter_name,
      email: requestData.recruiter_email,
      email_type: componentResults.email?.is_corporate_domain ? 'corporate' : 
                  componentResults.email?.is_free_email_provider ? 'personal' : 'unknown',
      company_association: componentResults.company?.name,
      trust_score: componentResults.email ? (100 - componentResults.email.risk_score) : 50,
      red_flags: componentResults.email?.recommendations?.slice(0, 3) || []
    };

    // Generate risk factors
    const riskFactors = {
      high_risk: [],
      medium_risk: [],
      low_risk: []
    };

    if (componentScores.domain_risk_score >= 70) riskFactors.high_risk.push('Suspicious domain detected');
    if (componentScores.company_verification_score <= 30) riskFactors.high_risk.push('Company not verified');
    if (componentScores.careers_page_match_score <= 30) riskFactors.high_risk.push('No official job listing found');
    if (componentScores.email_authenticity_score >= 70) riskFactors.high_risk.push('Suspicious recruiter email');
    if (componentScores.language_risk_score >= 70) riskFactors.high_risk.push('Scam language patterns detected');

    if (componentScores.domain_risk_score >= 40 && componentScores.domain_risk_score < 70) riskFactors.medium_risk.push('Domain needs verification');
    if (componentScores.company_verification_score > 30 && componentScores.company_verification_score <= 60) riskFactors.medium_risk.push('Company partially verified');
    if (componentScores.email_authenticity_score >= 40 && componentScores.email_authenticity_score < 70) riskFactors.medium_risk.push('Email needs verification');

    const analysisDuration = Date.now() - startTime;

    const result: JobAnalysisResult = {
      job_analysis: {
        job_url: requestData.job_url,
        company_name: requestData.company_name,
        recruiter_email: requestData.recruiter_email,
        recruiter_name: requestData.recruiter_name,
        job_title: requestData.job_title,
        extracted_domain: extractedDomain
      },
      final_risk_score: finalRiskScore,
      risk_level: riskLevel,
      risk_summary: riskSummary,
      component_scores: componentScores,
      verification_steps: verificationSteps,
      recruiter_details: recruiterDetails,
      risk_factors: riskFactors,
      recommendations: recommendations,
      analysis_metadata: {
        analysis_duration_ms: analysisDuration,
        components_analyzed: componentsAnalyzed,
        confidence_score: componentsAnalyzed.length > 0 ? 85 : 30,
        api_version: '2.0'
      }
    };

    // Store analysis in database
    try {
      await supabase.from('job_analyses').insert({
        job_url: requestData.job_url,
        company_name: requestData.company_name,
        recruiter_email: requestData.recruiter_email,
        recruiter_name: requestData.recruiter_name,
        job_description: requestData.job_description,
        job_title: requestData.job_title,
        extracted_domain: extractedDomain,
        final_risk_score: finalRiskScore,
        risk_level: riskLevel,
        risk_summary: riskSummary,
        domain_risk_score: componentScores.domain_risk_score,
        company_verification_score: componentScores.company_verification_score,
        careers_page_match_score: componentScores.careers_page_match_score,
        email_authenticity_score: componentScores.email_authenticity_score,
        language_risk_score: componentScores.language_risk_score,
        community_risk_score: componentScores.community_risk_score,
        verification_steps: verificationSteps,
        recruiter_details: recruiterDetails,
        risk_factors: riskFactors,
        analysis_duration_ms: analysisDuration
      });
    } catch (error) {
      console.error('Failed to store analysis:', error);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Job analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
