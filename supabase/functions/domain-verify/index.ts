import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DomainAnalysis {
  domain: string;
  is_free_platform: boolean;
  platform_type?: string;
  has_ssl: boolean;
  ssl_issuer?: string;
  domain_age_days?: number;
  creation_date?: string;
  expiration_date?: string;
  registrar?: string;
  nameservers?: string[];
  ip_addresses?: string[];
  is_suspicious: boolean;
  risk_score: number;
}

// Known free platform patterns
const FREE_PLATFORM_PATTERNS = {
  'google_forms': ['docs.google.com', 'forms.gle'],
  'notion': ['notion.so', 'notion.site'],
  'firebase': ['firebaseapp.com', 'web.app'],
  'wix': ['wixsite.com', 'wix.com'],
  'url_shortener': ['bit.ly', 'tinyurl.com', 'cutt.ly', 't.co', 'short.link'],
  'medium': ['medium.com'],
  'substack': ['substack.com'],
  'github_pages': ['github.io'],
  'netlify': ['netlify.app'],
  'vercel': ['vercel.app'],
  'heroku': ['herokuapp.com']
};

// Free email provider domains
const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com',
  'protonmail.com', 'tutanota.com', 'icloud.com', 'mail.com'
];

function extractDomain(url: string): string | null {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function checkFreePlatform(domain: string): { is_free: boolean; platform_type?: string } {
  for (const [platformType, domains] of Object.entries(FREE_PLATFORM_PATTERNS)) {
    for (const platformDomain of domains) {
      if (domain === platformDomain || domain.endsWith('.' + platformDomain)) {
        return { is_free: true, platform_type: platformType };
      }
    }
  }
  return { is_free: false };
}

async function checkSSL(domain: string): Promise<{ has_ssl: boolean; issuer?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'manual'
    });

    clearTimeout(timeoutId);

    if (response.status >= 200 && response.status < 400) {
      // Try to get certificate info (limited in Deno environment)
      return { has_ssl: true, issuer: 'Unknown' };
    }
    return { has_ssl: false };
  } catch {
    return { has_ssl: false };
  }
}

async function getDNSInfo(domain: string): Promise<{ 
  ip_addresses?: string[]; 
  nameservers?: string[]; 
  has_mx: boolean 
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Basic DNS resolution using fetch (limited in Deno)
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const ipAddresses = data.Answer?.filter((rr: any) => rr.type === 1).map((rr: any) => rr.data) || [];
      
      // Try to get NS records
      const nsResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=NS`, {
        signal: AbortSignal.timeout(5000)
      });
      
      let nameservers: string[] = [];
      if (nsResponse.ok) {
        const nsData = await nsResponse.json();
        nameservers = nsData.Answer?.filter((rr: any) => rr.type === 2).map((rr: any) => rr.data) || [];
      }

      return { 
        ip_addresses: ipAddresses, 
        nameservers: nameservers,
        has_mx: ipAddresses.length > 0
      };
    }
  } catch {
    // DNS lookup failed
  }
  
  return { ip_addresses: [], nameservers: [], has_mx: false };
}

async function getWhoisInfo(domain: string): Promise<{
  creation_date?: string;
  expiration_date?: string;
  registrar?: string;
  domain_age_days?: number;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // Use a WHOIS API (you'd need to sign up for a real service)
    // For demo purposes, we'll use a mock implementation
    const response = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const events = data.events || [];
      
      const creationEvent = events.find((e: any) => e.eventAction === 'registration');
      const expirationEvent = events.find((e: any) => e.eventAction === 'expiration');
      
      const creationDate = creationEvent?.eventDate;
      const expirationDate = expirationEvent?.eventDate;
      
      let domainAgeDays: number | undefined;
      if (creationDate) {
        const creation = new Date(creationDate);
        const now = new Date();
        domainAgeDays = Math.floor((now.getTime() - creation.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      return {
        creation_date: creationDate,
        expiration_date: expirationDate,
        registrar: data.port43 || 'Unknown',
        domain_age_days: domainAgeDays
      };
    }
  } catch {
    // WHOIS lookup failed
  }
  
  return {};
}

function calculateRiskScore(analysis: Partial<DomainAnalysis>): number {
  let score = 0;
  
  // Free platform penalty (30-50 points)
  if (analysis.is_free_platform) {
    score += analysis.platform_type === 'url_shortener' ? 50 : 40;
  }
  
  // SSL absence penalty (20 points)
  if (!analysis.has_ssl) {
    score += 20;
  }
  
  // Domain age penalty (0-30 points)
  if (analysis.domain_age_days !== undefined) {
    if (analysis.domain_age_days < 30) score += 30;
    else if (analysis.domain_age_days < 90) score += 20;
    else if (analysis.domain_age_days < 180) score += 10;
  }
  
  // No DNS resolution penalty (25 points)
  if (!analysis.ip_addresses || analysis.ip_addresses.length === 0) {
    score += 25;
  }
  
  // Suspicious TLD penalty (15 points)
  if (analysis.domain) {
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq'];
    const hasSuspiciousTld = suspiciousTlds.some(tld => analysis.domain!.endsWith(tld));
    if (hasSuspiciousTld) score += 15;
  }
  
  return Math.min(100, score);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain: inputDomain, url } = await req.json();
    
    // Extract domain from URL if provided
    let domain = inputDomain;
    if (url && !domain) {
      domain = extractDomain(url);
    }
    
    if (!domain) {
      return new Response(
        JSON.stringify({ error: "Valid domain or URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if we already have a recent analysis
    const { data: existingAnalysis } = await supabase
      .from("domain_analyses")
      .select("*")
      .eq("domain", domain)
      .gte("analysis_date", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("analysis_date", { ascending: false })
      .limit(1)
      .single();

    if (existingAnalysis) {
      return new Response(
        JSON.stringify(existingAnalysis),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Perform new analysis
    const freePlatformCheck = checkFreePlatform(domain);
    const sslCheck = await checkSSL(domain);
    const dnsInfo = await getDNSInfo(domain);
    const whoisInfo = await getWhoisInfo(domain);

    const analysis: DomainAnalysis = {
      domain,
      is_free_platform: freePlatformCheck.is_free,
      platform_type: freePlatformCheck.platform_type,
      has_ssl: sslCheck.has_ssl,
      ssl_issuer: sslCheck.issuer,
      domain_age_days: whoisInfo.domain_age_days,
      creation_date: whoisInfo.creation_date,
      expiration_date: whoisInfo.expiration_date,
      registrar: whoisInfo.registrar,
      nameservers: dnsInfo.nameservers,
      ip_addresses: dnsInfo.ip_addresses,
      is_suspicious: false, // Will be determined by risk score
      risk_score: 0 // Will be calculated
    };

    analysis.risk_score = calculateRiskScore(analysis);
    analysis.is_suspicious = analysis.risk_score >= 50;

    // Store analysis in database
    const { data: storedAnalysis, error } = await supabase
      .from("domain_analyses")
      .insert(analysis)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      // Return analysis even if storage fails
      return new Response(
        JSON.stringify(analysis),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(storedAnalysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Domain verification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
