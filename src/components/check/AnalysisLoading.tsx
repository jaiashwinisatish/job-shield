import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface AnalysisLoadingProps {
  isComplete: boolean;
}

const analysisSteps = [
  { id: 1, label: "Scanning input data...", duration: 1000 },
  { id: 2, label: "Verifying domain authenticity...", duration: 1500 },
  { id: 3, label: "Checking company existence...", duration: 1200 },
  { id: 4, label: "Analyzing job description patterns...", duration: 1800 },
  { id: 5, label: "Detecting payment/fee requests...", duration: 1000 },
  { id: 6, label: "Cross-referencing scam database...", duration: 1500 },
  { id: 7, label: "Generating risk assessment...", duration: 1000 },
];

const AnalysisLoading = ({ isComplete }: AnalysisLoadingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (isComplete) {
      setCompletedSteps(analysisSteps.map((s) => s.id));
      setCurrentStep(analysisSteps.length);
      return;
    }

    if (currentStep < analysisSteps.length) {
      const timer = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, analysisSteps[currentStep].id]);
        setCurrentStep((prev) => prev + 1);
      }, analysisSteps[currentStep].duration);

      return () => clearTimeout(timer);
    }
  }, [currentStep, isComplete]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="glass-card rounded-2xl p-8 cyber-border">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-pulse-glow">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Analyzing Job Authenticity</h2>
          <p className="text-muted-foreground">Please wait while our AI scans for potential red flags...</p>
        </div>

        <div className="space-y-3">
          {analysisSteps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = index === currentStep && !isComplete;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isCompleted
                    ? "bg-primary/10 border border-primary/20"
                    : isCurrent
                    ? "bg-secondary/50 border border-border"
                    : "bg-secondary/20 border border-transparent opacity-50"
                }`}
              >
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : isCurrent ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
                <span
                  className={`text-sm ${
                    isCompleted ? "text-foreground" : isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(completedSteps.length / analysisSteps.length) * 100}%` }}
            />
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {Math.round((completedSteps.length / analysisSteps.length) * 100)}% complete
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisLoading;
