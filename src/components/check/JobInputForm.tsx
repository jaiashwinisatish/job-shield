import { useState } from "react";
import { Link2, FileText, User, Loader2, Search, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface JobInputFormProps {
  onAnalyze: (input: string, type: "url" | "description" | "recruiter") => void;
  isLoading: boolean;
}

const JobInputForm = ({ onAnalyze, isLoading }: JobInputFormProps) => {
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"url" | "description" | "recruiter">("url");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAnalyze(input.trim(), activeTab);
    }
  };

  const placeholders = {
    url: "Paste the job listing URL here...\ne.g., https://linkedin.com/jobs/view/123456",
    description: "Paste the full job description text here...\n\nInclude details like company name, requirements, salary, and any contact information mentioned.",
    recruiter: "Paste the recruiter's profile URL or contact info...\ne.g., https://linkedin.com/in/recruiter-name",
  };

  const tips = {
    url: "We'll analyze the domain, company, and job details from the URL.",
    description: "Include as much detail as possible for a more accurate analysis.",
    recruiter: "We'll check the recruiter's profile legitimacy and history.",
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="glass-card rounded-2xl p-6 md:p-8 cyber-border">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-secondary/50">
            <TabsTrigger value="url" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Job URL</span>
            </TabsTrigger>
            <TabsTrigger value="description" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Description</span>
            </TabsTrigger>
            <TabsTrigger value="recruiter" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Recruiter</span>
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="url" className="mt-0">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholders.url}
                className="min-h-[150px] bg-secondary/30 border-border/50 focus:border-primary/50 resize-none"
              />
            </TabsContent>

            <TabsContent value="description" className="mt-0">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholders.description}
                className="min-h-[200px] bg-secondary/30 border-border/50 focus:border-primary/50 resize-none"
              />
            </TabsContent>

            <TabsContent value="recruiter" className="mt-0">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholders.recruiter}
                className="min-h-[150px] bg-secondary/30 border-border/50 focus:border-primary/50 resize-none"
              />
            </TabsContent>

            {/* Tip */}
            <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{tips[activeTab]}</p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={!input.trim() || isLoading}
              className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90 cyber-glow h-14 text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Analyze Job
                </>
              )}
            </Button>
          </form>
        </Tabs>
      </div>
    </div>
  );
};

export default JobInputForm;
