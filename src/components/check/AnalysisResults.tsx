import RiskMeter from "./RiskMeter";
import VerificationTimeline, { VerificationStep } from "./VerificationTimeline";
import RiskExplanation from "./RiskExplanation";
import RecruiterTrustCard from "./RecruiterTrustCard";
import WhatToDoNext from "./WhatToDoNext";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export interface AnalysisResult {
  riskScore: number;
  riskLevel: "legit" | "suspicious" | "high_risk";
  verificationSteps: VerificationStep[];
  riskReasons: string[];
  riskSummary: string;
  recruiter: {
    name?: string;
    emailType: "corporate" | "personal" | "unknown";
    companyAssociation: string | null;
    profileAge: string;
    trustScore: number;
    redFlags: string[];
  };
}

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
}

const AnalysisResults = ({ result, onReset }: AnalysisResultsProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Analysis Complete</h2>
        <p className="text-muted-foreground">Here's what we found about this job opportunity</p>
      </div>

      {/* Risk Score */}
      <div className="glass-card rounded-2xl p-6 cyber-border">
        <RiskMeter score={result.riskScore} riskLevel={result.riskLevel} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Verification Timeline */}
          <div className="glass-card rounded-2xl p-6">
            <VerificationTimeline steps={result.verificationSteps} />
          </div>

          {/* Recruiter Trust */}
          <RecruiterTrustCard {...result.recruiter} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Risk Explanation */}
          <RiskExplanation
            riskLevel={result.riskLevel}
            reasons={result.riskReasons}
            summary={result.riskSummary}
          />

          {/* What To Do Next */}
          <WhatToDoNext riskLevel={result.riskLevel} />
        </div>
      </div>

      {/* Reset Button */}
      <div className="text-center pt-4">
        <Button variant="outline" size="lg" onClick={onReset} className="min-w-[200px]">
          <RotateCcw className="mr-2 h-4 w-4" />
          Check Another Job
        </Button>
      </div>
    </div>
  );
};

export default AnalysisResults;
