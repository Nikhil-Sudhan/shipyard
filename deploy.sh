#!/bin/bash

# Shipyard Deployment Script

echo "🚀 Preparing to deploy Shipyard..."

# 1. Check for environment variables
if [ ! -f .env.local ]; then
  echo "❌ Error: .env.local file not found!"
  echo "Please create a .env.local file with the following variables:"
  echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
  echo "OPENAI_API_KEY=your_openai_api_key"
  exit 1
fi

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Build the application
echo "🔨 Building the application..."
npm run build

# 4. Deploy to Vercel (if Vercel CLI is installed)
if command -v vercel &> /dev/null; then
  echo "🚀 Deploying to Vercel..."
  vercel --prod
else
  echo "ℹ️ Vercel CLI not found. To deploy to Vercel:"
  echo "1. Install Vercel CLI: npm i -g vercel"
  echo "2. Run: vercel --prod"
  echo ""
  echo "✅ Build completed successfully! You can now deploy manually."
fi
