import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { input, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("API key not configured");

    const systemPrompt = `You are a job scam detection AI. Analyze the provided ${type} and return a JSON object with this exact structure:
{
  "riskScore": number (0-100, higher = more risky),
  "riskLevel": "legit" | "suspicious" | "high_risk",
  "verificationSteps": [{ "id": string, "label": string, "status": "pass" | "fail" | "warning" | "unknown", "detail": string }],
  "riskReasons": [string array of specific reasons],
  "riskSummary": "brief plain-English summary",
  "recruiter": { "name": string or null, "emailType": "corporate" | "personal" | "unknown", "companyAssociation": string or null, "profileAge": string, "trustScore": number (0-100), "redFlags": [string array] }
}
Look for: payment requests, unrealistic salaries, vague descriptions, personal email domains, urgency tactics, unverifiable companies, suspicious URLs.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: input }],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
