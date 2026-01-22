import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database, AlertTriangle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const ScamDatabase = () => {
  const [search, setSearch] = useState("");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["scam-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("scam_reports").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const filtered = reports?.filter((r) => r.description.toLowerCase().includes(search.toLowerCase()) || r.recruiter_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Database className="h-4 w-4" />
              Community Reports
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Scam Database</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">Browse reported scams to recognize patterns and protect yourself.</p>
          </div>

          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search reports..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading reports...</p>
          ) : filtered?.length === 0 ? (
            <p className="text-center text-muted-foreground">No reports found.</p>
          ) : (
            <div className="grid gap-4 max-w-3xl mx-auto">
              {filtered?.map((report) => (
                <div key={report.id} className="glass-card rounded-xl p-5 border border-border/50">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-xs bg-secondary text-muted-foreground capitalize">{report.platform}</span>
                        {report.recruiter_name && <span className="text-sm text-foreground font-medium">{report.recruiter_name}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{report.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(report.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ScamDatabase;
