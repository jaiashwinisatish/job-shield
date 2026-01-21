import { Brain, Users, GraduationCap, Shield, Lock, Zap } from "lucide-react";

const badges = [
  {
    icon: Brain,
    title: "AI Powered",
    description: "Advanced machine learning analyzes job postings for scam patterns",
  },
  {
    icon: Users,
    title: "Community Verified",
    description: "Real reports from job seekers help identify emerging scams",
  },
  {
    icon: GraduationCap,
    title: "Student Safe",
    description: "Designed to protect first-time job seekers and fresh graduates",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "We never store your personal data or job search history",
  },
  {
    icon: Lock,
    title: "Secure Analysis",
    description: "All checks are encrypted and processed securely",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get comprehensive analysis in under 30 seconds",
  },
];

const TrustBadges = () => {
  return (
    <section className="py-20 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Why Trust <span className="text-primary">JobShield</span>?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built with cutting-edge technology and community insights to keep you safe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="group p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <badge.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{badge.title}</h3>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
