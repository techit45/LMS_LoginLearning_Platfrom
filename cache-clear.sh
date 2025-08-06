#!/bin/bash

# Vercel Cache Clearing Script
echo "🚨 FORCING VERCEL CACHE CLEAR..."

# Method 1: Force redeploy with cache skip
echo "1. Force redeploying with no cache..."
npx vercel --prod --force --no-cache

# Method 2: Clear local build cache  
echo "2. Clearing local build cache..."
rm -rf node_modules/.cache
rm -rf .next
rm -rf dist
rm -rf .vercel

# Method 3: Trigger fresh build
echo "3. Running fresh build..."
npm run build

echo "✅ Cache clearing complete!"
echo "🔍 Check production site for console messages:"
echo "   - Look for red '🚨 VERCEL DEPLOYMENT CHECK' message"
echo "   - Verify BASE_URL shows '/api/drive'"
echo "   - Confirm build timestamp is recent"