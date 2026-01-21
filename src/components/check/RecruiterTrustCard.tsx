import { User, Mail, Building2, Calendar, Star, AlertTriangle } from "lucide-react";

interface RecruiterTrustCardProps {
  recruiterName?: string;
  emailType: "corporate" | "personal" | "unknown";
  companyAssociation: string | null;
  profileAge: string;
  trustScore: number;
  redFlags: string[];
}

const RecruiterTrustCard = ({
  recruiterName = "Unknown Recruiter",
  emailType,
  companyAssociation,
  profileAge,
  trustScore,
  redFlags,
}: RecruiterTrustCardProps) => {
  const getTrustColor = () => {
    if (trustScore >= 70) return "text-primary";
    if (trustScore >= 40) return "text-warning";
    return "text-destructive";
  };

  const getEmailBadge = () => {
    if (emailType === "corporate") {
      return { label: "Corporate Email", color: "bg-primary/20 text-primary" };
    }
    if (emailType === "personal") {
      return { label: "Personal Email", color: "bg-warning/20 text-warning" };
    }
    return { label: "Unknown Email", color: "bg-secondary text-muted-foreground" };
  };

  const emailBadge = getEmailBadge();

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <User className="h-5 w-5 text-primary" />
        Recruiter Trust Analysis
      </h3>

      <div className="space-y-4">
        {/* Recruiter Name */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Recruiter</span>
          <span className="font-medium">{recruiterName}</span>
        </div>

        {/* Email Type */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Type
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${emailBadge.color}`}>
            {emailBadge.label}
          </span>
        </div>

        {/* Company Association */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </span>
          <span className={companyAssociation ? "font-medium" : "text-muted-foreground italic"}>
            {companyAssociation || "Not verified"}
          </span>
        </div>

        {/* Profile Age */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Profile Age
          </span>
          <span className="font-medium">{profileAge}</span>
        </div>

        {/* Trust Score */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4" />
              Trust Score
            </span>
            <span className={`text-2xl font-bold ${getTrustColor()}`}>{trustScore}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                trustScore >= 70 ? "bg-primary" : trustScore >= 40 ? "bg-warning" : "bg-destructive"
              }`}
              style={{ width: `${trustScore}%` }}
            />
          </div>
        </div>

        {/* Red Flags */}
        {redFlags.length > 0 && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm font-medium text-destructive flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4" />
              Red Flags Detected
            </p>
            <ul className="space-y-1">
              {redFlags.map((flag, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterTrustCard;
