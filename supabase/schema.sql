-- Users table is handled by Supabase Auth (auth.users)
-- We can create a public.profiles table if we want to store additional info

-- Create resumes table
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    parsed_content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_descriptions table
CREATE TABLE IF NOT EXISTS public.job_descriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT,
    job_title TEXT NOT NULL,
    original_text TEXT NOT NULL,
    extracted_keywords JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resume_versions table (for tailored resumes)
CREATE TABLE IF NOT EXISTS public.resume_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    master_resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
    job_description_id UUID REFERENCES public.job_descriptions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tailored_content JSONB NOT NULL,
    storage_path_pdf TEXT,
    storage_path_docx TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ats_scores table
CREATE TABLE IF NOT EXISTS public.ats_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resume_version_id UUID REFERENCES public.resume_versions(id) ON DELETE CASCADE,
    original_score INTEGER,
    optimized_score INTEGER NOT NULL,
    keyword_match_percentage INTEGER,
    missing_keywords JSONB,
    suggestions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create optimizations audit log
CREATE TABLE IF NOT EXISTS public.optimizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resume_version_id UUID REFERENCES public.resume_versions(id) ON DELETE CASCADE,
    section_name TEXT NOT NULL, -- e.g., 'Summary', 'Experience'
    original_text TEXT,
    optimized_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
-- Enables RLS
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ats_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimizations ENABLE ROW LEVEL SECURITY;

-- Resumes Policies
CREATE POLICY "Users can view their own resumes" ON public.resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own resumes" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own resumes" ON public.resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own resumes" ON public.resumes FOR DELETE USING (auth.uid() = user_id);

-- Job Descriptions Policies
CREATE POLICY "Users can view their own job descriptions" ON public.job_descriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own job descriptions" ON public.job_descriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own job descriptions" ON public.job_descriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own job descriptions" ON public.job_descriptions FOR DELETE USING (auth.uid() = user_id);

-- Resume Versions Policies
CREATE POLICY "Users can view their own resume versions" ON public.resume_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own resume versions" ON public.resume_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own resume versions" ON public.resume_versions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own resume versions" ON public.resume_versions FOR DELETE USING (auth.uid() = user_id);

-- ATS Scores Policies
-- Assuming ats_scores are linked to resume_versions, which are linked to user_id
CREATE POLICY "Users can view their own ats scores" ON public.ats_scores FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.resume_versions WHERE id = ats_scores.resume_version_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert their own ats scores" ON public.ats_scores FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.resume_versions WHERE id = ats_scores.resume_version_id AND user_id = auth.uid())
);

-- Optimizations Policies
CREATE POLICY "Users can view their own optimizations" ON public.optimizations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.resume_versions WHERE id = optimizations.resume_version_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert their own optimizations" ON public.optimizations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.resume_versions WHERE id = optimizations.resume_version_id AND user_id = auth.uid())
);
