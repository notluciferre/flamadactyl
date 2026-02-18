#!/bin/bash

# Vercel Environment Variables Verification Script
# This script helps verify your Vercel environment variables are set correctly

echo "🔍 Checking Vercel environment variables..."
echo ""

# List all production environment variables
echo "📋 Current production environment variables:"
vercel env ls production

echo ""
echo "💡 Tips for fixing build errors:"
echo ""
echo "1. **Check FIREBASE_PRIVATE_KEY format:**"
echo "   - Must include newlines (\\n characters)"
echo "   - Should start with: \"-----BEGIN PRIVATE KEY-----\\n"
echo "   - Should end with: \\n-----END PRIVATE KEY-----\\n\""
echo "   - In Vercel dashboard, paste the ENTIRE value including quotes"
echo ""
echo "2. **Verify in Vercel Dashboard:**
echo "   https://vercel.com/luciferr599s-projects/cakranode/settings/environment-variables"
echo ""
echo "3. **Check build logs:**
echo "   https://vercel.com/luciferr599s-projects/cakranode"
echo "   Click on the failed deployment to see detailed error logs"
echo ""
echo "4. **If FIREBASE_PRIVATE_KEY has issues, update it:**
echo "   vercel env rm FIREBASE_PRIVATE_KEY production"
echo "   vercel env add FIREBASE_PRIVATE_KEY production"
echo "   Then paste the FULL private key value from .env.local"
echo ""
