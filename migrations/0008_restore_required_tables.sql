-- Restore required tables that were accidentally dropped or never created
-- These tables are used by the backend

-- Time series data (from 0001_initial_schema.sql)
CREATE TABLE IF NOT EXISTS time_series (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  visibility_score REAL NOT NULL,
  citation_count INTEGER NOT NULL,
  brand_mention_count INTEGER NOT NULL,
  competitor_mention_count INTEGER NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id)
);

CREATE INDEX IF NOT EXISTS idx_time_series_run ON time_series(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_time_series_timestamp ON time_series(timestamp);

-- Scheduled runs (from 0004_companies.sql)
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

CREATE INDEX IF NOT EXISTS idx_scheduled_runs_company ON scheduled_runs(company_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_runs_next_run ON scheduled_runs(next_run_at);
