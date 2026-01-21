import { Chrome, Shield, Bell, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const ExtensionPromo = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5" />
            <div className="absolute inset-0 bg-card/80" />

            {/* Content */}
            <div className="relative p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center cyber-glow">
                    <Chrome className="h-12 w-12 text-primary" />
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium mb-4">
                    <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                    Coming Soon
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3">
                    Get Real-Time Protection
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Our browser extension will automatically scan job postings as you browse 
                    LinkedIn, Indeed, and other job sites.
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4 text-primary" />
                      <span>Auto-scan listings</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Bell className="h-4 w-4 text-primary" />
                      <span>Instant alerts</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Zap className="h-4 w-4 text-primary" />
                      <span>Zero friction</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button disabled className="bg-secondary text-muted-foreground cursor-not-allowed">
                    Notify Me When Available
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExtensionPromo;
