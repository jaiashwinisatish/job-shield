import { Link } from "react-router-dom";
import { Shield, Github, Twitter, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">
                Job<span className="text-primary">Shield</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Protecting students and job seekers from fraudulent opportunities since 2024.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/check" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Check a Job
                </Link>
              </li>
              <li>
                <Link to="/report" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Report a Scam
                </Link>
              </li>
              <li>
                <Link to="/database" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Scam Database
                </Link>
              </li>
              <li>
                <Link to="/learn" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Learn & Protect
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/learn" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Scam Red Flags
                </Link>
              </li>
              <li>
                <Link to="/learn" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link to="/learn" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Platform Guides
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Browser Extension
                </a>
              </li>
            </ul>
          </div>

          {/* Browser Extension Promo */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <h3 className="font-semibold text-foreground mb-2">🛡️ Coming Soon</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Get real-time protection with our browser extension.
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 text-xs rounded bg-secondary text-muted-foreground">Chrome</span>
              <span className="px-2 py-1 text-xs rounded bg-secondary text-muted-foreground">Firefox</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 JobShield. Built to protect job seekers.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
