-- Add table for analysis summaries (Fazit)
CREATE TABLE IF NOT EXISTS analysis_summaries (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  total_mentions INTEGER NOT NULL DEFAULT 0,
  total_citations INTEGER NOT NULL DEFAULT 0,
  best_prompts TEXT NOT NULL, -- JSON array of {question, mentions, citations}
  other_sources TEXT NOT NULL, -- JSON object of {domain: count}
  created_at TEXT NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analysis_summaries_run ON analysis_summaries(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_analysis_summaries_created ON analysis_summaries(created_at);
