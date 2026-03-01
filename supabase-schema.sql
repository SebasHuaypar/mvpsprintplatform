-- ==========================================
-- MVP Sprint Platform — Supabase Schema
-- ==========================================
-- Run this SQL in your Supabase SQL Editor

-- 0. Helper function to check admin role (bypasses RLS to avoid infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  long_description TEXT,
  category TEXT CHECK (category IN ('healthtech', 'agritech', 'open_innovation')),
  country TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  demo_url TEXT,
  video_url TEXT,
  product_status TEXT CHECK (product_status IN ('prototype', 'beta', 'live')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'published')),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create founders table
CREATE TABLE IF NOT EXISTS public.founders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  photo_url TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_founders_project ON public.founders(project_id);

-- 5. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founders ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 6. RLS Policies for PROFILES
-- ==========================================
-- IMPORTANT: Profiles policies CANNOT query profiles (infinite recursion)
-- So we use simple auth.uid() checks or the is_admin() SECURITY DEFINER function

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles (uses SECURITY DEFINER function)
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Allow insert (for service role user creation)
CREATE POLICY "Allow insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ==========================================
-- 7. RLS Policies for PROJECTS
-- ==========================================

-- Anyone can read published projects (public gallery)
CREATE POLICY "Anyone can read published projects"
  ON public.projects FOR SELECT
  USING (status = 'published');

-- Users can read their own projects (any status)
CREATE POLICY "Users can read own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = owner_id);

-- Admins can read all projects
CREATE POLICY "Admins can read all projects"
  ON public.projects FOR SELECT
  USING (public.is_admin());

-- Users can insert their own projects
CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Admins can update any project (approve/reject/feature)
CREATE POLICY "Admins can update any project"
  ON public.projects FOR UPDATE
  USING (public.is_admin());

-- ==========================================
-- 8. RLS Policies for FOUNDERS
-- ==========================================

-- Anyone can read founders of published projects
CREATE POLICY "Anyone can read founders of published projects"
  ON public.founders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND status = 'published')
  );

-- Users can read founders of their own projects
CREATE POLICY "Users can read own project founders"
  ON public.founders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
  );

-- Users can manage founders of their own projects
CREATE POLICY "Users can insert own project founders"
  ON public.founders FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can update own project founders"
  ON public.founders FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can delete own project founders"
  ON public.founders FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
  );

-- Admins can read all founders
CREATE POLICY "Admins can read all founders"
  ON public.founders FOR SELECT
  USING (public.is_admin());
