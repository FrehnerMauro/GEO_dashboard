-- Cleanup: Remove unused tables that are not used by backend or frontend
-- These tables were created for multi-tenant schema but are not actually used

-- Disable foreign key constraints temporarily
PRAGMA foreign_keys = OFF;

-- Drop indexes first (before dropping tables)
DROP INDEX IF EXISTS idx_web_contexts_hash;
DROP INDEX IF EXISTS idx_web_contexts_response;
DROP INDEX IF EXISTS idx_web_contexts_url;
DROP INDEX IF EXISTS idx_analysis_prompt_responses_analysis;
DROP INDEX IF EXISTS idx_analysis_prompt_responses_prompt;
DROP INDEX IF EXISTS idx_analysis_prompt_responses_response;
DROP INDEX IF EXISTS idx_analysis_prompts_analysis;
DROP INDEX IF EXISTS idx_analysis_prompts_prompt;
DROP INDEX IF EXISTS idx_analysis_prompts_position;
DROP INDEX IF EXISTS idx_prompt_metrics_analysis;
DROP INDEX IF EXISTS idx_prompt_metrics_prompt;
DROP INDEX IF EXISTS idx_prompt_metrics_citations;
DROP INDEX IF EXISTS idx_prompt_metrics_mentions;
DROP INDEX IF EXISTS idx_analyses_company_latest;
DROP INDEX IF EXISTS idx_analyses_company;
DROP INDEX IF EXISTS idx_analyses_timestamp;
DROP INDEX IF EXISTS idx_analyses_latest;
DROP INDEX IF EXISTS idx_global_ai_responses_hash;
DROP INDEX IF EXISTS idx_global_ai_responses_prompt;
DROP INDEX IF EXISTS idx_global_ai_responses_web_context;
DROP INDEX IF EXISTS idx_global_prompts_hash;
DROP INDEX IF EXISTS idx_global_prompts_question;
DROP INDEX IF EXISTS idx_global_prompts_language;

-- Drop tables in correct order (child tables first, then parent tables)
-- Web contexts references global_ai_responses
DROP TABLE IF EXISTS web_contexts;

-- Analysis prompt responses references analyses, global_prompts, global_ai_responses
DROP TABLE IF EXISTS analysis_prompt_responses;

-- Analysis prompts references analyses, global_prompts
DROP TABLE IF EXISTS analysis_prompts;

-- Prompt metrics references analyses, global_prompts
DROP TABLE IF EXISTS prompt_metrics;

-- Analyses references companies
DROP TABLE IF EXISTS analyses;

-- Global AI responses references global_prompts
DROP TABLE IF EXISTS global_ai_responses;

-- Global prompts (no dependencies)
DROP TABLE IF EXISTS global_prompts;

-- Drop unused workflow tables
DROP TABLE IF EXISTS user_prompts;

-- Re-enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Note: 
-- - ai_readiness_runs is kept as it might be used by AI Readiness feature
-- - scheduled_runs is kept as it's used by the backend
-- - time_series is kept as it's used by the backend
