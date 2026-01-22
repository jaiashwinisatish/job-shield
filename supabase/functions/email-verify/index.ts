import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailVerificationResult {
  email: string;
  is_valid_format: boolean;
  domain: string;
  is_free_email_provider: boolean;
  is_corporate_domain: boolean;
  domain_matches_company: boolean;
  company_domain?: string;
  mx_records_exist: boolean;
  email_deliverable: boolean;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  verification_details: {
    format_valid: boolean;
    domain_active: boolean;
    has_mx_records: boolean;
    corporate_email: boolean;
    domain_consistent: boolean;
    suspicious_pattern: boolean;
  };
  recommendations: string[];
}

// Free email provider domains
const FREE_EMAIL_PROVIDERS = [
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.in', 'yahoo.com.au',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'aol.com', 'aim.com',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me',
  'tutanota.com', 'tuta.io',
  'mail.com', 'gmx.com', 'gmx.net',
  'yandex.com', 'yandex.ru',
  'rediffmail.com', 'rediff.com',
  'zoho.com', 'zohomail.com',
  'rocketmail.com',
  'inbox.com',
  'lavabit.com'
];

// Suspicious email patterns
const SUSPICIOUS_PATTERNS = [
  /\d{4,}@/, // Emails with 4+ consecutive numbers
  /[a-z]{1,2}\d{3,}@/, // 1-2 letters followed by 3+ numbers
  /hr[0-9]*@/, // HR department patterns
  /recruit[0-9]*@/, // Recruiter patterns
  /career[0-9]*@/, // Career patterns
  /jobs[0-9]*@/, // Jobs patterns
  /info[0-9]*@/, // Info patterns
  /admin[0-9]*@/, // Admin patterns
  /support[0-9]*@/, // Support patterns
  /contact[0-9]*@/, // Contact patterns
  /[a-z]+[0-9]{2,}@/, // Letters followed by 2+ numbers
  /[0-9]+[a-z]+@/ // Numbers followed by letters
];

function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email.toLowerCase());
}

function extractDomain(email: string): string {
  try {
    return email.toLowerCase().split('@')[1];
  } catch {
    return '';
  }
}

function isFreeEmailProvider(domain: string): boolean {
  return FREE_EMAIL_PROVIDERS.includes(domain);
}

function hasSuspiciousPattern(email: string): boolean {
  const lowerEmail = email.toLowerCase();
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(lowerEmail));
}

async function checkMXRecords(domain: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data.Answer && data.Answer.length > 0;
    }
  } catch {
    // DNS lookup failed
  }
  
  return false;
}

async function checkDomainExists(domain: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'manual'
    });

    clearTimeout(timeoutId);

    return response.status !== 0;
  } catch {
    try {
      // Try HTTP as fallback
      const response = await fetch(`http://${domain}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
        redirect: 'manual'
      });
      
      return response.status !== 0;
    } catch {
      return false;
    }
  }
}

async function verifyEmailDeliverability(email: string): Promise<boolean> {
  // In production, you'd use an email verification service like Hunter.io, NeverBounce, etc.
  // For demo purposes, we'll do basic checks
  
  const domain = extractDomain(email);
  const hasMX = await checkMXRecords(domain);
  
  if (!hasMX) {
    return false;
  }
  
  // Additional verification would require SMTP conversation
  // which is complex in serverless environments
  // For now, we'll return true if MX records exist
  return true;
}

function calculateRiskScore(
  isFreeProvider: boolean,
  domainMatches: boolean,
  hasMX: boolean,
  suspiciousPattern: boolean,
  domainExists: boolean
): number {
  let score = 0;
  
  // Free email provider is a major risk factor (40 points)
  if (isFreeProvider) {
    score += 40;
  }
  
  // Suspicious pattern (30 points)
  if (suspiciousPattern) {
    score += 30;
  }
  
  // Domain doesn't match company (25 points)
  if (!domainMatches) {
    score += 25;
  }
  
  // No MX records (20 points)
  if (!hasMX) {
    score += 20;
  }
  
  // Domain doesn't exist (15 points)
  if (!domainExists) {
    score += 15;
  }
  
  return Math.min(100, score);
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  return 'high';
}

function generateRecommendations(
  isFreeProvider: boolean,
  domainMatches: boolean,
  suspiciousPattern: boolean,
  riskLevel: string
): string[] {
  const recommendations: string[] = [];
  
  if (isFreeProvider) {
    recommendations.push("Legitimate recruiters typically use corporate email addresses, not free email services like Gmail or Yahoo");
    recommendations.push("Request verification of the recruiter's identity through official company channels");
  }
  
  if (!domainMatches) {
    recommendations.push("Email domain doesn't match the claimed company domain - verify the company's official website");
    recommendations.push("Contact the company directly through their official website to confirm the recruiter's identity");
  }
  
  if (suspiciousPattern) {
    recommendations.push("Email pattern suggests automated or bulk recruitment - be cautious of potential scams");
    recommendations.push("Verify the recruiter's LinkedIn profile and company affiliation");
  }
  
  if (riskLevel === 'high') {
    recommendations.push("High risk detected - do not share personal information or documents");
    recommendations.push("Report this recruiter if you suspect fraudulent activity");
  } else if (riskLevel === 'medium') {
    recommendations.push("Medium risk - additional verification recommended before proceeding");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Email appears legitimate - still verify through official company channels");
  }
  
  return recommendations;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      company_domain,
      company_name 
    } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const isValidFormat = validateEmailFormat(email);
    if (!isValidFormat) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid email format",
          email,
          is_valid_format: false,
          risk_score: 100,
          risk_level: 'high'
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract domain
    const domain = extractDomain(email);
    
    // Check if it's a free email provider
    const isFreeProvider = isFreeEmailProvider(domain);
    const isCorporateDomain = !isFreeProvider;
    
    // Check for suspicious patterns
    const suspiciousPattern = hasSuspiciousPattern(email);
    
    // Check domain existence and MX records
    const [domainExists, hasMX] = await Promise.all([
      checkDomainExists(domain),
      checkMXRecords(domain)
    ]);
    
    // Check email deliverability
    const emailDeliverable = await verifyEmailDeliverability(email);
    
    // Check domain matching with company
    let domainMatchesCompany = true; // Default to true if no company domain provided
    if (company_domain) {
      const normalizedCompanyDomain = company_domain.toLowerCase().replace(/^www\./, '');
      domainMatchesCompany = domain === normalizedCompanyDomain || 
                             domain.endsWith('.' + normalizedCompanyDomain);
    }
    
    // Calculate risk score
    const riskScore = calculateRiskScore(
      isFreeProvider,
      domainMatchesCompany,
      hasMX,
      suspiciousPattern,
      domainExists
    );
    
    const riskLevel = getRiskLevel(riskScore);
    
    // Generate recommendations
    const recommendations = generateRecommendations(
      isFreeProvider,
      domainMatchesCompany,
      suspiciousPattern,
      riskLevel
    );
    
    const result: EmailVerificationResult = {
      email,
      is_valid_format: isValidFormat,
      domain,
      is_free_email_provider: isFreeProvider,
      is_corporate_domain: isCorporateDomain,
      domain_matches_company: domainMatchesCompany,
      company_domain,
      mx_records_exist: hasMX,
      email_deliverable: emailDeliverable,
      risk_score: riskScore,
      risk_level: riskLevel,
      verification_details: {
        format_valid: isValidFormat,
        domain_active: domainExists,
        has_mx_records: hasMX,
        corporate_email: isCorporateDomain,
        domain_consistent: domainMatchesCompany,
        suspicious_pattern: suspiciousPattern
      },
      recommendations
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Email verification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
