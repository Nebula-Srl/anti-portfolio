-- ==========================================
-- TWINO DATABASE SCHEMA
-- Complete SQL schema for Supabase
-- ==========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLE: twins
-- Stores digital twin profiles
-- ==========================================

CREATE TABLE IF NOT EXISTS twins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]{3,30}$'),
  display_name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  profile_json JSONB NOT NULL,
  transcript TEXT NOT NULL DEFAULT '-',
  documents JSONB DEFAULT '[]'::jsonb,
  documents_text TEXT,
  voice_agent_config JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'cosmic',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments for documentation
COMMENT ON TABLE twins IS 'Stores digital twin profiles created through voice interviews';
COMMENT ON COLUMN twins.slug IS 'Unique URL identifier (e.g., "mario-rossi")';
COMMENT ON COLUMN twins.display_name IS 'Human-readable name displayed on profile';
COMMENT ON COLUMN twins.email IS 'Optional contact email';
COMMENT ON COLUMN twins.profile_json IS 'AI-generated twin profile (identity_summary, thinking_patterns, methodology, etc.)';
COMMENT ON COLUMN twins.transcript IS 'Full transcript of the creation interview';
COMMENT ON COLUMN twins.documents IS 'Array of uploaded document references with metadata';
COMMENT ON COLUMN twins.documents_text IS 'Combined extracted text from all documents for AI context';
COMMENT ON COLUMN twins.theme IS 'Visual theme identifier for personalized backgrounds';

-- ==========================================
-- TABLE: twin_sessions
-- Tracks visitor conversations with twins
-- ==========================================

CREATE TABLE IF NOT EXISTS twin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id UUID NOT NULL REFERENCES twins(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  visitor_session_id TEXT NOT NULL,
  transcript TEXT DEFAULT '',
  summary JSONB DEFAULT '{}'::jsonb,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER
);

COMMENT ON TABLE twin_sessions IS 'Records of visitor conversations with digital twins';
COMMENT ON COLUMN twin_sessions.visitor_session_id IS 'Anonymous visitor identifier';
COMMENT ON COLUMN twin_sessions.transcript IS 'Full conversation transcript';
COMMENT ON COLUMN twin_sessions.summary IS 'AI-generated conversation summary and insights';

-- ==========================================
-- TABLE: skills
-- AI-extracted skills from interviews and documents
-- ==========================================

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id UUID NOT NULL REFERENCES twins(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'soft', 'domain', 'tools')),
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  evidence TEXT,
  source TEXT NOT NULL CHECK (source IN ('interview', 'document', 'portfolio')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE skills IS 'Skills extracted from interviews, documents, and portfolios';
COMMENT ON COLUMN skills.skill_name IS 'Name of the skill (e.g., "React", "Leadership")';
COMMENT ON COLUMN skills.category IS 'Skill category: technical, soft, domain, or tools';
COMMENT ON COLUMN skills.proficiency_level IS 'Optional proficiency level';
COMMENT ON COLUMN skills.evidence IS 'Context or evidence supporting this skill';
COMMENT ON COLUMN skills.source IS 'Where the skill was extracted from';

-- ==========================================
-- INDEXES
-- Optimize common queries
-- ==========================================

-- Twins indexes
CREATE INDEX IF NOT EXISTS idx_twins_slug ON twins(slug);
CREATE INDEX IF NOT EXISTS idx_twins_created_at ON twins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_twins_email ON twins(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_twins_is_public ON twins(is_public) WHERE is_public = true;

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_twin_id ON twin_sessions(twin_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON twin_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON twin_sessions(visitor_session_id);

-- Skills indexes
CREATE INDEX IF NOT EXISTS idx_skills_twin_id ON skills(twin_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_source ON skills(source);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- Control data access
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE twins ENABLE ROW LEVEL SECURITY;
ALTER TABLE twin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Twins policies
CREATE POLICY "Public twins are viewable by everyone"
  ON twins
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Anyone can create a twin"
  ON twins
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Twin owners can update their twin"
  ON twins
  FOR UPDATE
  USING (true); -- In production, add proper authentication check

-- Sessions policies
CREATE POLICY "Anyone can create a session"
  ON twin_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sessions are viewable"
  ON twin_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Sessions can be updated"
  ON twin_sessions
  FOR UPDATE
  USING (true);

-- Skills policies
CREATE POLICY "Skills are viewable for public twins"
  ON skills
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM twins
      WHERE twins.id = skills.twin_id
      AND twins.is_public = true
    )
  );

CREATE POLICY "System can insert skills"
  ON skills
  FOR INSERT
  WITH CHECK (true);

-- ==========================================
-- FUNCTIONS
-- Helper database functions
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_twins_updated_at
  BEFORE UPDATE ON twins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get twin stats
CREATE OR REPLACE FUNCTION get_twin_stats(twin_uuid UUID)
RETURNS TABLE (
  total_sessions BIGINT,
  total_skills BIGINT,
  avg_session_duration INTEGER,
  technical_skills_count BIGINT,
  soft_skills_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT ts.id) AS total_sessions,
    COUNT(DISTINCT s.id) AS total_skills,
    AVG(ts.duration_seconds)::INTEGER AS avg_session_duration,
    COUNT(DISTINCT CASE WHEN s.category = 'technical' THEN s.id END) AS technical_skills_count,
    COUNT(DISTINCT CASE WHEN s.category = 'soft' THEN s.id END) AS soft_skills_count
  FROM twins t
  LEFT JOIN twin_sessions ts ON t.id = ts.twin_id
  LEFT JOIN skills s ON t.id = s.twin_id
  WHERE t.id = twin_uuid
  GROUP BY t.id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- SAMPLE DATA (Optional - for testing)
-- ==========================================

-- Uncomment to insert sample twin
/*
INSERT INTO twins (slug, display_name, email, profile_json, transcript, theme) VALUES (
  'test-twin',
  'Test Twin',
  'test@example.com',
  '{
    "identity_summary": "A test digital twin",
    "thinking_patterns": "Analytical and methodical",
    "methodology": "Data-driven approach",
    "constraints": "Time and resources",
    "proof_metrics": "Clear KPIs",
    "style_tone": "Professional and friendly",
    "do_not_say": ["I don''t know"]
  }'::jsonb,
  'Sample interview transcript',
  'cosmic'
);
*/

-- ==========================================
-- STORAGE BUCKETS (For document uploads)
-- ==========================================

-- Create storage bucket for documents
-- Run this in Supabase Dashboard > Storage or via API

/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('twin-documents', 'twin-documents', false);

-- Policy to allow uploads
CREATE POLICY "Anyone can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'twin-documents');

-- Policy to allow downloads
CREATE POLICY "Anyone can download documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'twin-documents');
*/

-- ==========================================
-- CLEANUP FUNCTIONS (Optional)
-- ==========================================

-- Function to delete old sessions (data retention)
CREATE OR REPLACE FUNCTION cleanup_old_sessions(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM twin_sessions
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- VIEWS (Optional - for analytics)
-- ==========================================

-- View for twin analytics
CREATE OR REPLACE VIEW twin_analytics AS
SELECT
  t.id,
  t.slug,
  t.display_name,
  t.created_at,
  t.theme,
  COUNT(DISTINCT ts.id) AS total_conversations,
  COUNT(DISTINCT s.id) AS total_skills,
  COUNT(DISTINCT CASE WHEN s.category = 'technical' THEN s.id END) AS technical_skills,
  COUNT(DISTINCT CASE WHEN s.category = 'soft' THEN s.id END) AS soft_skills,
  COUNT(DISTINCT CASE WHEN s.category = 'domain' THEN s.id END) AS domain_skills,
  COUNT(DISTINCT CASE WHEN s.category = 'tools' THEN s.id END) AS tool_skills,
  jsonb_array_length(t.documents) AS document_count
FROM twins t
LEFT JOIN twin_sessions ts ON t.id = ts.twin_id
LEFT JOIN skills s ON t.id = s.twin_id
WHERE t.is_public = true
GROUP BY t.id, t.slug, t.display_name, t.created_at, t.theme, t.documents;

COMMENT ON VIEW twin_analytics IS 'Aggregated statistics for all public twins';

-- ==========================================
-- COMPLETION MESSAGE
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Twino database schema created successfully!';
  RAISE NOTICE '📊 Tables: twins, twin_sessions, skills';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '⚡ Indexes created for performance';
  RAISE NOTICE '🎯 Ready to use!';
END $$;
