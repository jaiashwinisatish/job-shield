import { AlertTriangle, Info } from "lucide-react";

interface RiskExplanationProps {
  riskLevel: "legit" | "suspicious" | "high_risk";
  reasons: string[];
  summary: string;
}

const RiskExplanation = ({ riskLevel, reasons, summary }: RiskExplanationProps) => {
  const getStyles = () => {
    if (riskLevel === "legit") {
      return {
        border: "border-primary/30",
        bg: "bg-primary/5",
        icon: "text-primary",
        title: "Why This Looks Safe",
      };
    }
    if (riskLevel === "suspicious") {
      return {
        border: "border-warning/30",
        bg: "bg-warning/5",
        icon: "text-warning",
        title: "Why This Looks Suspicious",
      };
    }
    return {
      border: "border-destructive/30",
      bg: "bg-destructive/5",
      icon: "text-destructive",
      title: "Why This Looks Risky",
    };
  };

  const styles = getStyles();

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-6`}>
      <div className="flex items-start gap-3 mb-4">
        {riskLevel === "legit" ? (
          <Info className={`h-6 w-6 ${styles.icon} flex-shrink-0`} />
        ) : (
          <AlertTriangle className={`h-6 w-6 ${styles.icon} flex-shrink-0`} />
        )}
        <div>
          <h3 className="text-lg font-semibold">{styles.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{summary}</p>
        </div>
      </div>

      <ul className="space-y-2 ml-9">
        {reasons.map((reason, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${styles.icon.replace("text-", "bg-")} mt-2 flex-shrink-0`} />
            <span className="text-sm text-foreground">{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RiskExplanation;
