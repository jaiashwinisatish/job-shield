interface RiskMeterProps {
  score: number; // 0-100
  riskLevel: "legit" | "suspicious" | "high_risk";
}

const RiskMeter = ({ score, riskLevel }: RiskMeterProps) => {
  const getColor = () => {
    if (riskLevel === "legit") return "text-primary";
    if (riskLevel === "suspicious") return "text-warning";
    return "text-destructive";
  };

  const getGlowColor = () => {
    if (riskLevel === "legit") return "drop-shadow-[0_0_15px_hsl(var(--primary))]";
    if (riskLevel === "suspicious") return "drop-shadow-[0_0_15px_hsl(var(--warning))]";
    return "drop-shadow-[0_0_15px_hsl(var(--destructive))]";
  };

  const getBgGradient = () => {
    if (riskLevel === "legit") return "from-primary/20 to-primary/5";
    if (riskLevel === "suspicious") return "from-warning/20 to-warning/5";
    return "from-destructive/20 to-destructive/5";
  };

  const getLabel = () => {
    if (riskLevel === "legit") return "Looks Legit";
    if (riskLevel === "suspicious") return "Suspicious";
    return "High Risk";
  };

  // Calculate the stroke offset for the arc
  const radius = 80;
  const circumference = Math.PI * radius; // Half circle
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative p-8 rounded-2xl bg-gradient-to-b ${getBgGradient()}`}>
      <div className="flex flex-col items-center">
        {/* Gauge */}
        <div className="relative w-48 h-28">
          <svg viewBox="0 0 200 110" className="w-full h-full">
            {/* Background Arc */}
            <path
              d="M 10 100 A 80 80 0 0 1 190 100"
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Colored Arc */}
            <path
              d="M 10 100 A 80 80 0 0 1 190 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`${getColor()} ${getGlowColor()} transition-all duration-1000 ease-out`}
            />
            {/* Center Point */}
            <circle cx="100" cy="100" r="6" className={`fill-current ${getColor()}`} />
          </svg>

          {/* Score Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <span className={`text-5xl font-bold ${getColor()} ${getGlowColor()}`}>
              {score}
            </span>
            <span className="text-sm text-muted-foreground">Risk Score</span>
          </div>
        </div>

        {/* Label */}
        <div className={`mt-4 px-6 py-2 rounded-full font-semibold ${
          riskLevel === "legit" 
            ? "bg-primary/20 text-primary" 
            : riskLevel === "suspicious" 
            ? "bg-warning/20 text-warning" 
            : "bg-destructive/20 text-destructive"
        }`}>
          {getLabel()}
        </div>

        {/* Scale Labels */}
        <div className="flex justify-between w-full mt-4 px-4 text-xs text-muted-foreground">
          <span>Safe</span>
          <span>Moderate</span>
          <span>Dangerous</span>
        </div>
      </div>
    </div>
  );
};

export default RiskMeter;
