# Firebase Setup Guide - Flamadactyl

## Error: "5 NOT_FOUND" - Firestore Database Not Created

If you're getting this error when creating nodes, it means you haven't created a Firestore database yet.

### Step-by-Step Solution:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `cakranode`

2. **Create Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose a location (select closest to your users, e.g., `asia-southeast1`)
   - Start in **Production mode** or **Test mode**:
     - **Production mode**: Secure but requires security rules
     - **Test mode**: Open for 30 days (easier for development)
   - Click "Enable"

3. **Wait for Database Creation**
   - Firestore will take 1-2 minutes to provision
   - You'll see an empty database interface when ready

4. **Restart Your Dev Server**
   ```bash
   npm run dev
   ```

5. **Test the Connection**
   - Visit: http://localhost:3000/api/test-firebase
   - You should see: `"firestoreAccessible": true`

### Firestore Security Rules (Production Mode)

If you chose production mode, add these rules in Firestore Rules tab:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Admin-only collections (for nodes, etc)
    match /nodes/{nodeId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.email == 'admin@flamahost.id';
    }
    
    match /node_stats/{statId} {
      allow read, write: if request.auth != null;
    }
    
    match /bots/{botId} {
      allow read, write: if request.auth != null;
    }
    
    match /bot_logs/{logId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Database Structure

Flamadactyl uses these Firestore collections:

- **nodes**: Server nodes (admin only)
- **node_stats**: Node performance metrics
- **bots**: Bot instances
- **bot_logs**: Bot activity logs

Collections are created automatically when you add the first document.

### Test Mode vs Production Mode

**Test Mode (Development)**
- ✅ Easy to set up
- ✅ No security rules needed
- ⚠️ Expires after 30 days
- ⚠️ Anyone can read/write

**Production Mode (Recommended)**
- ✅ Secure with proper rules
- ✅ No expiration
- ⚠️ Requires security rules configuration
- ✅ Better for long-term projects

### Troubleshooting

#### Still getting errors?
1. Check [your Firebase console](https://console.firebase.google.com/project/cakranode/firestore)
2. Verify database exists and is enabled
3. Check your `.env.local` has correct `FIREBASE_PROJECT_ID=cakranode`
4. Restart dev server with cache clear:
   ```bash
   rm -rf .next && npm run dev
   ```

#### Wrong region?
- Firestore location is **permanent** after creation
- If you need a different region, create a new Firebase project

#### Database not showing?
- Firestore Native mode takes 1-2 minutes to provision
- Check Firebase Console > Firestore Database for status

---

**Quick Links:**
- [Firebase Console - Firestore](https://console.firebase.google.com/project/cakranode/firestore)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Test Firebase Connection](http://localhost:3000/api/test-firebase)
