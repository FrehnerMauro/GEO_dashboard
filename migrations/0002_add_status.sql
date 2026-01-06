-- Add status tracking to analysis_runs
ALTER TABLE analysis_runs ADD COLUMN status TEXT DEFAULT 'pending';
ALTER TABLE analysis_runs ADD COLUMN progress TEXT; -- JSON with step progress
ALTER TABLE analysis_runs ADD COLUMN error_message TEXT;







