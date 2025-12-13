# Database Migrations

## Skills Table Migration

### Purpose

Creates the `skills` table for storing automatically extracted competencies from twin profiles. Skills are extracted using AI from interview transcripts, uploaded documents, and portfolio information.

### How to Run

Execute the SQL migration in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `create_skills_table.sql`
4. Run the query

### What It Creates

- **Table**: `skills` - Stores individual skills with categories, proficiency levels, and evidence
- **Indexes**:
  - `idx_skills_twin_id` - Fast lookups by twin
  - `idx_skills_category` - Fast filtering by skill category
- **Constraints**:
  - Foreign key to `twins` table with CASCADE delete
  - Check constraints for valid categories and proficiency levels

### Schema

```sql
skills (
  id UUID PRIMARY KEY,
  twin_id UUID REFERENCES twins(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'soft', 'domain', 'tools')),
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  evidence TEXT,
  source TEXT NOT NULL CHECK (source IN ('interview', 'document', 'portfolio')),
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Skill Categories

- **technical**: Programming languages, frameworks, technologies
- **soft**: Communication, leadership, problem-solving, teamwork
- **domain**: Sector-specific knowledge (e.g., marketing, finance, UX design)
- **tools**: Software, platforms, specific tools (e.g., Figma, Jira, Excel)

### Proficiency Levels

- **beginner**: Mentioned but without detailed experience
- **intermediate**: Used in projects, but not expertise
- **advanced**: Used frequently with concrete results
- **expert**: Demonstrated mastery, teaches others, excellent results

### Notes

- Skills are extracted automatically during twin creation (async process)
- Extraction doesn't block user experience - runs in background
- Failed extractions are logged but don't fail twin creation
- Skills can be viewed in the "Competenze" tab on twin detail pages
