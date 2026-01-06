-- Add companies/projects table for persistent configuration
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  country TEXT NOT NULL,
  language TEXT NOT NULL,
  region TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Add company_id to analysis_runs
ALTER TABLE analysis_runs ADD COLUMN company_id TEXT;
CREATE INDEX IF NOT EXISTS idx_analysis_runs_company ON analysis_runs(company_id);

-- Create table for saved prompts per company (reusable questions)
CREATE TABLE IF NOT EXISTS company_prompts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  question TEXT NOT NULL,
  category_id TEXT,
  category_name TEXT,
  language TEXT NOT NULL,
  country TEXT,
  region TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Create table for scheduled runs (automatic re-runs)
CREATE TABLE IF NOT EXISTS scheduled_runs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  schedule_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  next_run_at TEXT NOT NULL,
  last_run_at TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Add index for company lookups
CREATE INDEX IF NOT EXISTS idx_companies_website ON companies(website_url);
CREATE INDEX IF NOT EXISTS idx_company_prompts_company ON company_prompts(company_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_runs_company ON scheduled_runs(company_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_runs_next_run ON scheduled_runs(next_run_at);







