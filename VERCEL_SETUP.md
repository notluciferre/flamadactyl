# Vercel Deployment Guide

## Environment Variables Required

Add these environment variables in your Vercel project dashboard:
https://vercel.com/[your-username]/cakranode/settings/environment-variables

### Firebase Client (Public)
Copy from your `.env.local` file:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Firebase Admin SDK (Server-side - KEEP SECRET!)
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - From service account JSON (firebase-adminsdk-xxxxx@xxx.iam.gserviceaccount.com)
- `FIREBASE_PRIVATE_KEY` - From service account JSON (the full private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)

⚠️ **Important for FIREBASE_PRIVATE_KEY:**
- Copy the entire private key value including newlines
- Vercel will handle the formatting automatically
- Make sure it starts with `-----BEGIN PRIVATE KEY-----` and ends with `-----END PRIVATE KEY-----`

### Application Config
- `NEXT_PUBLIC_ADMIN_EMAIL` - Admin email address (e.g., admin@cakranode.tech)
- `NODE_SECRET_KEY` - Secret key for node authentication (e.g., cn-12345678abcdefghij)

## Quick Setup via CLI

You can also add environment variables via Vercel CLI:

```bash
# Add Firebase client variables (public)
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
vercel env add NEXT_PUBLIC_FIREBASE_DATABASE_URL production
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production

# Add Firebase Admin SDK variables (secret!)
vercel env add FIREBASE_PROJECT_ID production
vercel env add FIREBASE_CLIENT_EMAIL production
vercel env add FIREBASE_PRIVATE_KEY production

# Add app config
vercel env add NEXT_PUBLIC_ADMIN_EMAIL production
vercel env add NODE_SECRET_KEY production
```

## Deploy

After adding all environment variables:

```bash
vercel --prod
```

## Troubleshooting

### Build fails with "Command npm run build exited with 1"
- Check that all environment variables are set correctly
- Verify FIREBASE_PRIVATE_KEY is properly formatted (includes newlines)
- Check build logs: `vercel logs [deployment-url]`

### Firebase initialization errors
- Make sure FIREBASE_PRIVATE_KEY contains newlines (`\n`)
- Verify FIREBASE_CLIENT_EMAIL matches your service account
- Check that FIREBASE_PROJECT_ID is correct

### Functions timeout
- Firebase Admin SDK should initialize quickly
- Check if RTDB rules are configured correctly
- Verify network connectivity from Vercel to Firebase
