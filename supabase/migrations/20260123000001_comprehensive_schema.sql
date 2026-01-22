-- Comprehensive database schema for Job Scam Detection Platform

-- Companies table for verified company information
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  linkedin_url TEXT,
  linkedin_company_id TEXT,
  website_verified BOOLEAN DEFAULT false,
  linkedin_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP WITH TIME ZONE,
  company_size TEXT,
  industry TEXT,
  description TEXT,
  headquarters TEXT,
  founded_year INTEGER,
  is_legitimate BOOLEAN DEFAULT false,
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Domain analysis table for tracking domain authenticity
CREATE TABLE public.domain_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  is_free_platform BOOLEAN DEFAULT false,
  platform_type TEXT, -- 'google_forms', 'notion', 'firebase', 'wix', 'url_shortener', etc.
  has_ssl BOOLEAN DEFAULT false,
  ssl_issuer TEXT,
  domain_age_days INTEGER,
  creation_date TIMESTAMP WITH TIME ZONE,
  expiration_date TIMESTAMP WITH TIME ZONE,
  registrar TEXT,
  nameservers TEXT[],
  ip_addresses TEXT[],
  is_suspicious BOOLEAN DEFAULT false,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Job analyses table for storing analysis results
CREATE TABLE public.job_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_url TEXT,
  company_name TEXT,
  recruiter_email TEXT,
  recruiter_name TEXT,
  job_description TEXT,
  job_title TEXT,
  extracted_domain TEXT,
  domain_analysis_id UUID REFERENCES public.domain_analyses(id),
  company_id UUID REFERENCES public.companies(id),
  
  -- Analysis results
  final_risk_score INTEGER NOT NULL CHECK (final_risk_score >= 0 AND final_risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('legit', 'suspicious', 'high_risk')),
  risk_summary TEXT,
  
  -- Component scores
  domain_risk_score INTEGER DEFAULT 0 CHECK (domain_risk_score >= 0 AND domain_risk_score <= 100),
  company_verification_score INTEGER DEFAULT 0 CHECK (company_verification_score >= 0 AND company_verification_score <= 100),
  careers_page_match_score INTEGER DEFAULT 0 CHECK (careers_page_match_score >= 0 AND careers_page_match_score <= 100),
  email_authenticity_score INTEGER DEFAULT 0 CHECK (email_authenticity_score >= 0 AND email_authenticity_score <= 100),
  language_risk_score INTEGER DEFAULT 0 CHECK (language_risk_score >= 0 AND language_risk_score <= 100),
  community_risk_score INTEGER DEFAULT 0 CHECK (community_risk_score >= 0 AND community_risk_score <= 100),
  
  -- Detailed results (JSON)
  verification_steps JSONB,
  recruiter_details JSONB,
  risk_factors JSONB,
  
  -- Metadata
  analysis_duration_ms INTEGER,
  api_version TEXT DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scam language patterns for detection
CREATE TABLE public.scam_language_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern TEXT NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('payment_request', 'urgency_tactic', 'unrealistic_offer', 'vague_description', 'suspicious_contact')),
  risk_weight INTEGER DEFAULT 10 CHECK (risk_weight >= 1 AND risk_weight <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Free platform domains for quick detection
CREATE TABLE public.free_platform_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  platform_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced scam_reports table (replacing the existing one)
DROP TABLE IF EXISTS public.scam_reports CASCADE;
CREATE TABLE public.scam_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_analysis_id UUID REFERENCES public.job_analyses(id),
  
  -- Report details
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'whatsapp', 'telegram', 'instagram', 'email', 'other')),
  job_url TEXT,
  company_name TEXT,
  recruiter_name TEXT,
  recruiter_email TEXT,
  recruiter_phone TEXT,
  upi_id TEXT,
  description TEXT NOT NULL,
  
  -- Evidence
  proof_urls TEXT[],
  evidence_files TEXT[], -- Storage references
  
  -- Classification
  risk_level TEXT DEFAULT 'suspicious' CHECK (risk_level IN ('legit', 'suspicious', 'high_risk')),
  scam_type TEXT[], -- ['payment', 'identity_theft', 'fake_company', 'phishing', etc.]
  
  -- Community feedback
  verified BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  reports_count INTEGER DEFAULT 1, -- Count of duplicate reports
  
  -- Moderation
  moderator_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rate limiting for API protection
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP address or API key
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  window_duration_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scam_language_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.free_platform_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scam_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Public read policies for verification data
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Anyone can view domain analyses" ON public.domain_analyses FOR SELECT USING (true);
CREATE POLICY "Anyone can view job analyses" ON public.job_analyses FOR SELECT USING (true);
CREATE POLICY "Anyone can view scam patterns" ON public.scam_language_patterns FOR SELECT USING (true);
CREATE POLICY "Anyone can view free platforms" ON public.free_platform_domains FOR SELECT USING (true);
CREATE POLICY "Anyone can view scam reports" ON public.scam_reports FOR SELECT USING (true);

-- Insert policies for anonymous access
CREATE POLICY "Anyone can insert job analyses" ON public.job_analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert scam reports" ON public.scam_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert rate limits" ON public.rate_limits FOR INSERT WITH CHECK (true);

-- Admin-only policies for sensitive operations
CREATE POLICY "Only admins can modify companies" ON public.companies FOR ALL USING (false);
CREATE POLICY "Only admins can modify patterns" ON public.scam_language_patterns FOR ALL USING (false);
CREATE POLICY "Only admins can modify platforms" ON public.free_platform_domains FOR ALL USING (false);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_job_analyses_updated_at BEFORE UPDATE ON public.job_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_scam_language_patterns_updated_at BEFORE UPDATE ON public.scam_language_patterns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_scam_reports_updated_at BEFORE UPDATE ON public.scam_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON public.rate_limits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_companies_domain ON public.companies(domain);
CREATE INDEX idx_companies_linkedin_id ON public.companies(linkedin_company_id);
CREATE INDEX idx_companies_verified ON public.companies(website_verified, linkedin_verified);

CREATE INDEX idx_domain_analyses_domain ON public.domain_analyses(domain);
CREATE INDEX idx_domain_analyses_suspicious ON public.domain_analyses(is_suspicious);
CREATE INDEX idx_domain_analyses_date ON public.domain_analyses(analysis_date);

CREATE INDEX idx_job_analyses_company ON public.job_analyses(company_id);
CREATE INDEX idx_job_analyses_domain ON public.job_analyses(domain_analysis_id);
CREATE INDEX idx_job_analyses_risk_level ON public.job_analyses(risk_level);
CREATE INDEX idx_job_analyses_email ON public.job_analyses(recruiter_email);
CREATE INDEX idx_job_analyses_created_at ON public.job_analyses(created_at DESC);

CREATE INDEX idx_scam_reports_company ON public.scam_reports(company_name);
CREATE INDEX idx_scam_reports_email ON public.scam_reports(recruiter_email);
CREATE INDEX idx_scam_reports_phone ON public.scam_reports(recruiter_phone);
CREATE INDEX idx_scam_reports_upi ON public.scam_reports(upi_id);
CREATE INDEX idx_scam_reports_platform ON public.scam_reports(platform);
CREATE INDEX idx_scam_reports_status ON public.scam_reports(status);
CREATE INDEX idx_scam_reports_created_at ON public.scam_reports(created_at DESC);

CREATE INDEX idx_rate_limits_identifier ON public.rate_limits(identifier, endpoint);
CREATE INDEX idx_rate_limits_window ON public.rate_limits(window_start);

-- Insert initial scam language patterns
INSERT INTO public.scam_language_patterns (pattern, pattern_type, risk_weight) VALUES
('registration fee', 'payment_request', 80),
('training fee', 'payment_request', 75),
('refundable deposit', 'payment_request', 85),
('pay to join', 'payment_request', 90),
('certificate after payment', 'payment_request', 70),
('immediate join', 'urgency_tactic', 40),
('urgent hiring', 'urgency_tactic', 35),
('limited slots', 'urgency_tactic', 45),
('guaranteed placement', 'unrealistic_offer', 60),
('high salary no experience', 'unrealistic_offer', 55),
('work from home no interview', 'unrealistic_offer', 65),
('send your documents', 'suspicious_contact', 50),
('share personal details', 'suspicious_contact', 55),
('click this link', 'suspicious_contact', 45),
('download this app', 'suspicious_contact', 40);

-- Insert known free platform domains
INSERT INTO public.free_platform_domains (domain, platform_type) VALUES
('docs.google.com', 'google_forms'),
('forms.gle', 'google_forms'),
('notion.so', 'notion'),
('notion.site', 'notion'),
('firebaseapp.com', 'firebase'),
('web.app', 'firebase'),
('wixsite.com', 'wix'),
('wix.com', 'wix'),
('bit.ly', 'url_shortener'),
('tinyurl.com', 'url_shortener'),
('cutt.ly', 'url_shortener'),
('t.co', 'url_shortener'),
('short.link', 'url_shortener');
