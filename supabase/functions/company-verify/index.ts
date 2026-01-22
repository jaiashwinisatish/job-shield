import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompanyVerification {
  name: string;
  domain: string;
  linkedin_url?: string;
  linkedin_company_id?: string;
  website_verified: boolean;
  linkedin_verified: boolean;
  verification_date: string;
  company_size?: string;
  industry?: string;
  description?: string;
  headquarters?: string;
  founded_year?: number;
  is_legitimate: boolean;
  confidence_score: number;
  verification_details: {
    website_accessible: boolean;
    has_careers_page: boolean;
    has_contact_info: boolean;
    linkedin_matches_website: boolean;
    employee_count_reasonable: boolean;
    has_social_media_presence: boolean;
  };
}

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

function extractLinkedInCompanyId(linkedinUrl: string): string | null {
  try {
    const url = new URL(linkedinUrl);
    if (url.hostname === 'www.linkedin.com' || url.hostname === 'linkedin.com') {
      const match = url.pathname.match(/\/company\/([^\/]+)/);
      return match ? match[1] : null;
    }
  } catch {
    return null;
  }
  return null;
}

async function verifyWebsite(domain: string): Promise<{
  accessible: boolean;
  hasCareersPage: boolean;
  hasContactInfo: boolean;
  hasAboutPage: boolean;
  sslEnabled: boolean;
}> {
  const results = {
    accessible: false,
    hasCareersPage: false,
    hasContactInfo: false,
    hasAboutPage: false,
    sslEnabled: false
  };

  try {
    // Check main website
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`https://${domain}`, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      results.accessible = true;
      results.sslEnabled = true;

      const html = await response.text();
      const lowerHtml = html.toLowerCase();

      // Check for common careers page indicators
      const careersKeywords = ['careers', 'jobs', 'join-us', 'hiring', 'opportunities', 'vacancies'];
      results.hasCareersPage = careersKeywords.some(keyword => 
        lowerHtml.includes(keyword) || 
        lowerHtml.includes(`/${keyword}`) ||
        lowerHtml.includes(`${keyword}.`)
      );

      // Check for contact information
      const contactKeywords = ['contact', 'email', 'phone', 'address', 'reach us'];
      results.hasContactInfo = contactKeywords.some(keyword => 
        lowerHtml.includes(keyword)
      );

      // Check for about page
      const aboutKeywords = ['about', 'about-us', 'company', 'our story'];
      results.hasAboutPage = aboutKeywords.some(keyword => 
        lowerHtml.includes(keyword)
      );
    }
  } catch {
    // Try HTTP if HTTPS fails
    try {
      const response = await fetch(`http://${domain}`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
        redirect: 'follow'
      });

      if (response.ok) {
        results.accessible = true;
        const html = await response.text();
        const lowerHtml = html.toLowerCase();

        const careersKeywords = ['careers', 'jobs', 'join-us', 'hiring'];
        results.hasCareersPage = careersKeywords.some(keyword => 
          lowerHtml.includes(keyword)
        );

        const contactKeywords = ['contact', 'email', 'phone'];
        results.hasContactInfo = contactKeywords.some(keyword => 
          lowerHtml.includes(keyword)
        );
      }
    } catch {
      // Website is not accessible
    }
  }

  return results;
}

async function searchLinkedInCompany(companyName: string, domain?: string): Promise<{
  found: boolean;
  company_id?: string;
  url?: string;
  name?: string;
  description?: string;
  employee_count?: string;
  industry?: string;
  headquarters?: string;
  founded_year?: number;
}> {
  try {
    // Note: In production, you'd use LinkedIn's official API
    // For demo purposes, we'll use a web scraping approach
    // You should replace this with proper LinkedIn API integration
    
    const searchQuery = encodeURIComponent(`${companyName} ${domain || ''}`);
    const searchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${searchQuery}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(searchUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const html = await response.text();
      
      // This is a simplified approach - in production, you'd use proper selectors
      // or LinkedIn's API to get structured data
      const companyMatch = html.match(/"urn:li:company:(\d+)"/);
      if (companyMatch) {
        const companyId = companyMatch[1];
        
        // Try to extract basic company information
        const nameMatch = html.match(/"name":"([^"]+)"/);
        const descMatch = html.match(/"tagline":"([^"]+)"/);
        
        return {
          found: true,
          company_id: companyId,
          url: `https://www.linkedin.com/company/${companyId}`,
          name: nameMatch?.[1] || companyName,
          description: descMatch?.[1],
          employee_count: 'Unknown', // Would need additional API calls
          industry: 'Unknown',
          headquarters: 'Unknown'
        };
      }
    }
  } catch {
    // LinkedIn search failed
  }

  return { found: false };
}

async function verifyLinkedInCompany(companyId: string): Promise<{
  verified: boolean;
  data?: any;
}> {
  try {
    const url = `https://www.linkedin.com/company/${companyId}`;
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.ok) {
      const html = await response.text();
      
      // Check if this is a valid company page
      if (html.includes('company') && !html.includes('page not found')) {
        // Extract company data (simplified)
        const data = {
          verified: true,
          has_description: html.includes('description') || html.includes('About'),
          has_employees: html.includes('employees') || html.includes('See all employees'),
          has_updates: html.includes('Updates') || html.includes('Posts'),
          is_active: true
        };
        
        return { verified: true, data };
      }
    }
  } catch {
    // LinkedIn verification failed
  }

  return { verified: false };
}

function calculateConfidenceScore(
  websiteVerification: any,
  linkedinData: any,
  domainMatches: boolean
): number {
  let score = 0;

  // Website verification contributes up to 40 points
  if (websiteVerification.accessible) score += 15;
  if (websiteVerification.hasCareersPage) score += 10;
  if (websiteVerification.hasContactInfo) score += 8;
  if (websiteVerification.hasAboutPage) score += 7;

  // LinkedIn verification contributes up to 40 points
  if (linkedinData.found) score += 20;
  if (linkedinData.verified) score += 15;
  if (linkedinData.data?.has_description) score += 5;

  // Domain matching contributes up to 20 points
  if (domainMatches) score += 20;

  return Math.min(100, score);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_name, domain, linkedin_url } = await req.json();
    
    if (!company_name && !domain) {
      return new Response(
        JSON.stringify({ error: "Company name or domain is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract domain from LinkedIn URL if provided
    let extractedDomain = domain;
    if (linkedin_url && !domain) {
      // Try to find domain from LinkedIn description or other sources
      // This would require additional API calls in production
    }

    // Check if we already have a recent verification
    const searchDomain = extractedDomain || extractDomainFromUrl(linkedin_url || '');
    if (searchDomain) {
      const { data: existingCompany } = await supabase
        .from("companies")
        .select("*")
        .eq("domain", searchDomain)
        .gte("verification_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("verification_date", { ascending: false })
        .limit(1)
        .single();

      if (existingCompany) {
        return new Response(
          JSON.stringify(existingCompany),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Perform new verification
    const companyName = company_name || 'Unknown Company';
    
    // Verify website
    const websiteVerification = await verifyWebsite(searchDomain || '');
    
    // Search LinkedIn
    const linkedinSearch = await searchLinkedInCompany(companyName, searchDomain);
    
    // Verify LinkedIn company if found
    let linkedinVerification = { verified: false };
    if (linkedinSearch.found && linkedinSearch.company_id) {
      linkedinVerification = await verifyLinkedInCompany(linkedinSearch.company_id);
    }

    // Check if domain matches LinkedIn information
    const domainMatches = searchDomain && 
      linkedinSearch.name && 
      searchDomain.includes(extractDomainFromUrl(linkedinSearch.url || '') || '');

    // Calculate confidence score
    const confidenceScore = calculateConfidenceScore(
      websiteVerification,
      { ...linkedinSearch, ...linkedinVerification },
      domainMatches
    );

    const verification: CompanyVerification = {
      name: linkedinSearch.name || companyName,
      domain: searchDomain || 'unknown',
      linkedin_url: linkedinSearch.url,
      linkedin_company_id: linkedinSearch.company_id,
      website_verified: websiteVerification.accessible,
      linkedin_verified: linkedinVerification.verified,
      verification_date: new Date().toISOString(),
      company_size: linkedinSearch.employee_count,
      industry: linkedinSearch.industry,
      description: linkedinSearch.description,
      headquarters: linkedinSearch.headquarters,
      founded_year: linkedinSearch.founded_year,
      is_legitimate: confidenceScore >= 60,
      confidence_score: confidenceScore,
      verification_details: {
        website_accessible: websiteVerification.accessible,
        has_careers_page: websiteVerification.hasCareersPage,
        has_contact_info: websiteVerification.hasContactInfo,
        linkedin_matches_website: domainMatches,
        employee_count_reasonable: true, // Would need validation logic
        has_social_media_presence: linkedinSearch.found
      }
    };

    // Store verification in database
    const { data: storedVerification, error } = await supabase
      .from("companies")
      .insert(verification)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      // Return verification even if storage fails
      return new Response(
        JSON.stringify(verification),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(storedVerification),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Company verification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
