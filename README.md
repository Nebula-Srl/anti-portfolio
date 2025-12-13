# Digital Twin Portfolio

Create your AI-powered Digital Twin through a voice interview and share it with the world.

## Features

- **Voice Interview**: AI conducts a deep interview to capture your essence
- **Digital Twin Generation**: Creates an AI persona that can represent you
- **Shareable Links**: Each twin gets a unique URL (e.g., `/t/your-name`)
- **Voice Conversations**: Visitors can talk to your twin in real-time
- **No Login Required**: Visitors can interact without creating an account

## Tech Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI Realtime API (speech-to-speech)
- **Styling**: Tailwind CSS + shadcn/ui

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key with Realtime API access

## Setup

### 1. Clone and Install

```bash
cd VETO
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor
3. Run the migration file:

```sql
-- Copy contents from: supabase/migrations/001_initial_schema.sql
```

Or execute directly:

```sql
-- Table: twins
CREATE TABLE IF NOT EXISTS twins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]{3,30}$'),
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  profile_json JSONB NOT NULL,
  transcript TEXT NOT NULL,
  voice_agent_config JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT TRUE
);

-- Table: twin_sessions
CREATE TABLE IF NOT EXISTS twin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id UUID REFERENCES twins(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  visitor_session_id TEXT NOT NULL,
  transcript TEXT DEFAULT '',
  summary JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_twins_slug ON twins(slug);
CREATE INDEX IF NOT EXISTS idx_twins_created_at ON twins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_twin_id ON twin_sessions(twin_id);

-- Enable RLS
ALTER TABLE twins ENABLE ROW LEVEL SECURITY;
ALTER TABLE twin_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public twins are viewable" ON twins
  FOR SELECT USING (is_public = true);
CREATE POLICY "Anyone can insert twins" ON twins
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert sessions" ON twin_sessions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Sessions are viewable" ON twin_sessions
  FOR SELECT USING (true);
CREATE POLICY "Sessions can be updated" ON twin_sessions
  FOR UPDATE USING (true);
```

4. Copy your Supabase URL and keys from Project Settings > API

### 4. OpenAI Setup

1. Get your API key from [platform.openai.com](https://platform.openai.com)
2. Ensure you have access to the Realtime API (gpt-4o-realtime-preview)
3. Add the key to your `.env.local`

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── page.tsx                 # Landing page
│   ├── create/page.tsx          # Interview flow
│   ├── t/[slug]/page.tsx        # Public twin page
│   ├── api/
│   │   ├── realtime/token/      # Ephemeral token endpoint
│   │   └── twins/               # Twin CRUD endpoints
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                      # shadcn components
│   ├── voice-agent.tsx          # Voice conversation component
│   ├── audio-visualizer.tsx     # Audio feedback visualization
│   └── interview-progress.tsx   # Progress indicator
├── lib/
│   ├── supabase/                # Supabase clients
│   ├── openai/realtime.ts       # Realtime API client
│   ├── prompts.ts               # AI system prompts
│   └── constants.ts             # App constants
└── supabase/migrations/         # Database schema
```

## Usage

### Creating a Twin

1. Go to the landing page
2. Click "Crea il tuo Digital Twin"
3. Answer the voice interview questions
4. Choose your unique slug (URL name)
5. Get your shareable link

### Talking to a Twin

1. Visit the twin's URL (e.g., `/t/mario-rossi`)
2. Click "Avvia Conversazione"
3. Allow microphone access
4. Start talking!

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- AWS Amplify
- Self-hosted

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/realtime/token` | GET | Get ephemeral token for Realtime API |
| `/api/twins/validate-slug` | POST | Validate slug availability |
| `/api/twins/save` | POST | Save new twin |
| `/api/twins/get` | GET | Get twin by slug |

## Rate Limiting

Basic rate limiting is implemented:
- 10 requests per minute per IP for token endpoint
- Consider using Redis for production

## Security Considerations

- API keys are server-side only
- RLS policies protect database access
- Slug validation prevents injection
- Rate limiting prevents abuse

## License

MIT

## Support

For issues or questions, please open a GitHub issue.
