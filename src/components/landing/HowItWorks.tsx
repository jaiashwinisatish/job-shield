import { ClipboardPaste, Scan, ShieldCheck, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: ClipboardPaste,
    step: "01",
    title: "Paste the Job",
    description: "Copy and paste the job URL, recruiter profile link, or the full job description text.",
  },
  {
    icon: Scan,
    step: "02",
    title: "AI Analysis",
    description: "Our AI scans for red flags: fake domains, unrealistic promises, payment requests, and more.",
  },
  {
    icon: ShieldCheck,
    step: "03",
    title: "Get Your Report",
    description: "Receive a clear risk score with plain-English explanations and safety recommendations.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to verify any job opportunity
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection Lines (Desktop) */}
            <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center">
                  {/* Step Number */}
                  <div className="absolute -top-2 right-0 md:right-auto md:-top-4 md:left-1/2 md:-translate-x-1/2 text-6xl font-bold text-primary/10">
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-card border border-primary/30 flex items-center justify-center mb-6 cyber-glow">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>

                {/* Arrow (Mobile) */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center my-6 md:hidden">
                    <ArrowRight className="h-6 w-6 text-primary rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
