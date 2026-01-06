-- Add fields for interactive workflow
ALTER TABLE analysis_runs ADD COLUMN step TEXT DEFAULT 'sitemap';
ALTER TABLE analysis_runs ADD COLUMN sitemap_urls TEXT; -- JSON array
ALTER TABLE analysis_runs ADD COLUMN selected_categories TEXT; -- JSON array of selected category IDs
ALTER TABLE analysis_runs ADD COLUMN custom_categories TEXT; -- JSON array of user-created categories
ALTER TABLE analysis_runs ADD COLUMN selected_prompts TEXT; -- JSON array of selected/edited prompts
ALTER TABLE analysis_runs ADD COLUMN prompts_generated INTEGER DEFAULT 0;

-- Add table for user-editable prompts
CREATE TABLE IF NOT EXISTS user_prompts (
  id TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  question TEXT NOT NULL,
  category_id TEXT,
  is_custom BOOLEAN DEFAULT 0,
  is_selected BOOLEAN DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id)
);







