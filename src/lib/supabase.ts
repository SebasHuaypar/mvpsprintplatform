import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
}

// Convenience getter
export const supabase = typeof window !== 'undefined'
  ? getSupabase()
  : (null as unknown as SupabaseClient)

// Types
export interface Profile {
  id: string
  email: string
  role: 'participant' | 'admin'
  full_name?: string
  created_at: string
}

export interface Project {
  id: string
  owner_id: string
  name: string
  slug: string
  short_description: string | null
  long_description: string | null
  category: 'healthtech' | 'agritech' | 'open_innovation' | null
  country: string | null
  logo_url: string | null
  cover_image_url: string | null
  demo_url: string | null
  video_url: string | null
  product_status: 'prototype' | 'beta' | 'live' | null
  status: 'draft' | 'under_review' | 'published'
  featured: boolean
  created_at: string
  updated_at: string
}

export interface Founder {
  id: string
  project_id: string
  name: string
  role: string | null
  photo_url: string | null
  linkedin_url: string | null
  instagram_url: string | null
  country: string | null
}

export interface ProjectWithFounders extends Project {
  founders: Founder[]
}
