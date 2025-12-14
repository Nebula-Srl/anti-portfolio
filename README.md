# Twino - Digital Twin Platform 🤖

Create your AI-powered Digital Twin through an intelligent voice interview and share it with the world. Twino captures not just what you do, but **how you think** - creating a conversational AI that truly represents you.

## ✨ Features

### For Twin Creators

- **🎤 Intelligent Voice Interview**: AI-powered interview that adapts to your responses and digs deeper into your thinking patterns
- **📄 Document Analysis**: Upload CVs, portfolios, or any PDF documents to enrich your twin's knowledge
- **🔗 Portfolio Integration**: Automatically extracts information from LinkedIn, GitHub, Behance and other portfolio URLs
- **🎨 Personalized Themes**: Each twin gets a unique visual theme (Cosmic, Ocean, Sunset, Forest, Aurora, and more)
- **🧠 Skills Extraction**: AI automatically identifies and categorizes your technical, soft, domain, and tool skills
- **📊 Profile Insights**: Deep psychological profile including thinking patterns, methodology, constraints, and communication style

### For Visitors

- **💬 Real-Time Voice Conversations**: Talk to any digital twin using speech-to-speech AI
- **🚀 No Login Required**: Visitors can interact without creating an account
- **📱 Responsive Design**: Works seamlessly on desktop and mobile
- **🎯 Context-Aware Responses**: Twins respond based on their personality, knowledge, and uploaded documents
- **📈 Multiple Interaction Tabs**: Profile, Skills, Documents, and Conversation views

## 🛠 Tech Stack

- **Framework**: Next.js 15+ (App Router, React Server Components)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **AI Models**:
  - OpenAI Realtime API (GPT-4o-realtime) for voice conversations
  - OpenAI GPT-4o for document analysis and profile extraction
- **Styling**: Tailwind CSS 4 with custom themes
- **UI Components**: Radix UI + shadcn/ui
- **Deployment**: Optimized for Vercel

## 🎯 How It Works

### Twin Creation Flow

1. **Pre-Interview Setup**

   - User enters their desired URL slug (e.g., "mario-rossi")
   - Optionally adds portfolio URL (LinkedIn, GitHub, etc.)
   - Uploads documents (CV, portfolio PDFs)
   - Email for future notifications (optional)

2. **AI Interview** (14 core questions + adaptive follow-ups)

   - Background and professional journey
   - Role and core competencies
   - Significant projects
   - Problem-solving methodology
   - Professional values
   - Passions and motivations
   - Limits and frustrations
   - Learning from failures
   - Unique strengths

3. **Profile Generation**

   - AI analyzes interview transcript + documents + portfolio
   - Generates comprehensive digital twin profile:
     - Identity summary
     - Thinking patterns
     - Methodology and approach
     - Constraints and boundaries
     - Proof metrics
     - Communication style and tone
     - Things to avoid saying

4. **Skills Extraction** (background process)
   - Automatically identifies skills from interview and documents
   - Categories: Technical, Soft Skills, Domain Knowledge, Tools
   - Includes proficiency levels and evidence

### Conversation Flow

1. Visitor goes to `/t/[slug]`
2. Views twin's profile, skills, and documents
3. Starts voice conversation
4. AI responds in character using:
   - Twin's personality profile
   - Interview transcript
   - Document knowledge
   - Portfolio information

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- OpenAI API key with:
  - Realtime API access (GPT-4o-realtime-preview)
  - Standard API access for document processing

## 🚀 Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd anti-portfolio
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

#### Option A: Using Supabase Dashboard

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor**
3. Copy the entire contents of `database.sql`
4. Run the SQL script
5. Go to **Storage** and create bucket:
   - Bucket name: `twin-documents`
   - Public: No

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

#### Get Your Credentials

1. Go to **Project Settings** > **API**
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 4. OpenAI Setup

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Ensure you have access to:
   - `gpt-4o-realtime-preview-2024-12-17` (for voice)
   - `gpt-4o` (for document processing)
3. Add key to `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
twino/
├── app/
│   ├── page.tsx                          # Landing page with twin creation form
│   ├── create/page.tsx                   # Interview flow (intro → voice interview → saving)
│   ├── t/[slug]/
│   │   ├── page.tsx                      # Public twin page with tabs
│   │   ├── profile-tab.tsx               # Profile view
│   │   ├── skills-tab.tsx                # Skills display
│   │   ├── documents-tab.tsx             # Documents list
│   │   └── twin-conversation.tsx         # Voice conversation interface
│   ├── api/
│   │   ├── realtime/token/route.ts       # Ephemeral token for OpenAI Realtime
│   │   ├── twins/
│   │   │   ├── validate-slug/route.ts    # Check slug availability
│   │   │   ├── validate-email/route.ts   # Email validation
│   │   │   ├── save/route.ts             # Save twin + extract skills
│   │   │   ├── get/route.ts              # Fetch twin by slug
│   │   │   └── extract-profile/route.ts  # Fallback profile extraction
│   │   ├── documents/upload/route.ts     # Document upload + text extraction
│   │   └── portfolio/analyze/route.ts    # Portfolio URL analysis
│   └── layout.tsx                         # Root layout
├── components/
│   ├── voice-agent.tsx                    # Voice conversation component
│   ├── audio-visualizer.tsx               # Visual audio feedback
│   ├── interview-progress.tsx             # Interview progress indicator
│   └── ui/                                # shadcn/ui components
├── lib/
│   ├── supabase/
│   │   ├── client.ts                      # Client-side Supabase + types
│   │   └── server.ts                      # Server-side Supabase
│   ├── openai/
│   │   ├── realtime.ts                    # Realtime API client wrapper
│   │   ├── profile-extraction.ts          # Extract twin profile from transcript
│   │   └── skills-extraction.ts           # Extract skills from all sources
│   ├── prompts.ts                         # AI system prompts
│   ├── constants.ts                       # App configuration constants
│   ├── themes.ts                          # Theme system (10 themes)
│   ├── types.ts                           # TypeScript type definitions
│   └── utils.ts                           # Utility functions
├── public/                                 # Static assets
├── database.sql                            # Complete database schema
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 🔌 API Endpoints

### Public Endpoints

| Endpoint                    | Method | Description                                 |
| --------------------------- | ------ | ------------------------------------------- |
| `/api/realtime/token`       | GET    | Get ephemeral token for OpenAI Realtime API |
| `/api/twins/validate-slug`  | POST   | Check if slug is available                  |
| `/api/twins/validate-email` | POST   | Validate email format                       |
| `/api/twins/get?slug=X`     | GET    | Get twin by slug                            |

### Protected Endpoints (Server-side)

| Endpoint                     | Method | Description                                |
| ---------------------------- | ------ | ------------------------------------------ |
| `/api/twins/save`            | POST   | Save new twin + trigger skills extraction  |
| `/api/twins/extract-profile` | POST   | Extract profile from transcript (fallback) |
| `/api/documents/upload`      | POST   | Upload PDF + extract text with GPT-4o      |
| `/api/portfolio/analyze`     | POST   | Analyze portfolio URL                      |

## 📊 Database Schema

### Tables

#### `twins`

Stores digital twin profiles and metadata.

```sql
- id (UUID, primary key)
- slug (text, unique) - URL identifier
- display_name (text) - Human-readable name
- email (text, optional) - Contact email
- profile_json (jsonb) - AI-generated profile
- transcript (text) - Interview transcript
- documents (jsonb[]) - Array of document references
- documents_text (text) - Combined document text for AI
- theme (text) - Visual theme identifier
- is_public (boolean) - Visibility
- created_at, updated_at (timestamptz)
```

#### `twin_sessions`

Tracks visitor conversations with twins.

```sql
- id (UUID, primary key)
- twin_id (UUID, foreign key)
- visitor_session_id (text) - Anonymous visitor ID
- transcript (text) - Conversation transcript
- summary (jsonb) - AI-generated summary
- created_at (timestamptz)
- ended_at (timestamptz)
- duration_seconds (integer)
```

#### `skills`

AI-extracted skills from interviews and documents.

```sql
- id (UUID, primary key)
- twin_id (UUID, foreign key)
- skill_name (text) - Skill name
- category (enum) - technical | soft | domain | tools
- proficiency_level (enum) - beginner | intermediate | advanced | expert
- evidence (text) - Supporting context
- source (enum) - interview | document | portfolio
- created_at (timestamptz)
```

### Security

- **Row Level Security (RLS)** enabled on all tables
- Public twins viewable by everyone
- Private data protected by policies
- No authentication required for viewing public twins

## 🎨 Theme System

Each twin is assigned a random theme on creation:

- **Cosmic**: Deep space blues with stellar accents
- **Ocean**: Calming ocean blues and teals
- **Sunset**: Warm oranges and reds
- **Forest**: Natural greens
- **Aurora**: Multi-color northern lights effect
- **Galaxy**: Deep purples and magentas
- **Neon**: Vibrant pinks and purples
- **Lavender**: Soft lavender and purple tones
- **Ember**: Warm reds and oranges
- **Midnight**: Dark blues with subtle accents

Themes use modern OKLCH color space for perceptual uniformity.

## 🔧 Configuration

### Interview Settings (`lib/constants.ts`)

```typescript
TOTAL_FIXED_QUESTIONS = 14; // Core interview questions
MAX_FOLLOWUP_QUESTIONS = 5; // Adaptive follow-ups
SILENCE_TIMEOUT_SECONDS = 90; // Auto-disconnect after silence
```

### Upload Limits

```typescript
MAX_UPLOAD_SIZE_MB = 4; // Document size limit
```

### OpenAI Models

```typescript
OPENAI_REALTIME_MODEL = "gpt-4o-realtime-preview-2024-12-17";
OPENAI_REALTIME_VOICE = "alloy";
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. Deploy!

### Environment-Specific Settings

Production considerations:

- Set proper `NEXT_PUBLIC_APP_URL` (your domain)
- Use Redis for rate limiting (currently in-memory)
- Configure Supabase production policies
- Set up monitoring for OpenAI API usage
- Configure proper CORS if using custom domain

## 🔐 Security Considerations

- ✅ API keys are server-side only (never exposed to client)
- ✅ Row Level Security (RLS) protects database access
- ✅ Slug validation prevents injection attacks
- ✅ Rate limiting on token endpoint (10 req/min)
- ✅ Document uploads validated and size-limited
- ✅ Ephemeral tokens for Realtime API (60s expiry)
- ⚠️ Consider adding authentication for twin management
- ⚠️ Implement IP-based rate limiting in production
- ⚠️ Add CAPTCHA for twin creation to prevent abuse

## 📈 Performance Optimization

### Current Optimizations

- React Server Components for faster initial load
- Streaming responses for profile extraction
- Background skills extraction (non-blocking)
- Indexed database queries
- PDF text extraction with GPT-4o (efficient)

### Recommended for Scale

- Add Redis for:
  - Rate limiting
  - Session caching
  - Skills extraction queue
- Implement CDN for static assets
- Add database connection pooling
- Use Edge Functions for API routes
- Implement proper monitoring (Sentry, Datadog)

## 🎯 Use Cases

1. **Personal Branding**: Create an interactive AI version of yourself
2. **Job Applications**: Let recruiters talk to your digital twin
3. **Portfolio Enhancement**: Stand out with AI-powered interaction
4. **Client Demos**: Show your expertise through conversation
5. **Team Introductions**: Help teams understand new members
6. **Knowledge Preservation**: Capture and share expertise
7. **Educational**: Demonstrate your teaching style
8. **Sales**: Let prospects learn about you asynchronously

## 🐛 Troubleshooting

### Common Issues

**Voice not working**

- Check browser microphone permissions
- Ensure HTTPS (required for mic access)
- Try a different browser (Chrome/Edge recommended)

**Profile not generating**

- Check OpenAI API key has Realtime access
- Verify interview lasted at least 2-3 minutes
- Check server logs for API errors

**Document upload failing**

- Verify file is under 4MB
- Ensure it's a valid PDF
- Check Supabase storage bucket exists

**Slug already taken**

- Try a different slug
- Check database for existing twins
- Consider adding numbers (e.g., "mario-rossi-2")

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 💡 Future Enhancements

Potential features to add:

- [ ] Twin editing and updates
- [ ] Authentication for twin owners
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Multi-language support
- [ ] Video avatar integration
- [ ] Twin collaboration features
- [ ] Export conversation history
- [ ] Advanced skill filtering
- [ ] Custom theme selection

## 📞 Support

For issues, questions, or feature requests:

- Open a GitHub issue
- Check existing documentation
- Review API logs in Vercel/Supabase

---

**Built with ❤️ using Next.js, OpenAI, and Supabase**
