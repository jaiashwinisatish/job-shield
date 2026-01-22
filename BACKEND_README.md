# Job Scam Detection Platform - Backend Documentation

## Overview

This is a production-grade backend for a Job Scam Detection Platform that determines whether a job opportunity is legitimate or fraudulent using real verification logic and data sources. The backend is implemented using Supabase (PostgreSQL) and Supabase Edge Functions (TypeScript) and exposes a REST-style API.

## Architecture

### Core Components

1. **Database Schema** (`supabase/migrations/`)
   - Comprehensive PostgreSQL schema for job analysis, company verification, and scam detection
   - Tables for companies, domain analyses, job analyses, scam reports, and rate limiting
   - Row Level Security (RLS) policies for secure data access

2. **Edge Functions** (`supabase/functions/`)
   - **Domain Verification** (`domain-verify/`) - DNS lookup, SSL check, WHOIS data
   - **Company Verification** (`company-verify/`) - LinkedIn API integration, website verification
   - **Careers Page Matching** (`careers-match/`) - Official job listing verification
   - **Email Verification** (`email-verify/`) - Recruiter email authentication
   - **Language Analysis** (`language-scan/`) - NLP-based scam pattern detection
   - **Job Analysis** (`analyze-job-v2/`) - Main API endpoint with weighted scoring
   - **Scam Reporting** (`report-scam/`) - Community intelligence aggregation
   - **Rate Limiting** (`rate-limit/`) - API protection and abuse prevention

## API Endpoints

### Main Analysis Endpoint

**POST** `/functions/v1/analyze-job-v2`

Analyzes a job opportunity using multiple verification signals.

**Request Body:**
```json
{
  "job_url": "https://example.com/job-posting",
  "company_name": "Tech Company Inc",
  "recruiter_email": "recruiter@techcompany.com",
  "recruiter_name": "John Doe",
  "job_description": "Full job description text...",
  "job_title": "Software Engineer"
}
```

**Response:**
```json
{
  "job_analysis": {
    "job_url": "https://example.com/job-posting",
    "company_name": "Tech Company Inc",
    "recruiter_email": "recruiter@techcompany.com",
    "recruiter_name": "John Doe",
    "job_title": "Software Engineer",
    "extracted_domain": "techcompany.com"
  },
  "final_risk_score": 25,
  "risk_level": "legit",
  "risk_summary": "LEGIT: This job appears to be legitimate with proper company verification...",
  "component_scores": {
    "domain_risk_score": 10,
    "company_verification_score": 85,
    "careers_page_match_score": 90,
    "email_authenticity_score": 15,
    "language_risk_score": 20,
    "community_risk_score": 5
  },
  "verification_steps": [
    {
      "id": "domain_check",
      "label": "Domain Authenticity",
      "status": "pass",
      "detail": "Domain appears legitimate with proper SSL",
      "score_impact": 10
    }
  ],
  "recruiter_details": {
    "name": "John Doe",
    "email": "recruiter@techcompany.com",
    "email_type": "corporate",
    "company_association": "Tech Company Inc",
    "trust_score": 85,
    "red_flags": []
  },
  "risk_factors": {
    "high_risk": [],
    "medium_risk": [],
    "low_risk": ["Domain needs verification"]
  },
  "recommendations": {
    "immediate_actions": ["✅ Job appears legitimate - proceed with normal caution"],
    "verification_steps": ["Visit the company's official website directly"],
    "safety_tips": ["Never pay for a job or training"]
  },
  "analysis_metadata": {
    "analysis_duration_ms": 1250,
    "components_analyzed": ["domain_analysis", "company_verification", "email_verification"],
    "confidence_score": 85,
    "api_version": "2.0"
  }
}
```

### Scam Reporting Endpoint

**POST** `/functions/v1/report-scam`

Submit community scam reports.

**Request Body:**
```json
{
  "platform": "linkedin",
  "job_url": "https://linkedin.com/jobs/view/123",
  "company_name": "Fake Company",
  "recruiter_name": "Scammer",
  "recruiter_email": "scammer@gmail.com",
  "description": "This job asked for payment for training...",
  "scam_type": ["payment", "fake_company"],
  "proof_urls": ["https://example.com/screenshot.png"]
}
```

### Individual Verification Endpoints

- **POST** `/functions/v1/domain-verify` - Domain authenticity checking
- **POST** `/functions/v1/company-verify` - Company verification
- **POST** `/functions/v1/careers-match` - Careers page matching
- **POST** `/functions/v1/email-verify` - Email verification
- **POST** `/functions/v1/language-scan` - Language pattern analysis

## Risk Scoring Algorithm

The system uses a weighted risk scoring algorithm combining multiple verification signals:

| Component | Weight | Description |
|-----------|--------|-------------|
| Domain Authenticity | 20% | DNS, SSL, WHOIS, free platform detection |
| Company Verification | 25% | LinkedIn, website verification, consistency |
| Careers Page Match | 15% | Official job listing verification |
| Email Authenticity | 20% | Corporate vs personal email analysis |
| Language Analysis | 15% | NLP scam pattern detection |
| Community Intelligence | 5% | Historical scam reports |

**Risk Levels:**
- **Legit (0-30)**: Low risk, appears legitimate
- **Suspicious (31-60)**: Medium risk, additional verification needed
- **High Risk (61-100)**: High risk, likely fraudulent

## Verification Logic

### Domain Authenticity
- Extracts domain from job URLs
- Checks against known free platforms (Google Forms, Notion, Firebase, etc.)
- Performs DNS resolution and SSL certificate validation
- WHOIS data analysis for domain age and registrar information
- Identifies suspicious TLDs and hosting patterns

### Company Verification
- LinkedIn company search and verification
- Official website accessibility and content analysis
- Cross-referencing company information across sources
- Consistency checks between website and LinkedIn presence
- Company size, industry, and establishment verification

### Careers Page Matching
- Automated discovery of company careers pages
- Job listing extraction and matching
- Title similarity analysis
- Verification of job posting authenticity
- Recent posting activity analysis

### Email Authentication
- Corporate vs personal email domain detection
- Domain consistency with company information
- Suspicious email pattern identification
- MX record validation
- Email deliverability checking

### Language Pattern Detection
- 50+ scam language patterns across 6 categories
- Payment request detection (fees, deposits, etc.)
- Urgency tactic identification
- Unrealistic offer detection
- Vague description analysis
- Identity request monitoring

## Database Schema

### Key Tables

- **companies** - Verified company information
- **domain_analyses** - Domain verification results
- **job_analyses** - Complete job analysis results
- **scam_reports** - Community scam intelligence
- **scam_language_patterns** - Configurable scam patterns
- **free_platform_domains** - Known free platform domains
- **rate_limits** - API rate limiting

### Security Features

- Row Level Security (RLS) on all tables
- Anonymous access for public data
- Service role for backend operations
- Automatic timestamp updates
- Input validation and sanitization

## Rate Limiting

Per-endpoint rate limiting to prevent abuse:

| Endpoint | Requests/Minute | Requests/Hour | Requests/Day |
|----------|----------------|---------------|-------------|
| analyze-job-v2 | 10 | 100 | 500 |
| domain-verify | 20 | 200 | 1000 |
| company-verify | 15 | 150 | 750 |
| report-scam | 5 | 50 | 200 |

## Deployment

### Prerequisites

- Supabase account with project created
- Node.js 18+ for local development
- Supabase CLI installed

### Setup Steps

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link to Project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Apply Database Migrations**
   ```bash
   supabase db push
   ```

5. **Deploy Edge Functions**
   ```bash
   supabase functions deploy domain-verify
   supabase functions deploy company-verify
   supabase functions deploy careers-match
   supabase functions deploy email-verify
   supabase functions deploy language-scan
   supabase functions deploy analyze-job-v2
   supabase functions deploy report-scam
   supabase functions deploy rate-limit
   ```

6. **Set Environment Variables**
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-key
   # Add any other required API keys
   ```

### Environment Variables

Required environment variables for Edge Functions:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access
- `LINKEDIN_API_KEY` - LinkedIn API access (for production)
- `WHOIS_API_KEY` - WHOIS service API key (optional)

## Testing

### Local Development

1. **Start Supabase Local**
   ```bash
   supabase start
   ```

2. **Test Functions Locally**
   ```bash
   supabase functions serve --env-file .env.local
   ```

3. **Run Tests**
   ```bash
   # Test individual functions
   curl -i -X POST 'http://localhost:54321/functions/v1/analyze-job-v2' \
     -H 'Authorization: Bearer your-anon-key' \
     -H 'Content-Type: application/json' \
     -d '{"job_url": "https://example.com/job"}'
   ```

### Production Testing

Use the Supabase Function URLs:
```
https://your-project-ref.supabase.co/functions/v1/analyze-job-v2
```

## Monitoring

### Database Monitoring

- Monitor job_analyses table for analysis trends
- Track scam_reports for community intelligence
- Watch rate_limits for API usage patterns

### Function Monitoring

- Supabase Dashboard for function metrics
- Error tracking through console logs
- Performance monitoring for response times

## Security Considerations

1. **Input Validation** - All inputs are validated and sanitized
2. **Rate Limiting** - Prevents API abuse and DoS attacks
3. **Row Level Security** - Database access controls
4. **Environment Variables** - Sensitive data never in code
5. **HTTPS Only** - All communications encrypted
6. **No Sensitive Data in Logs** - PII protection

## Performance Optimization

1. **Caching** - Domain and company verification results cached
2. **Parallel Processing** - Multiple verification steps run concurrently
3. **Database Indexes** - Optimized for common query patterns
4. **Connection Pooling** - Efficient database connections
5. **Timeout Management** - Prevents hanging requests

## Contributing

1. Follow TypeScript best practices
2. Add comprehensive error handling
3. Include proper logging
4. Update documentation
5. Test thoroughly before deployment

## License

This project is proprietary and confidential.
