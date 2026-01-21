-- Create scam_reports table for community database
CREATE TABLE public.scam_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'whatsapp', 'telegram', 'instagram', 'other')),
  job_link TEXT,
  recruiter_name TEXT,
  description TEXT NOT NULL,
  proof_url TEXT,
  risk_level TEXT DEFAULT 'suspicious' CHECK (risk_level IN ('legit', 'suspicious', 'high_risk')),
  verified BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.scam_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view scam reports (public database)
CREATE POLICY "Anyone can view scam reports" 
ON public.scam_reports 
FOR SELECT 
USING (true);

-- Allow anyone to insert scam reports (anonymous reporting)
CREATE POLICY "Anyone can report scams" 
ON public.scam_reports 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_scam_reports_updated_at
BEFORE UPDATE ON public.scam_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster searches
CREATE INDEX idx_scam_reports_platform ON public.scam_reports(platform);
CREATE INDEX idx_scam_reports_risk_level ON public.scam_reports(risk_level);
CREATE INDEX idx_scam_reports_created_at ON public.scam_reports(created_at DESC);