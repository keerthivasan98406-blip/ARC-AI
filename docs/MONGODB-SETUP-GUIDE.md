# MongoDB Database Setup Guide for Leonux AI

## Current Status: NOT CONFIGURED ❌

## What We Need to Do:

### Step 1: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 2: Create Environment File
Create `server/.env` file with:
```
MONGODB_URI=mongodb+srv://leonuxfounder_db_user:1afeZbdsZC9wONCp@cluster0.17z10aw.mongodb.net/leonux-ai?retryWrites=true&w=majority
PORT=5000
```

### Step 3: Test Backend Locally
```bash
cd server
npm start
```

### Step 4: Deploy Backend to Render

Since your frontend is on Render, we need to deploy the backend too.

**Option A: Deploy Backend as Separate Service (Recommended)**
1. Go to Render Dashboard
2. Create New Web Service
3. Connect your GitHub repo
4. Set:
   - Name: `leonux-ai-backend`
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     - `MONGODB_URI`: mongodb+srv://leonuxfounder_db_user:1afeZbdsZC9wONCp@cluster0.17z10aw.mongodb.net/leonux-ai
     - `PORT`: 5000

**Option B: Use Serverless Functions (Alternative)**
Deploy backend as serverless functions on Vercel or Netlify.

### Step 5: Update Frontend to Use Backend API

Add to `.env.local`:
```
VITE_API_URL=https://leonux-ai-backend.onrender.com/api
```

## Problem: Why It's Not Working Now

Your current setup is:
- ✅ Frontend: Deployed on Render (static site)
- ❌ Backend: Not deployed (only created files)
- ❌ MongoDB: Connection string exists but no backend to use it

## Solution Options:

### Option 1: Full Backend Deployment (Best for Production)
- Deploy Node.js backend on Render
- Connect to MongoDB Atlas
- Frontend calls backend API
- **Pros**: Secure, scalable, proper architecture
- **Cons**: Requires backend deployment

### Option 2: Direct MongoDB Connection (Quick but NOT SECURE)
- Connect directly from frontend to MongoDB
- Use MongoDB Realm/Atlas App Services
- **Pros**: No backend needed
- **Cons**: Exposes database credentials, not secure

### Option 3: Keep Using localStorage (Current)
- Continue with current localStorage approach
- No database needed
- **Pros**: Simple, works now
- **Cons**: Data not persistent across devices

## Recommended: Option 1 - Full Backend Deployment

Let me create the deployment files for you.
