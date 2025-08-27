-- Create table for quiz responses
CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  questions JSONB NOT NULL,
  answers JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for anonymous surveys)
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (anonymous survey)
CREATE POLICY "Anyone can submit quiz responses" 
ON public.quiz_responses 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow anyone to view (for admin dashboard)
CREATE POLICY "Anyone can view quiz responses" 
ON public.quiz_responses 
FOR SELECT 
USING (true);

-- Create index for better performance
CREATE INDEX idx_quiz_responses_department ON public.quiz_responses(department);
CREATE INDEX idx_quiz_responses_position ON public.quiz_responses(position);
CREATE INDEX idx_quiz_responses_completed_at ON public.quiz_responses(completed_at);