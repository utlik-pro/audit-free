-- Add archived column to quiz_responses table
ALTER TABLE quiz_responses
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_quiz_responses_archived ON quiz_responses(archived);