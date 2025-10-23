-- Add sequence for global audit numbers
CREATE SEQUENCE IF NOT EXISTS public.audit_number_seq START 1;

-- Add audit_number column with automatic increment
ALTER TABLE public.quiz_responses
  ADD COLUMN IF NOT EXISTS audit_number BIGINT NOT NULL DEFAULT nextval('public.audit_number_seq');

-- Ensure audit numbers are unique for lookup in админке
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_responses_audit_number
  ON public.quiz_responses(audit_number);
