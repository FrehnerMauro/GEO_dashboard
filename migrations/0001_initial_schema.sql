-- Initial schema for GEO platform

-- User inputs and analysis runs
CREATE TABLE IF NOT EXISTS analysis_runs (
  id TEXT PRIMARY KEY,
  website_url TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  language TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence REAL NOT NULL,
  source_pages TEXT NOT NULL, -- JSON array
  created_at TEXT NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id)
);

-- Prompts
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  question TEXT NOT NULL,
  language TEXT NOT NULL,
  country TEXT,
  region TEXT,
  intent TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- LLM responses
CREATE TABLE IF NOT EXISTS llm_responses (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL,
  output_text TEXT NOT NULL,
  model TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (prompt_id) REFERENCES prompts(id)
);

-- Citations
CREATE TABLE IF NOT EXISTS citations (
  id TEXT PRIMARY KEY,
  llm_response_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  snippet TEXT,
  FOREIGN KEY (llm_response_id) REFERENCES llm_responses(id)
);

-- Prompt analyses
CREATE TABLE IF NOT EXISTS prompt_analyses (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL,
  brand_mentions_exact INTEGER NOT NULL DEFAULT 0,
  brand_mentions_fuzzy INTEGER NOT NULL DEFAULT 0,
  brand_mentions_contexts TEXT NOT NULL, -- JSON array
  citation_count INTEGER NOT NULL DEFAULT 0,
  citation_urls TEXT NOT NULL, -- JSON array
  sentiment_tone TEXT NOT NULL,
  sentiment_confidence REAL NOT NULL,
  sentiment_keywords TEXT NOT NULL, -- JSON array
  timestamp TEXT NOT NULL,
  FOREIGN KEY (prompt_id) REFERENCES prompts(id)
);

-- Competitor mentions
CREATE TABLE IF NOT EXISTS competitor_mentions (
  id TEXT PRIMARY KEY,
  prompt_analysis_id TEXT NOT NULL,
  competitor_name TEXT NOT NULL,
  mention_count INTEGER NOT NULL,
  contexts TEXT NOT NULL, -- JSON array
  citation_urls TEXT NOT NULL, -- JSON array
  FOREIGN KEY (prompt_analysis_id) REFERENCES prompt_analyses(id)
);

-- Category metrics
CREATE TABLE IF NOT EXISTS category_metrics (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  visibility_score REAL NOT NULL,
  citation_rate REAL NOT NULL,
  brand_mention_rate REAL NOT NULL,
  competitor_mention_rate REAL NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Competitive analysis
CREATE TABLE IF NOT EXISTS competitive_analyses (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  brand_share REAL NOT NULL,
  competitor_shares TEXT NOT NULL, -- JSON object
  white_space_topics TEXT NOT NULL, -- JSON array
  dominated_prompts TEXT NOT NULL, -- JSON array
  missing_brand_prompts TEXT NOT NULL, -- JSON array
  timestamp TEXT NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id)
);

-- Time series data
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analysis_runs_website ON analysis_runs(website_url);
CREATE INDEX IF NOT EXISTS idx_categories_run ON categories(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_prompts_run ON prompts(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_llm_responses_prompt ON llm_responses(prompt_id);
CREATE INDEX IF NOT EXISTS idx_citations_response ON citations(llm_response_id);
CREATE INDEX IF NOT EXISTS idx_prompt_analyses_prompt ON prompt_analyses(prompt_id);
CREATE INDEX IF NOT EXISTS idx_time_series_run ON time_series(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_time_series_timestamp ON time_series(timestamp);







