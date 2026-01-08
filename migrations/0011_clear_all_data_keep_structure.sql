-- ============================================================================
-- Clear All Data - Keep Structure
-- ============================================================================
-- This migration deletes ALL data from ALL tables but keeps the table structure intact
-- Tables are deleted in order to respect foreign key constraints (children first, then parents)
-- Note: Cloudflare D1 does not support SQL transactions, so each DELETE is executed separately
-- Note: Only deletes from tables that actually exist (multi-tenant tables were removed in 0007)
-- ============================================================================

-- ============================================================================
-- INITIAL SCHEMA TABLES (0001_initial_schema.sql)
-- ============================================================================
-- Delete from deepest child tables first

-- Delete from competitor_mentions (links prompt_analyses)
DELETE FROM competitor_mentions;

-- Delete from citations (links llm_responses)
DELETE FROM citations;

-- Delete from prompt_analyses (links prompts)
DELETE FROM prompt_analyses;

-- Delete from category_metrics (links analysis_runs and categories)
DELETE FROM category_metrics;

-- Delete from competitive_analyses (links analysis_runs)
DELETE FROM competitive_analyses;

-- Delete from time_series (links analysis_runs)
DELETE FROM time_series;

-- Delete from llm_responses (links prompts)
DELETE FROM llm_responses;

-- Delete from prompts (links analysis_runs and categories)
DELETE FROM prompts;

-- Delete from categories (links analysis_runs)
DELETE FROM categories;

-- Delete from analysis_runs (parent table)
DELETE FROM analysis_runs;

-- ============================================================================
-- SUMMARY TABLES (0006_add_summaries.sql)
-- ============================================================================

-- Delete from analysis_summaries (links analysis_runs)
DELETE FROM analysis_summaries;

-- ============================================================================
-- COMPANY & SCHEDULED TABLES (0004_companies.sql)
-- ============================================================================

-- Delete from scheduled_runs (links companies)
DELETE FROM scheduled_runs;

-- Delete from company_prompts (links companies)
DELETE FROM company_prompts;

-- ============================================================================
-- COMPANIES TABLE (0004_companies.sql)
-- ============================================================================
-- Delete companies last (it's referenced by many tables)
DELETE FROM companies;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, all tables should be empty but still exist
-- You can verify with: SELECT COUNT(*) FROM <table_name>;
-- All counts should return 0
