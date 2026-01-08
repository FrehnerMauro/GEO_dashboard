-- Add missing indexes to improve query performance and prevent D1 timeouts

-- Index for competitor_mentions lookups (used in JOINs)
CREATE INDEX IF NOT EXISTS idx_competitor_mentions_analysis ON competitor_mentions(prompt_analysis_id);

-- Index for llm_responses timestamp ordering (used frequently)
CREATE INDEX IF NOT EXISTS idx_llm_responses_timestamp ON llm_responses(timestamp);

-- Index for category_metrics lookups
CREATE INDEX IF NOT EXISTS idx_category_metrics_run ON category_metrics(analysis_run_id);

-- Composite index for prompts lookups by run and category
CREATE INDEX IF NOT EXISTS idx_prompts_run_category ON prompts(analysis_run_id, category_id);
