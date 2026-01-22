import { AlertTriangle, DollarSign, Mail, Building2, Clock, UserX } from "lucide-react";

const tips = [
  {
    icon: DollarSign,
    title: "Never Pay to Get a Job",
    description: "Legitimate employers never ask for money for training, equipment, or processing fees.",
    color: "text-destructive",
  },
  {
    icon: Mail,
    title: "Check the Email Domain",
    description: "Real companies use official email domains, not Gmail, Yahoo, or random addresses.",
    color: "text-warning",
  },
  {
    icon: Building2,
    title: "Verify the Company",
    description: "Search for the company independently. Check their official website and careers page.",
    color: "text-accent",
  },
  {
    icon: Clock,
    title: "Beware of Urgency",
    description: "\"Act now!\" and \"Limited time offer!\" are classic pressure tactics used by scammers.",
    color: "text-warning",
  },
  {
    icon: UserX,
    title: "Research the Recruiter",
    description: "Check LinkedIn profile age, connections, and activity. New profiles are suspicious.",
    color: "text-accent",
  },
  {
    icon: AlertTriangle,
    title: "Too Good to Be True?",
    description: "Extremely high salaries for entry-level work with no experience? Red flag.",
    color: "text-destructive",
  },
];

const QuickTips = () => {
  return (
    <section className="py-20 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Quick <span className="text-primary">Safety Tips</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Learn to spot the warning signs before it's too late
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tips.map((tip, index) => (
            <div
              key={index}
              className="p-5 rounded-lg bg-card border border-border/50 hover:border-primary/20 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-secondary ${tip.color}`}>
                  <tip.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                    {tip.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickTips;
