# Fix 404 Error - URL Mismatch

## Problem

The frontend is trying to connect to the wrong backend URL, causing 404 errors.

## Find Your Correct URLs

### Step 1: Find Backend URL

1. Go to https://dashboard.render.com
2. Click on "leonux-ai-backend" service
3. Look at the top - you'll see the URL like:
   - `https://leonuxai-2.onrender.com` OR
   - `https://leonuxai-3.onrender.com` OR
   - `https://leonux-ai-backend-XXXX.onrender.com`
4. Copy this URL

### Step 2: Test Backend URL

Open in browser: `YOUR_BACKEND_URL/api/health`

Example: `https://leonuxai-3.onrender.com/api/health`

Should show:
```json
{
  "status": "OK",
  "message": "Leonux AI Backend is running",
  "mongodb": "connected",
  "hasApiKey": true
}
```

If you get 404, the backend isn't deployed correctly.

## Fix the Configuration

### Option A: Update render.yaml (Recommended)

1. Open `render.yaml`
2. Find the frontend section
3. Update `VITE_API_URL` to match your actual backend URL:

```yaml
envVars:
  - key: VITE_API_URL
    value: https://YOUR-ACTUAL-BACKEND-URL/api
```

4. Save and push to GitHub:
```bash
git add render.yaml
git commit -m "Fix backend URL"
git push
```

5. Wait for Render to redeploy

### Option B: Update Render Dashboard Directly

1. Go to Render dashboard
2. Click "leonux-ai-frontend"
3. Click "Environment" tab
4. Find or add `VITE_API_URL`
5. Set value to: `https://YOUR-ACTUAL-BACKEND-URL/api`
6. Click "Save Changes"
7. Click "Manual Deploy" → "Deploy latest commit"

## Common URL Patterns

Render generates URLs like:
- `servicename.onrender.com`
- `servicename-XXXX.onrender.com`
- Custom domain if you set one up

## Verify the Fix

After updating:

1. Wait for frontend to redeploy (2-3 minutes)
2. Open your frontend URL
3. Press F12 (console)
4. Send a message
5. Look for: `🚀 Starting chat request to: [URL]`
6. Should match your backend URL

## If Backend Returns 404

The backend service might not be running. Check:

1. Go to Render dashboard
2. Click "leonux-ai-backend"
3. Check "Logs" tab for errors
4. Check if service is "Live" (green)
5. If not, click "Manual Deploy"

## Quick Test Commands

Test backend:
```bash
curl https://YOUR-BACKEND-URL/api/health
```

Test if backend is accessible:
```bash
curl https://YOUR-BACKEND-URL
```

Should NOT return 404.
