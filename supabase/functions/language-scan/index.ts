import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LanguageScanResult {
  text: string;
  overall_risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  detected_patterns: Array<{
    pattern: string;
    type: string;
    risk_weight: number;
    matches: Array<{
      text: string;
      position: number;
      context: string;
    }>;
  }>;
  risk_breakdown: {
    payment_requests: number;
    urgency_tactics: number;
    unrealistic_offers: number;
    vague_descriptions: number;
    suspicious_contact: number;
    pressure_tactics: number;
    identity_requests: number;
  };
  analysis_details: {
    total_patterns_found: number;
    high_risk_patterns: number;
    medium_risk_patterns: number;
    low_risk_patterns: number;
    text_length: number;
    analysis_confidence: number;
  };
  recommendations: string[];
}

// Enhanced scam language patterns with regex
const SCAM_LANGUAGE_PATTERNS = {
  payment_requests: [
    {
      pattern: /\b(registration|registration fee|sign-up fee|enrollment fee|joining fee)\b/gi,
      weight: 85,
      description: "Registration fee request"
    },
    {
      pattern: /\b(training|training fee|training cost|training charges?|training program fee)\b/gi,
      weight: 80,
      description: "Training fee request"
    },
    {
      pattern: /\b(refundable deposit|security deposit|refundable amount)\b/gi,
      weight: 90,
      description: "Refundable deposit request"
    },
    {
      pattern: /\b(pay to join|payment required|pay now|send money)\b/gi,
      weight: 95,
      description: "Direct payment requirement"
    },
    {
      pattern: /\b(certificate after payment|paid certificate|certification fee)\b/gi,
      weight: 75,
      description: "Certificate payment requirement"
    },
    {
      pattern: /\b(investment required|initial investment|startup cost)\b/gi,
      weight: 88,
      description: "Investment requirement"
    },
    {
      pattern: /\b(software cost|tool cost|equipment cost|device cost)\b/gi,
      weight: 70,
      description: "Equipment/software cost"
    },
    {
      pattern: /\b(background check fee|verification fee|document processing fee)\b/gi,
      weight: 82,
      description: "Processing fee request"
    }
  ],
  
  urgency_tactics: [
    {
      pattern: /\b(immediate join|immediate joining|join immediately|start today)\b/gi,
      weight: 45,
      description: "Immediate joining pressure"
    },
    {
      pattern: /\b(urgent hiring|urgently hiring|urgent requirement)\b/gi,
      weight: 40,
      description: "Urgent hiring claims"
    },
    {
      pattern: /\b(limited slots|limited positions|few vacancies|last few seats)\b/gi,
      weight: 50,
      description: "Limited availability pressure"
    },
    {
      pattern: /\b(offer expires|expiring soon|closing soon|last date)\b/gi,
      weight: 35,
      description: "Time pressure tactics"
    },
    {
      pattern: /\b(don't miss|act now|apply now immediately|hurry up)\b/gi,
      weight: 30,
      description: "Action urgency language"
    },
    {
      pattern: /\b(first come first served|fcfs|early bird|special offer)\b/gi,
      weight: 25,
      description: "First-come pressure"
    }
  ],
  
  unrealistic_offers: [
    {
      pattern: /\b(guaranteed placement|guaranteed job|100% placement)\b/gi,
      weight: 70,
      description: "Guaranteed placement claims"
    },
    {
      pattern: /\b(high salary no experience|high pay no experience|lucrative salary)\b/gi,
      weight: 65,
      description: "High salary without experience"
    },
    {
      pattern: /\b(work from home no interview|remote job no interview)\b/gi,
      weight: 75,
      description: "No interview required"
    },
    {
      pattern: /\b(earn \d+ daily|daily income|weekly income|monthly income)\b/gi,
      weight: 68,
      description: "Specific income promises"
    },
    {
      pattern: /\b(part-time high salary|part-time good salary|flexible high pay)\b/gi,
      weight: 55,
      description: "High pay part-time claims"
    },
    {
      pattern: /\b(no experience required|experience not needed|freshers welcome)\b/gi,
      weight: 20,
      description: "No experience claims (lower risk)"
    }
  ],
  
  vague_descriptions: [
    {
      pattern: /\b(growing company|fast growing|rapidly expanding)\b/gi,
      weight: 15,
      description: "Vague growth claims"
    },
    {
      pattern: /\b(dynamic environment|exciting opportunity|great opportunity)\b/gi,
      weight: 10,
      description: "Generic opportunity language"
    },
    {
      pattern: /\b(various roles|multiple positions|several openings)\b/gi,
      weight: 20,
      description: "Non-specific role descriptions"
    },
    {
      pattern: /\b(looking for candidates|seeking applicants|hiring now)\b/gi,
      weight: 12,
      description: "Generic hiring language"
    }
  ],
  
  suspicious_contact: [
    {
      pattern: /\b(send your documents|share your documents|upload documents)\b/gi,
      weight: 55,
      description: "Document sharing request"
    },
    {
      pattern: /\b(share personal details|personal information required)\b/gi,
      weight: 60,
      description: "Personal information request"
    },
    {
      pattern: /\b(click this link|download this app|install this software)\b/gi,
      weight: 45,
      description: "Link/app download request"
    },
    {
      pattern: /\b(whatsapp only|contact on whatsapp|telegram only)\b/gi,
      weight: 35,
      description: "Non-official communication channel"
    },
    {
      pattern: /\b(personal email|personal number|direct contact)\b/gi,
      weight: 30,
      description: "Personal contact information"
    }
  ],
  
  pressure_tactics: [
    {
      pattern: /\b(decision needed immediately|accept now|confirm now)\b/gi,
      weight: 40,
      description: "Immediate decision pressure"
    },
    {
      pattern: /\b(offer valid for today only|today's last chance)\b/gi,
      weight: 45,
      description: "Same-day offer pressure"
    },
    {
      pattern: /\b(competitors hiring|other candidates waiting)\b/gi,
      weight: 35,
      description: "Competitive pressure"
    }
  ],
  
  identity_requests: [
    {
      pattern: /\b(aadhaar card|pan card|passport copy|id proof)\b/gi,
      weight: 65,
      description: "Identity document request"
    },
    {
      pattern: /\b(bank details|bank account|account number|ifsc code)\b/gi,
      weight: 85,
      description: "Banking information request"
    },
    {
      pattern: /\b(credit card|debit card|card details|card number)\b/gi,
      weight: 95,
      description: "Card information request"
    },
    {
      pattern: /\b(photo|photograph|selfie|profile picture)\b/gi,
      weight: 25,
      description: "Photo request"
    }
  ]
};

function extractTextContext(text: string, position: number, contextLength: number = 50): string {
  const start = Math.max(0, position - contextLength);
  const end = Math.min(text.length, position + contextLength);
  return text.substring(start, end).trim();
}

function scanTextPatterns(text: string): Array<{
  pattern: string;
  type: string;
  risk_weight: number;
  matches: Array<{
    text: string;
    position: number;
    context: string;
  }>;
}> {
  const results = [];
  const lowerText = text.toLowerCase();
  
  for (const [category, patterns] of Object.entries(SCAM_LANGUAGE_PATTERNS)) {
    for (const { pattern, weight, description } of patterns) {
      const matches = [];
      let match;
      
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(text)) !== null) {
        matches.push({
          text: match[0],
          position: match.index,
          context: extractTextContext(text, match.index, 50)
        });
      }
      
      if (matches.length > 0) {
        results.push({
          pattern: description,
          type: category,
          risk_weight: weight,
          matches
        });
      }
    }
  }
  
  return results;
}

function calculateRiskScore(detectedPatterns: Array<{ risk_weight: number; matches: any[] }>): {
  overall_score: number;
  breakdown: {
    payment_requests: number;
    urgency_tactics: number;
    unrealistic_offers: number;
    vague_descriptions: number;
    suspicious_contact: number;
    pressure_tactics: number;
    identity_requests: number;
  };
} {
  const breakdown = {
    payment_requests: 0,
    urgency_tactics: 0,
    unrealistic_offers: 0,
    vague_descriptions: 0,
    suspicious_contact: 0,
    pressure_tactics: 0,
    identity_requests: 0
  };
  
  let totalScore = 0;
  
  for (const pattern of detectedPatterns) {
    const categoryScore = Math.min(100, pattern.risk_weight * pattern.matches.length);
    totalScore += categoryScore;
    
    if (breakdown.hasOwnProperty(pattern.type)) {
      breakdown[pattern.type as keyof typeof breakdown] = Math.min(100, categoryScore);
    }
  }
  
  return {
    overall_score: Math.min(100, totalScore),
    breakdown
  };
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  return 'high';
}

function generateRecommendations(
  detectedPatterns: Array<{ type: string; pattern: string; matches: any[] }>,
  riskLevel: string
): string[] {
  const recommendations: string[] = [];
  
  // Check for high-risk patterns
  const hasPaymentRequests = detectedPatterns.some(p => p.type === 'payment_requests');
  const hasIdentityRequests = detectedPatterns.some(p => p.type === 'identity_requests');
  const hasUrgencyTactics = detectedPatterns.some(p => p.type === 'urgency_tactics');
  const hasUnrealisticOffers = detectedPatterns.some(p => p.type === 'unrealistic_offers');
  
  if (hasPaymentRequests) {
    recommendations.push("⚠️ PAYMENT REQUESTED: Legitimate jobs never require payment for registration, training, or equipment");
    recommendations.push("💳 Do NOT share credit card, debit card, or banking information");
    recommendations.push("🚫 This is a strong indicator of job scam - disengage immediately");
  }
  
  if (hasIdentityRequests) {
    recommendations.push("🛡️ IDENTITY REQUEST: Be cautious about sharing identity documents before verification");
    recommendations.push("📄 Only share documents after proper company verification and official offer");
  }
  
  if (hasUrgencyTactics) {
    recommendations.push("⏰ URGENCY TACTICS: Scammers use pressure to prevent careful consideration");
    recommendations.push("🤔 Take time to verify the company and recruiter independently");
  }
  
  if (hasUnrealisticOffers) {
    recommendations.push("💰 UNREALISTIC OFFERS: Be skeptical of guaranteed placement or high salary without experience");
    recommendations.push("📊 Research typical salary ranges for this role and experience level");
  }
  
  if (riskLevel === 'high') {
    recommendations.push("🚨 HIGH RISK: Multiple scam indicators detected - this is likely fraudulent");
    recommendations.push("📢 Report this job posting to help protect others");
    recommendations.push("🛑 Do not proceed with any communication or sharing of information");
  } else if (riskLevel === 'medium') {
    recommendations.push("⚠️ MEDIUM RISK: Some suspicious elements found - proceed with caution");
    recommendations.push("🔍 Additional verification of company and recruiter recommended");
  } else {
    recommendations.push("✅ LOW RISK: Few or no scam patterns detected");
    recommendations.push("🔍 Still verify the company and recruiter through official channels");
  }
  
  return recommendations;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text is required for analysis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Scan for scam patterns
    const detectedPatterns = scanTextPatterns(text);
    
    // Calculate risk scores
    const { overall_score, breakdown } = calculateRiskScore(detectedPatterns);
    const riskLevel = getRiskLevel(overall_score);
    
    // Generate recommendations
    const recommendations = generateRecommendations(detectedPatterns, riskLevel);
    
    // Analysis details
    const highRiskPatterns = detectedPatterns.filter(p => p.risk_weight >= 70).length;
    const mediumRiskPatterns = detectedPatterns.filter(p => p.risk_weight >= 40 && p.risk_weight < 70).length;
    const lowRiskPatterns = detectedPatterns.filter(p => p.risk_weight < 40).length;
    
    const result: LanguageScanResult = {
      text: text.substring(0, 500) + (text.length > 500 ? '...' : ''), // Truncate for response
      overall_risk_score: overall_score,
      risk_level: riskLevel,
      detected_patterns: detectedPatterns,
      risk_breakdown: breakdown,
      analysis_details: {
        total_patterns_found: detectedPatterns.length,
        high_risk_patterns: highRiskPatterns,
        medium_risk_patterns: mediumRiskPatterns,
        low_risk_patterns: lowRiskPatterns,
        text_length: text.length,
        analysis_confidence: detectedPatterns.length > 0 ? 85 : 50
      },
      recommendations
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Language scan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
