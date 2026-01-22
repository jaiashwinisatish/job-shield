import Layout from "@/components/layout/Layout";
import { BookOpen, AlertTriangle, DollarSign, Mail, Building2, Clock, UserX, MessageCircle, FileText, Shield } from "lucide-react";

const redFlags = [
  { icon: DollarSign, title: "Payment Requests", desc: "Never pay for training, equipment, or processing fees." },
  { icon: Mail, title: "Suspicious Emails", desc: "Legit companies use official domains, not Gmail or Yahoo." },
  { icon: Building2, title: "Unverifiable Company", desc: "Can't find them online? Major red flag." },
  { icon: Clock, title: "Urgency Pressure", desc: "\"Act now!\" is a classic manipulation tactic." },
  { icon: UserX, title: "New Recruiter Profiles", desc: "Recently created LinkedIn profiles are suspicious." },
  { icon: MessageCircle, title: "WhatsApp-Only Contact", desc: "Real recruiters use official channels." },
  { icon: FileText, title: "Vague Job Descriptions", desc: "No clear role, requirements, or company info." },
  { icon: Shield, title: "Too Good to Be True", desc: "Unrealistic salaries for entry-level roles." },
];

const Learn = () => {
  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <BookOpen className="h-4 w-4" />
              Educational Resources
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Learn to Spot Scams</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">Knowledge is your best defense against job scams.</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-warning" />Red Flags to Watch For</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              {redFlags.map((flag, i) => (
                <div key={i} className="glass-card rounded-xl p-5 border border-border/50 hover:border-warning/30 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-warning/10 text-warning"><flag.icon className="h-5 w-5" /></div>
                    <div>
                      <h3 className="font-semibold text-foreground">{flag.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{flag.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-2xl p-8 border border-primary/20 bg-primary/5">
              <h2 className="text-xl font-bold mb-4">🛡️ Golden Rules</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-2"><span className="text-primary font-bold">1.</span>Never pay money to get a job</li>
                <li className="flex gap-2"><span className="text-primary font-bold">2.</span>Never share bank details or SSN before signing a contract</li>
                <li className="flex gap-2"><span className="text-primary font-bold">3.</span>Always verify the company independently</li>
                <li className="flex gap-2"><span className="text-primary font-bold">4.</span>Trust your instincts—if it feels wrong, it probably is</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Learn;
