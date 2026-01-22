import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScamReportRequest {
  platform: 'linkedin' | 'whatsapp' | 'telegram' | 'instagram' | 'email' | 'other';
  job_url?: string;
  company_name?: string;
  recruiter_name?: string;
  recruiter_email?: string;
  recruiter_phone?: string;
  upi_id?: string;
  description: string;
  proof_urls?: string[];
  scam_type?: string[];
  reporter_name?: string;
  reporter_email?: string;
  additional_info?: string;
}

interface ScamReportResult {
  success: boolean;
  report_id: string;
  message: string;
  duplicate_found: boolean;
  similar_reports_count: number;
  community_impact: {
    total_reports_for_entity: number;
    risk_increase: number;
    community_protection_level: string;
  };
  next_steps: string[];
}

async function findDuplicateReports(
  supabase: any,
  reportData: ScamReportRequest
): Promise<{ count: number; reports: any[] }> {
  const conditions = [];
  
  if (reportData.company_name) {
    conditions.push(`company_name.eq.${reportData.company_name}`);
  }
  if (reportData.recruiter_email) {
    conditions.push(`recruiter_email.eq.${reportData.recruiter_email}`);
  }
  if (reportData.recruiter_phone) {
    conditions.push(`recruiter_phone.eq.${reportData.recruiter_phone}`);
  }
  if (reportData.upi_id) {
    conditions.push(`upi_id.eq.${reportData.upi_id}`);
  }
  if (reportData.job_url) {
    conditions.push(`job_url.eq.${reportData.job_url}`);
  }
  
  if (conditions.length === 0) {
    return { count: 0, reports: [] };
  }
  
  try {
    const { data: reports, error } = await supabase
      .from('scam_reports')
      .select('*')
      .or(conditions.join(','))
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error finding duplicate reports:', error);
      return { count: 0, reports: [] };
    }
    
    return { 
      count: reports?.length || 0, 
      reports: reports || [] 
    };
  } catch (error) {
    console.error('Error in duplicate check:', error);
    return { count: 0, reports: [] };
  }
}

async function calculateCommunityImpact(
  duplicateCount: number,
  scamType: string[]
): Promise<{
  total_reports_for_entity: number;
  risk_increase: number;
  community_protection_level: string;
}> {
  const totalReports = duplicateCount + 1; // Include current report
  
  // Calculate risk increase based on report count and scam severity
  let riskIncrease = totalReports * 15; // Base increase per report
  
  // Higher risk increase for serious scam types
  if (scamType?.includes('payment')) {
    riskIncrease += 20;
  }
  if (scamType?.includes('identity_theft')) {
    riskIncrease += 25;
  }
  if (scamType?.includes('fake_company')) {
    riskIncrease += 15;
  }
  
  // Determine protection level
  let protectionLevel = 'Low';
  if (totalReports >= 10) {
    protectionLevel = 'Very High';
  } else if (totalReports >= 5) {
    protectionLevel = 'High';
  } else if (totalReports >= 3) {
    protectionLevel = 'Medium';
  }
  
  return {
    total_reports_for_entity: totalReports,
    risk_increase: Math.min(100, riskIncrease),
    community_protection_level: protectionLevel
  };
}

function generateNextSteps(
  duplicateCount: number,
  platform: string,
  scamType: string[]
): string[] {
  const steps = [
    '✅ Your report has been submitted successfully',
    '🔍 Our team will review and verify the information',
    '📢 This report will help protect other job seekers'
  ];
  
  if (duplicateCount > 0) {
    steps.push(`⚠️ Found ${duplicateCount} similar reports - this increases scam likelihood`);
  }
  
  if (platform === 'linkedin') {
    steps.push('📝 Consider reporting the post directly to LinkedIn');
    steps.push('🔗 Use LinkedIn\'s "Report this job" feature');
  } else if (platform === 'whatsapp' || platform === 'telegram') {
    steps.push('📱 Block the number and leave the group');
    steps.push('📢 Report the group/channel to the platform');
    steps.push('👥 Warn others in your network');
  }
  
  if (scamType?.includes('payment')) {
    steps.push('🚨 If you made any payments, contact your bank immediately');
    steps.push('🏦 Consider filing a complaint with cyber crime authorities');
  }
  
  if (scamType?.includes('identity_theft')) {
    steps.push('🛡️ Monitor your accounts for suspicious activity');
    steps.push('📋 Consider placing a fraud alert on your credit reports');
  }
  
  steps.push('📧 Save all evidence and communications');
  steps.push('👮‍♂️ For serious cases, consider filing a police report');
  
  return steps;
}

function validateScamReport(data: ScamReportRequest): { valid: boolean; errors: string[] } {
  const errors = [];
  
  if (!data.platform) {
    errors.push('Platform is required');
  }
  
  if (!data.description || data.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters long');
  }
  
  if (data.description && data.description.length > 2000) {
    errors.push('Description must be less than 2000 characters');
  }
  
  if (data.recruiter_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.recruiter_email)) {
    errors.push('Invalid email format');
  }
  
  if (data.job_url && !data.job_url.startsWith('http')) {
    errors.push('Job URL must start with http:// or https://');
  }
  
  if (data.proof_urls && data.proof_urls.length > 10) {
    errors.push('Maximum 10 proof URLs allowed');
  }
  
  if (data.scam_type && data.scam_type.length > 5) {
    errors.push('Maximum 5 scam types allowed');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const reportData: ScamReportRequest = await req.json();
    
    // Validate request data
    const validation = validateScamReport(reportData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ 
          error: "Validation failed", 
          details: validation.errors 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate reports
    const { count: duplicateCount, reports: similarReports } = await findDuplicateReports(supabase, reportData);
    
    // Calculate community impact
    const communityImpact = await calculateCommunityImpact(
      duplicateCount, 
      reportData.scam_type || []
    );
    
    // Determine risk level based on scam type and duplicates
    let riskLevel = 'suspicious';
    if (reportData.scam_type?.includes('payment') || 
        reportData.scam_type?.includes('identity_theft') || 
        duplicateCount >= 3) {
      riskLevel = 'high_risk';
    } else if (duplicateCount === 0 && !reportData.scam_type?.length) {
      riskLevel = 'legit'; // Might be legitimate but reported
    }
    
    // Insert the scam report
    const { data: insertedReport, error: insertError } = await supabase
      .from('scam_reports')
      .insert({
        platform: reportData.platform,
        job_url: reportData.job_url,
        company_name: reportData.company_name,
        recruiter_name: reportData.recruiter_name,
        recruiter_email: reportData.recruiter_email,
        recruiter_phone: reportData.recruiter_phone,
        upi_id: reportData.upi_id,
        description: reportData.description,
        proof_urls: reportData.proof_urls || [],
        scam_type: reportData.scam_type || [],
        risk_level: riskLevel,
        reports_count: duplicateCount + 1,
        status: 'pending'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting scam report:', insertError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to submit report", 
          details: insertError.message 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Generate next steps for the user
    const nextSteps = generateNextSteps(
      duplicateCount,
      reportData.platform,
      reportData.scam_type || []
    );
    
    const result: ScamReportResult = {
      success: true,
      report_id: insertedReport.id,
      message: duplicateCount > 0 ? 
        `Report submitted successfully. Found ${duplicateCount} similar reports.` : 
        'Report submitted successfully. Thank you for helping protect the community.',
      duplicate_found: duplicateCount > 0,
      similar_reports_count: duplicateCount,
      community_impact: communityImpact,
      next_steps: nextSteps
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Scam report error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
