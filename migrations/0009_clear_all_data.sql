-- Clear all data from all tables
-- This deletes all records but keeps the table structure intact
-- Tables are deleted in order to respect foreign key constraints (children first, then parents)
-- Note: Cloudflare D1 does not support SQL transactions, so each DELETE is executed separately
-- This migration only deletes from tables that exist in the initial schema (0001_initial_schema.sql)

-- Delete from deepest child tables first
DELETE FROM competitor_mentions;
DELETE FROM citations;
DELETE FROM llm_responses;
DELETE FROM prompt_analyses;
DELETE FROM category_metrics;
DELETE FROM competitive_analyses;

-- Delete from intermediate tables
DELETE FROM prompts;
DELETE FROM categories;

-- Delete from parent tables
DELETE FROM analysis_runs;
