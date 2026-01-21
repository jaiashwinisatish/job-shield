import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ReportScam = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    platform: "",
    jobLink: "",
    recruiterName: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("scam_reports").insert({
        platform: formData.platform,
        job_link: formData.jobLink || null,
        recruiter_name: formData.recruiterName || null,
        description: formData.description,
      });

      if (error) throw error;
      setIsSuccess(true);
      toast.success("Report submitted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <div className="glass-card rounded-2xl p-12 cyber-border">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
              <p className="text-muted-foreground mb-8">
                Your report helps protect others from scams. Our community will review it shortly.
              </p>
              <Button onClick={() => setIsSuccess(false)} variant="outline">
                Submit Another Report
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-4">
              <AlertTriangle className="h-4 w-4" />
              Help Protect Others
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Report a Scam</h1>
            <p className="text-muted-foreground">
              Share details about a suspicious job or recruiter to help our community stay safe.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 cyber-border space-y-6">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform *</Label>
              <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                <SelectTrigger><SelectValue placeholder="Where did you find this?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobLink">Job Link (optional)</Label>
              <Input id="jobLink" placeholder="https://..." value={formData.jobLink} onChange={(e) => setFormData({ ...formData, jobLink: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recruiterName">Recruiter Name (optional)</Label>
              <Input id="recruiterName" placeholder="Name or username" value={formData.recruiterName} onChange={(e) => setFormData({ ...formData, recruiterName: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" placeholder="Describe what happened..." className="min-h-[150px]" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={!formData.platform || !formData.description || isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Submit Report"}
            </Button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default ReportScam;
