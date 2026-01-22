import { CheckCircle2, XCircle, AlertCircle, HelpCircle } from "lucide-react";

export interface VerificationStep {
  id: string;
  label: string;
  status: "pass" | "fail" | "warning" | "unknown";
  detail: string;
}

interface VerificationTimelineProps {
  steps: VerificationStep[];
}

const VerificationTimeline = ({ steps }: VerificationTimelineProps) => {
  const getStatusIcon = (status: VerificationStep["status"]) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case "fail":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: VerificationStep["status"]) => {
    switch (status) {
      case "pass":
        return "border-primary/30 bg-primary/5";
      case "fail":
        return "border-destructive/30 bg-destructive/5";
      case "warning":
        return "border-warning/30 bg-warning/5";
      default:
        return "border-border bg-secondary/20";
    }
  };

  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary" />
        Verification Timeline
      </h3>

      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-[22px] top-0 bottom-0 w-px bg-border" />

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`relative flex items-start gap-4 p-4 rounded-lg border ${getStatusColor(step.status)} transition-all hover:scale-[1.01]`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className="flex-shrink-0 relative z-10 bg-card rounded-full p-0.5">
                {getStatusIcon(step.status)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{step.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{step.detail}</p>
              </div>

              {/* Status Badge */}
              <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${
                step.status === "pass" 
                  ? "bg-primary/20 text-primary" 
                  : step.status === "fail" 
                  ? "bg-destructive/20 text-destructive" 
                  : step.status === "warning" 
                  ? "bg-warning/20 text-warning" 
                  : "bg-secondary text-muted-foreground"
              }`}>
                {step.status === "pass" ? "Verified" : step.status === "fail" ? "Failed" : step.status === "warning" ? "Warning" : "Unknown"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VerificationTimeline;
