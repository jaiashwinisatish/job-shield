import { Link } from "react-router-dom";
import { Shield, AlertTriangle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 animated-gradient opacity-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" />
      
      {/* Enhanced Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'gradient-shift 20s ease infinite'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex mt-6 items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium animate-fade-in">
            <Shield className="h-4 w-4 " />
            <span>AI-Powered Protection for Job Seekers</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight animate-fade-in">
            Check if a Job is{" "}
            <span className="text-primary cyber-text-glow">Real or a Scam</span>
{" "} Before You Apply
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
            Protect yourself from fake recruiters on LinkedIn, WhatsApp, Instagram, and more. 
            Our AI analyzes job postings to keep you safe.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in">
            <Link to="/check">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 cyber-glow text-lg px-8 py-6 h-auto">
                <Search className="mr-2 h-5 w-5" />
                Check Job Authenticity
              </Button>
            </Link>
            <Link to="/report">
              <Button size="lg" variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10 text-lg px-8 py-6 h-auto">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Report a Scam
              </Button>
            </Link>
          </div>

          {/* Trust Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-8 animate-fade-in">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">50K+</p>
              <p className="text-sm text-muted-foreground">Jobs Analyzed</p>
            </div>
            <div className="w-px h-12 bg-border hidden sm:block" />
            <div className="text-center">
              <p className="text-3xl font-bold text-destructive">2,500+</p>
              <p className="text-sm text-muted-foreground">Scams Detected</p>
            </div>
            <div className="w-px h-12 bg-border hidden sm:block" />
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">10K+</p>
              <p className="text-sm text-muted-foreground">Students Protected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Shield Icon */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 animate-bounce opacity-50 ">
        <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
