# Shipyard Deployment Guide

This guide will walk you through deploying your Shipyard application to Vercel.

## Prerequisites

Before deploying, make sure you have:

1. A GitHub repository with your Shipyard code
2. A Supabase project set up with the correct schema
3. An OpenAI API key

## Deployment Steps

### 1. Push Your Code to GitHub

If you haven't already, push your code to a GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/shipyard.git
git push -u origin main
```

### 2. Deploy to Vercel

#### Option A: Using the Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign up or log in
2. Click "Add New..." > "Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next
5. Add the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `OPENAI_API_KEY`: Your OpenAI API key
6. Click "Deploy"

#### Option B: Using the Vercel CLI

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from your project directory:
   ```bash
   vercel --prod
   ```

4. Follow the prompts to link to an existing project or create a new one
5. Add the environment variables when prompted, or add them later in the Vercel dashboard

### 3. Configure Authentication Callbacks

After deployment, you need to update your Supabase authentication settings:

1. Go to your Supabase project > Authentication > URL Configuration
2. Add your production URL to the Site URL and Redirect URLs:
   - Site URL: `https://your-shipyard-app.vercel.app`
   - Redirect URLs: `https://your-shipyard-app.vercel.app/auth/callback`

### 4. Test Your Deployment

1. Visit your deployed application
2. Test the authentication flow
3. Test the profile creation process
4. Test the search functionality
5. Test the chat functionality

## Continuous Deployment

Vercel automatically sets up continuous deployment from your GitHub repository. Any push to your main branch will trigger a new deployment.

## Custom Domain (Optional)

To add a custom domain to your Vercel deployment:

1. Go to your project in the Vercel dashboard
2. Navigate to Settings > Domains
3. Add your custom domain
4. Follow the instructions to configure your DNS settings

## Monitoring and Analytics

1. Use Vercel Analytics to monitor performance and usage
2. Set up logging with a service like LogRocket or Sentry
3. Consider adding Google Analytics or Plausible for user behavior tracking

## Troubleshooting

### Authentication Issues
- Verify that your Site URL and Redirect URLs are correctly set in Supabase
- Check that your environment variables are correctly set in Vercel

### API Issues
- Check your API logs in Vercel
- Verify that your Supabase and OpenAI API keys are valid

### Build Failures
- Check your build logs in Vercel
- Ensure all dependencies are correctly installed

## Scaling Considerations

As your user base grows:

1. Consider upgrading your Supabase plan for more resources
2. Implement caching strategies for frequently accessed data
3. Optimize image storage and delivery with a CDN
4. Monitor your OpenAI API usage and adjust as needed
