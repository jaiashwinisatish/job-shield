import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RateLimitConfig {
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'analyze-job-v2': {
    requests_per_minute: 10,
    requests_per_hour: 100,
    requests_per_day: 500
  },
  'domain-verify': {
    requests_per_minute: 20,
    requests_per_hour: 200,
    requests_per_day: 1000
  },
  'company-verify': {
    requests_per_minute: 15,
    requests_per_hour: 150,
    requests_per_day: 750
  },
  'report-scam': {
    requests_per_minute: 5,
    requests_per_hour: 50,
    requests_per_day: 200
  }
};

function getClientIdentifier(req: Request): string {
  // Try to get client IP from various headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  if (realIp) {
    return realIp.trim();
  }
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  
  // Fallback to a random identifier (less ideal)
  return 'anonymous-' + Math.random().toString(36).substr(2, 9);
}

async function checkRateLimit(
  supabase: any,
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = new Date();
  const minuteWindow = new Date(now.getTime() - 60 * 1000);
  const hourWindow = new Date(now.getTime() - 60 * 60 * 1000);
  const dayWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  try {
    // Check minute limit
    const { data: minuteData, error: minuteError } = await supabase
      .from('rate_limits')
      .select('request_count')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', minuteWindow.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .single();
    
    if (!minuteError && minuteData && minuteData.request_count >= config.requests_per_minute) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: minuteWindow.getTime() + 60000 
      };
    }
    
    // Check hour limit
    const { data: hourData, error: hourError } = await supabase
      .from('rate_limits')
      .select('SUM(request_count) as total')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', hourWindow.toISOString())
      .single();
    
    if (!hourError && hourData && hourData.total >= config.requests_per_hour) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: hourWindow.getTime() + 3600000 
      };
    }
    
    // Check day limit
    const { data: dayData, error: dayError } = await supabase
      .from('rate_limits')
      .select('SUM(request_count) as total')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', dayWindow.toISOString())
      .single();
    
    if (!dayError && dayData && dayData.total >= config.requests_per_day) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: dayWindow.getTime() + 86400000 
      };
    }
    
    // Record this request
    await supabase
      .from('rate_limits')
      .upsert({
        identifier,
        endpoint,
        request_count: 1,
        window_start: minuteWindow.toISOString(),
        window_duration_minutes: 1
      }, {
        onConflict: 'identifier,endpoint,window_start'
      });
    
    // Calculate remaining requests
    const remaining = Math.min(
      config.requests_per_minute - (minuteData?.request_count || 0),
      config.requests_per_hour - (hourData?.total || 0),
      config.requests_per_day - (dayData?.total || 0)
    );
    
    return { 
      allowed: true, 
      remaining: Math.max(0, remaining), 
      resetTime: minuteWindow.getTime() + 60000 
    };
    
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Allow request if rate limiting fails
    return { allowed: true, remaining: 1, resetTime: Date.now() + 60000 };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint } = await req.json();
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: "Endpoint is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = RATE_LIMITS[endpoint];
    if (!config) {
      return new Response(
        JSON.stringify({ error: "No rate limit configuration found for endpoint" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const identifier = getClientIdentifier(req);
    const rateLimitResult = await checkRateLimit(supabase, identifier, endpoint, config);

    return new Response(
      JSON.stringify(rateLimitResult),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Limit": config.requests_per_minute.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString()
        } 
      }
    );

  } catch (error) {
    console.error("Rate limit error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
