# Shipyard Setup Guide

This guide will help you set up your Shipyard application with Supabase and OpenAI.

## 1. Supabase Setup

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up or log in
2. Create a new project with a name of your choice
3. Note down your project URL and anon key (found in Project Settings > API)

### Set Up Database Schema

1. In your Supabase project, go to the SQL Editor
2. Copy the contents of `supabase-schema.sql` from this project
3. Paste it into the SQL Editor and run the query
4. Verify that all tables have been created (profiles, profile_answers, conversations, etc.)

### Configure Authentication

1. In your Supabase project, go to Authentication > Providers
2. Enable Email (with "Confirm email" option)
3. Enable Google OAuth (optional)
   - You'll need to set up a Google OAuth application in the Google Cloud Console
   - Add your redirect URLs (e.g., `https://your-project.supabase.co/auth/v1/callback`)

### Set Up Storage

1. In your Supabase project, go to Storage
2. Create a new bucket called `profile-photos`
3. Set the bucket to public access
4. The RLS policies are already defined in the SQL schema

## 2. OpenAI Setup

1. Go to [platform.openai.com](https://platform.openai.com) and sign up or log in
2. Create an API key in the API Keys section
3. Copy the API key for use in your environment variables

## 3. Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
```

## 4. Run the Application

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 5. Deployment

### Deploy to Vercel

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign up or log in
3. Import your repository
4. Add the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
5. Deploy!

## Troubleshooting

### Authentication Issues
- Make sure your Supabase URL and anon key are correct
- Check that your redirect URLs are properly configured in Supabase

### Database Issues
- Verify that all tables were created correctly
- Check that RLS policies are in place

### OpenAI Issues
- Ensure your API key is valid and has sufficient credits
- Check that the model specified in the code is available for your account

## Next Steps

After setting up the basic application, you might want to:

1. Customize the Gen-Z questions in the onboarding flow
2. Adjust the OpenAI prompt for profile summaries
3. Add more search filters
4. Enhance the UI with custom styling
5. Add analytics to track user engagement
