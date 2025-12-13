-- Create skills table for storing extracted competencies from twin interviews
-- This table stores skills extracted automatically by AI from:
-- - Interview transcripts
-- - Uploaded documents (CV, portfolio, etc.)
-- - Portfolio information (LinkedIn, GitHub, etc.)

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id UUID NOT NULL REFERENCES twins(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'soft', 'domain', 'tools')),
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  evidence TEXT, -- Quote from interview or document that demonstrates the skill
  source TEXT NOT NULL CHECK (source IN ('interview', 'document', 'portfolio')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_skills_twin_id ON skills(twin_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

-- Add comment to table
COMMENT ON TABLE skills IS 'Stores automatically extracted skills and competencies from twin profiles';
COMMENT ON COLUMN skills.category IS 'Skill category: technical (languages, frameworks), soft (communication, leadership), domain (sector knowledge), tools (software, platforms)';
COMMENT ON COLUMN skills.proficiency_level IS 'Skill proficiency level based on demonstrated experience: beginner, intermediate, advanced, expert';
COMMENT ON COLUMN skills.evidence IS 'Brief quote or reference from source material that demonstrates this skill';
COMMENT ON COLUMN skills.source IS 'Source of skill extraction: interview transcript, uploaded document, or portfolio analysis';

