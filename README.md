# 🚀 CakraNode - Minecraft Bedrock Botnet Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime-orange)](https://firebase.google.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)

**CakraNode** adalah platform manajemen botnet untuk Minecraft Bedrock Edition yang memungkinkan Anda mengelola multiple bot instances di berbagai node servers dengan real-time monitoring melalui web dashboard.

## ✨ Features

- 🤖 **Multi-Bot Management** - Kelola banyak bot sekaligus
- 🌐 **Real-time Monitoring** - Status bot update real-time (<300ms)
- 🖥️ **Node Server Network** - Deploy bot di multiple VPS/server
- 🔐 **User Authentication** - Secure login dengan Supabase Auth
- 📊 **Dashboard Analytics** - Monitor CPU, RAM, bot count
- 🎮 **Xbox Live Support** - Login dengan akun Microsoft
- 🔄 **Auto Reconnect** - Bot otomatis reconnect saat disconnect
- 📝 **Real-time Logs** - Live bot logs streaming
- 🎯 **Command Queue** - Kirim command dari web ke bot

## 🏗️ Architecture

```
┌─────────────────┐
│   VPS/Local     │
│   Bot Nodes     │ ← Run Minecraft bots
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Firebase     │
│   Realtime DB   │ ← Real-time communication
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Vercel      │
│  Web Dashboard  │ ← Frontend (Serverless)
└─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Firebase Account** (Free tier OK)
- **Supabase Account** (Free tier OK)
- **VPS/Local Machine** untuk bot server

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/cakranode.git
cd cakranode
```

### 2. Install Dependencies

```bash
# Frontend
npm install

# Bot Server
cd cakrawings
npm install
cd ..
```

### 3. Setup Firebase

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Create new project: **CakraNode**
3. Enable **Realtime Database**
   - Location: **Singapore** (asia-southeast1)
   - Mode: **Test mode**
4. Update Security Rules:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
5. Get config dari **Project Settings > Your apps > Web**

### 4. Setup Supabase

1. Buka [Supabase](https://supabase.com/)
2. Create new project
3. Run SQL dari `supabase-schema.sql`
4. Get API keys dari **Settings > API**

### 5. Configure Environment

**Frontend** - Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**Bot Server** - Update `cakrawings/config.json`:
```json
{
  "apiUrl": "https://your-vercel-app.vercel.app",
  "accessToken": "your_secure_token_here",
  "nodeIp": "auto",
  "firebase": {
    "apiKey": "...",
    "authDomain": "...",
    "databaseURL": "...",
    "projectId": "...",
    "storageBucket": "...",
    "messagingSenderId": "...",
    "appId": "..."
  }
}
```

### 6. Run Development

**Frontend:**
```bash
npm run dev
# Open http://localhost:3000
```

**Bot Server:**
```bash
cd cakrawings
npm start
```

## 📚 Documentation

- **[Setup Guide](./FIREBASE_SETUP.md)** - Complete setup instructions
- **[Optimization Summary](./OPTIMIZATION_SUMMARY.md)** - Recent optimizations

## 🎯 Usage

### Create Bot Instance

1. Login ke dashboard
2. Navigate ke **Botnet** page
3. Click **Create Bot**
4. Fill form:
   - Username (Xbox gamertag)
   - Server IP (default: donutsmp.net)
   - Node (pilih available node)
   - Mode: Online (Xbox) atau Offline
5. Click **Create**

### Control Bot

- **Start**: Connect bot ke server
- **Stop**: Disconnect bot
- **Restart**: Restart bot connection
- **Delete**: Hapus bot instance

### Monitor Bot

- Real-time status updates
- Live logs streaming
- CPU & RAM usage per node
- Bot count per node

## ⚡ Performance

### Optimizations Applied

✅ **-35% Code Size** - Removed unused dependencies & code  
✅ **-70% Firebase Writes** - Smart adaptive heartbeat  
✅ **Memory Leak Fixed** - Proper listener cleanup  
✅ **+80% Type Safety** - Better TypeScript types  
✅ **Retry Logic** - Auto-retry failed operations

### Smart Heartbeat

- **Idle Mode**: 60s (no bots running)
- **Active Mode**: 15s (bots running)
- **Burst Mode**: 5s (after command received)

## 🔧 Tech Stack

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **Firebase SDK** - Real-time data

### Backend
- **Supabase** - PostgreSQL database & auth
- **Firebase Realtime DB** - Real-time communication
- **Next.js API Routes** - REST endpoints

### Bot Server
- **Node.js** - Runtime
- **bedrock-protocol** - Minecraft client
- **Firebase SDK** - Real-time sync

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file

## 🙏 Credits

- [bedrock-protocol](https://github.com/PrismarineJS/bedrock-protocol) - Minecraft client
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend infrastructure
- [Firebase](https://firebase.google.com/) - Real-time database

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/cakranode/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/cakranode/discussions)

---

Made with ❤️ by CakraNode Team
