#!/bin/bash

# Vercel Environment Variables Setup Script
# Run this script to automatically configure all required environment variables for Vercel deployment

echo "🚀 Setting up Vercel environment variables for CakraNode..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "❌ Error: .env.local file not found!"
  echo "Please create .env.local file with your Firebase credentials first."
  exit 1
fi

# Load environment variables from .env.local
source .env.local

echo "📋 Adding Firebase Client variables (public)..."
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production <<< "$NEXT_PUBLIC_FIREBASE_API_KEY"
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production <<< "$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
vercel env add NEXT_PUBLIC_FIREBASE_DATABASE_URL production <<< "$NEXT_PUBLIC_FIREBASE_DATABASE_URL"
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production <<< "$NEXT_PUBLIC_FIREBASE_PROJECT_ID"
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production <<< "$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production <<< "$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production <<< "$NEXT_PUBLIC_FIREBASE_APP_ID"

echo ""
echo "🔐 Adding Firebase Admin SDK variables (secret)..."
vercel env add FIREBASE_PROJECT_ID production <<< "$FIREBASE_PROJECT_ID"
vercel env add FIREBASE_CLIENT_EMAIL production <<< "$FIREBASE_CLIENT_EMAIL"
vercel env add FIREBASE_PRIVATE_KEY production <<< "$FIREBASE_PRIVATE_KEY"

echo ""
echo "⚙️  Adding application configuration..."
vercel env add NEXT_PUBLIC_ADMIN_EMAIL production <<< "$NEXT_PUBLIC_ADMIN_EMAIL"
vercel env add NODE_SECRET_KEY production <<< "$NODE_SECRET_KEY"

echo ""
echo "✅ All environment variables have been configured!"
echo ""
echo "Next steps:"
echo "1. Verify variables at: https://vercel.com/dashboard/[your-project]/settings/environment-variables"
echo "2. Deploy: vercel --prod"
echo ""
