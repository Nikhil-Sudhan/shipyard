# Shipyard - Gen-Z Social Platform

A modern social platform for Gen-Z creators, builders, and dreamers to connect and collaborate. Built with Next.js, Supabase, and a sleek black-grey aesthetic.

## Features

- **Profile Creation**: Upload photos, answer Gen-Z style questions, and get AI-generated summaries
- **Smart Search**: Find people by interests, skills, or location with simple text search
- **Real-time Chat**: Connect and chat with other users
- **Modern UI**: Beautiful black-grey aesthetic with smooth animations and glass morphism effects

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Realtime, Storage)
- **AI**: OpenAI GPT-3.5-turbo for profile summaries
- **Deployment**: Vercel

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd shipyard
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL editor and run the schema from `supabase-schema.sql`
3. Enable email and Google authentication in Authentication > Providers
4. Create a storage bucket called `profile-photos` (public)

### 3. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── search/route.ts          # Search profiles
│   │   ├── profile/route.ts         # Get/update my profile
│   │   ├── profile/[id]/route.ts    # Get specific profile
│   │   └── summarize/route.ts       # AI summary generation
│   ├── onboarding/page.tsx          # Profile setup flow
│   ├── profile/[id]/page.tsx        # Public profile view
│   ├── me/page.tsx                  # My profile (editable)
│   └── page.tsx                     # Home/search page
├── components/ui/                   # shadcn/ui components
├── lib/
│   ├── supabase.ts                  # Client-side Supabase
│   └── supabase-server.ts           # Server-side Supabase
└── types/database.ts                # TypeScript types
```

## Key Features

### Profile Creation
- Multi-step onboarding with photo uploads
- Gen-Z style questions (vibe check, dream project, etc.)
- AI-generated lowercase summaries using OpenAI
- Interest tags and location

### Search
- Simple text search across names, interests, and summaries
- Location filtering (city/country)
- Beautiful card-based results with hover effects

### Chat (Coming Soon)
- Real-time messaging with Supabase Realtime
- Expandable sidebar with chat history
- Profile integration

## Design System

The app uses a consistent black-grey aesthetic:

- **Colors**: Deep black backgrounds, charcoal cards, soft grey borders
- **Typography**: Inter font with clean, readable hierarchy
- **Effects**: Glass morphism, smooth transitions, hover animations
- **Components**: shadcn/ui with custom styling

## Database Schema

- `profiles`: User profiles with photos, interests, AI summaries
- `profile_answers`: Gen-Z question responses
- `conversations`: Chat conversations
- `conversation_participants`: Many-to-many relationship
- `messages`: Real-time chat messages

## Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Contributing

This is a beginner-friendly project! Feel free to:
- Add new Gen-Z questions
- Improve the AI prompts
- Add more search filters
- Enhance the UI/UX
- Add new features

## License

MIT