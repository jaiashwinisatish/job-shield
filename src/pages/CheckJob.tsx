import { useState } from "react";
import Layout from "@/components/layout/Layout";
import JobInputForm from "@/components/check/JobInputForm";
import AnalysisLoading from "@/components/check/AnalysisLoading";
import AnalysisResults, { AnalysisResult } from "@/components/check/AnalysisResults";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CheckJob = () => {
  const [state, setState] = useState<"input" | "loading" | "results">("input");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async (input: string, type: "url" | "description" | "recruiter") => {
    setState("loading");
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-job", {
        body: { input, type },
      });

      if (error) throw error;
      
      setResult(data);
      setState("results");
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast.error(err.message || "Failed to analyze. Please try again.");
      setState("input");
    }
  };

  const handleReset = () => {
    setState("input");
    setResult(null);
  };

  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          {state === "input" && (
            <>
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Check Job <span className="text-primary">Authenticity</span>
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Paste a job URL, description, or recruiter profile to verify if it's legitimate or a potential scam.
                </p>
              </div>
              <JobInputForm onAnalyze={handleAnalyze} isLoading={false} />
            </>
          )}

          {state === "loading" && <AnalysisLoading isComplete={false} />}

          {state === "results" && result && (
            <AnalysisResults result={result} onReset={handleReset} />
          )}
        </div>
      </section>
    </Layout>
  );
};

export default CheckJob;
