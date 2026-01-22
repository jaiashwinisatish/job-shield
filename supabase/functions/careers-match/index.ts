import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CareersMatchResult {
  company_domain: string;
  job_title: string;
  company_name: string;
  careers_page_found: boolean;
  careers_page_url?: string;
  job_listings_found: boolean;
  matching_jobs_found: number;
  exact_matches: Array<{
    title: string;
    url: string;
    department?: string;
    location?: string;
    match_score: number;
  }>;
  partial_matches: Array<{
    title: string;
    url: string;
    match_score: number;
  }>;
  match_confidence: number;
  verification_details: {
    careers_accessible: boolean;
    has_job_board: boolean;
    recent_postings: boolean;
    company_branding_consistent: boolean;
  };
}

const COMMON_CAREERS_PATHS = [
  '/careers',
  '/jobs',
  '/hiring',
  '/join-us',
  '/opportunities',
  '/vacancies',
  '/work-with-us',
  '/careers.html',
  '/jobs.html',
  '/hiring.html',
  '/careers.php',
  '/jobs.php',
  '/api/jobs',
  '/api/careers',
  '/career',
  '/job',
  '/team',
  '/about/careers',
  '/about/jobs'
];

const EXTERNAL_JOB_BOARDS = [
  'linkedin.com/jobs',
  'indeed.com',
  'glassdoor.com',
  'monster.com',
  'ziprecruiter.com',
  'careerbuilder.com',
  'angel.co',
  'wellfound.com',
  'hired.com',
  'builtin.com'
];

function normalizeJobTitle(title: string): string {
  return title.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateTitleSimilarity(title1: string, title2: string): number {
  const t1 = normalizeJobTitle(title1);
  const t2 = normalizeJobTitle(title2);
  
  if (t1 === t2) return 100;
  
  // Check for exact word matches
  const words1 = t1.split(' ');
  const words2 = t2.split(' ');
  
  let commonWords = 0;
  for (const word of words1) {
    if (words2.includes(word)) {
      commonWords++;
    }
  }
  
  const similarity = (commonWords * 2) / (words1.length + words2.length) * 100;
  return Math.round(similarity);
}

async function findCareersPage(domain: string): Promise<{
  found: boolean;
  url?: string;
  accessible: boolean;
}> {
  const baseUrl = `https://${domain}`;
  
  // Try common careers paths
  for (const path of COMMON_CAREERS_PATHS) {
    try {
      const url = baseUrl + path;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();
        const lowerHtml = html.toLowerCase();
        
        // Check if this looks like a careers page
        const careersIndicators = [
          'job', 'career', 'position', 'opening', 'vacancy', 'apply',
          'opportunity', 'role', 'team member', 'hire', 'recruit'
        ];
        
        const hasCareersContent = careersIndicators.some(indicator => 
          lowerHtml.includes(indicator)
        );
        
        if (hasCareersContent) {
          return { found: true, url, accessible: true };
        }
      }
    } catch {
      continue;
    }
  }
  
  // Try to find careers link from main page
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(baseUrl, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const html = await response.text();
      const lowerHtml = html.toLowerCase();
      
      // Look for careers links in the HTML
      const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
      let match;
      
      while ((match = linkRegex.exec(html)) !== null) {
        const linkUrl = match[1];
        const linkText = match[2].toLowerCase();
        
        if (linkText.includes('career') || linkText.includes('job')) {
          let fullUrl = linkUrl;
          if (!linkUrl.startsWith('http')) {
            fullUrl = baseUrl + (linkUrl.startsWith('/') ? linkUrl : '/' + linkUrl);
          }
          
          // Verify this link
          try {
            const linkResponse = await fetch(fullUrl, {
              method: 'GET',
              signal: AbortSignal.timeout(3000)
            });
            
            if (linkResponse.ok) {
              const linkHtml = await linkResponse.text();
              const linkLowerHtml = linkHtml.toLowerCase();
              
              if (linkLowerHtml.includes('job') || linkLowerHtml.includes('career')) {
                return { found: true, url: fullUrl, accessible: true };
              }
            }
          } catch {
            continue;
          }
        }
      }
    }
  } catch {
    // Main page not accessible
  }
  
  return { found: false, accessible: false };
}

async function extractJobListings(careersUrl: string, companyDomain: string): Promise<Array<{
  title: string;
  url: string;
  department?: string;
  location?: string;
}>> {
  const jobs: Array<{
    title: string;
    url: string;
    department?: string;
    location?: string;
  }> = [];
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(careersUrl, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (!response.ok) return jobs;

    const html = await response.text();
    
    // Try to extract job listings using common patterns
    const jobPatterns = [
      // Common job listing patterns
      /<h[1-6][^>]*>([^<]*(?:job|position|role|opening)[^<]*)<\/h[1-6]>/gi,
      /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*(?:job|position|role|opening)[^<]*)<\/a>/gi,
      /<div[^>]*class=["'][^"']*(?:job|position|role|opening)[^"']*["'][^>]*>([^<]+)<\/div>/gi
    ];
    
    for (const pattern of jobPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const title = match[match.length - 1]?.replace(/<[^>]*>/g, '').trim();
        const url = match[1] || '';
        
        if (title && title.length > 5 && title.length < 100) {
          let fullUrl = url;
          if (url && !url.startsWith('http')) {
            fullUrl = `https://${companyDomain}${url.startsWith('/') ? url : '/' + url}`;
          }
          
          jobs.push({
            title,
            url: fullUrl || careersUrl,
            department: 'Unknown', // Would need more sophisticated extraction
            location: 'Unknown'
          });
        }
      }
    }
    
    // Remove duplicates and filter
    const uniqueJobs = jobs.filter((job, index, self) => 
      index === self.findIndex(j => j.title.toLowerCase() === job.title.toLowerCase())
    );
    
    return uniqueJobs.slice(0, 50); // Limit to 50 jobs
    
  } catch {
    return jobs;
  }
}

function findMatchingJobs(
  targetJobTitle: string,
  availableJobs: Array<{ title: string; url: string; department?: string; location?: string }>
): {
  exact_matches: Array<{ title: string; url: string; department?: string; location?: string; match_score: number }>;
  partial_matches: Array<{ title: string; url: string; match_score: number }>;
} {
  const exactMatches = [];
  const partialMatches = [];
  
  const normalizedTarget = normalizeJobTitle(targetJobTitle);
  
  for (const job of availableJobs) {
    const similarity = calculateTitleSimilarity(targetJobTitle, job.title);
    
    if (similarity >= 80) {
      exactMatches.push({
        ...job,
        match_score: similarity
      });
    } else if (similarity >= 50) {
      partialMatches.push({
        title: job.title,
        url: job.url,
        match_score: similarity
      });
    }
  }
  
  // Sort by match score
  exactMatches.sort((a, b) => b.match_score - a.match_score);
  partialMatches.sort((a, b) => b.match_score - a.match_score);
  
  return {
    exact_matches: exactMatches.slice(0, 5), // Top 5 exact matches
    partial_matches: partialMatches.slice(0, 10) // Top 10 partial matches
  };
}

function calculateMatchConfidence(
  careersPageFound: boolean,
  jobListingsFound: boolean,
  matchingJobsCount: number,
  exactMatchesCount: number
): number {
  let confidence = 0;
  
  if (careersPageFound) confidence += 25;
  if (jobListingsFound) confidence += 25;
  if (matchingJobsCount > 0) confidence += 30;
  if (exactMatchesCount > 0) confidence += 20;
  
  return Math.min(100, confidence);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      company_domain, 
      job_title, 
      company_name,
      job_url 
    } = await req.json();
    
    if (!company_domain && !job_url) {
      return new Response(
        JSON.stringify({ error: "Company domain or job URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract domain from job URL if not provided
    let domain = company_domain;
    if (!domain && job_url) {
      try {
        const url = new URL(job_url.startsWith('http') ? job_url : `https://${job_url}`);
        domain = url.hostname.replace(/^www\./, '');
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid job URL provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!domain) {
      return new Response(
        JSON.stringify({ error: "Could not determine company domain" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!job_title) {
      return new Response(
        JSON.stringify({ error: "Job title is required for matching" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find careers page
    const careersPage = await findCareersPage(domain);
    
    let jobListings = [];
    let hasJobBoard = false;
    let hasRecentPostings = false;
    
    if (careersPage.found && careersPage.url) {
      jobListings = await extractJobListings(careersPage.url, domain);
      hasJobBoard = jobListings.length > 0;
      
      // Check for recent postings (simplified - would need date extraction)
      hasRecentPostings = jobListings.length > 0;
    }
    
    // Find matching jobs
    const matchingJobs = findMatchingJobs(job_title, jobListings);
    
    // Calculate confidence
    const confidence = calculateMatchConfidence(
      careersPage.found,
      hasJobBoard,
      matchingJobs.exact_matches.length + matchingJobs.partial_matches.length,
      matchingJobs.exact_matches.length
    );
    
    const result: CareersMatchResult = {
      company_domain: domain,
      job_title,
      company_name: company_name || 'Unknown Company',
      careers_page_found: careersPage.found,
      careers_page_url: careersPage.url,
      job_listings_found: hasJobBoard,
      matching_jobs_found: matchingJobs.exact_matches.length + matchingJobs.partial_matches.length,
      exact_matches: matchingJobs.exact_matches,
      partial_matches: matchingJobs.partial_matches,
      match_confidence: confidence,
      verification_details: {
        careers_accessible: careersPage.accessible,
        has_job_board: hasJobBoard,
        recent_postings: hasRecentPostings,
        company_branding_consistent: true // Would need more sophisticated checking
      }
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Careers match error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
