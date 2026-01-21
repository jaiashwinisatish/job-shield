import { ShieldCheck, ShieldAlert, ShieldX, ExternalLink, Flag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface WhatToDoNextProps {
  riskLevel: "legit" | "suspicious" | "high_risk";
}

const WhatToDoNext = ({ riskLevel }: WhatToDoNextProps) => {
  const content = {
    legit: {
      icon: ShieldCheck,
      title: "This Looks Safe!",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
      description: "Based on our analysis, this appears to be a legitimate opportunity. However, always stay cautious.",
      actions: [
        "Verify the company exists on their official website",
        "Research the company on LinkedIn and Glassdoor",
        "Never share sensitive personal info until you've met the team",
        "Trust your instincts—if something feels off, investigate more",
      ],
    },
    suspicious: {
      icon: ShieldAlert,
      title: "Proceed with Caution",
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/30",
      description: "We detected some warning signs. Take extra steps to verify this opportunity before proceeding.",
      actions: [
        "Do NOT pay any money for training, equipment, or processing",
        "Verify the company through independent research",
        "Check if the job exists on the company's official careers page",
        "Ask for a video call to verify the recruiter's identity",
        "Never share bank details, SSN, or ID documents early",
      ],
    },
    high_risk: {
      icon: ShieldX,
      title: "Warning: High Risk Detected",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/30",
      description: "This opportunity shows multiple signs of a scam. We strongly recommend avoiding it.",
      actions: [
        "DO NOT engage further with this recruiter",
        "DO NOT pay any money under any circumstances",
        "DO NOT share personal documents or bank details",
        "Block the recruiter on all platforms",
        "Report this scam to help protect others",
      ],
    },
  };

  const { icon: Icon, title, color, bgColor, borderColor, description, actions } = content[riskLevel];

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-6`}>
      <div className="flex items-start gap-4 mb-6">
        <div className={`p-3 rounded-lg ${bgColor} ${color}`}>
          <Icon className="h-8 w-8" />
        </div>
        <div>
          <h3 className={`text-xl font-semibold ${color}`}>{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <p className="text-sm font-medium text-foreground">What you should do:</p>
        <ul className="space-y-2">
          {actions.map((action, index) => (
            <li key={index} className="flex items-start gap-3 text-sm">
              <span className={`w-5 h-5 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className={`text-xs font-bold ${color}`}>{index + 1}</span>
              </span>
              <span className="text-foreground">{action}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {riskLevel !== "legit" && (
          <Link to="/report" className="flex-1">
            <Button variant="outline" className="w-full border-destructive/50 text-destructive hover:bg-destructive/10">
              <Flag className="mr-2 h-4 w-4" />
              Report This Scam
            </Button>
          </Link>
        )}
        <Link to="/learn" className="flex-1">
          <Button variant="outline" className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" />
            Learn More About Scams
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default WhatToDoNext;
