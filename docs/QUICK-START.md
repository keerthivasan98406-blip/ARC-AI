# 🚀 Quick Start - Deploy to GitHub Pages

## Run This Command:

```bash
deploy.bat
```

This will:
1. ✅ Build your project
2. ✅ Commit changes
3. ✅ Push to GitHub

---

## Then Do These 2 Steps Manually:

### Step 1: Enable GitHub Pages (2 minutes)
1. Open: https://github.com/keerthivasan98406-blip/leonuxAI/settings/pages
2. Under "Build and deployment":
   - **Source**: Select **"GitHub Actions"**
3. Click **Save**

### Step 2: Add API Key (1 minute)
1. Open: https://github.com/keerthivasan98406-blip/leonuxAI/settings/secrets/actions
2. Click **"New repository secret"**
3. Enter:
   - **Name**: `VITE_OPENROUTER_API_KEY`
   - **Value**: (Copy from your `.env.local` file)
4. Click **"Add secret"**

---

## Check Deployment Status:

Go to: https://github.com/keerthivasan98406-blip/leonuxAI/actions

Wait for green checkmark ✅ (takes 2-3 minutes)

---

## Your Site:

https://keerthivasan98406-blip.github.io/leonuxAI/

---

## Troubleshooting:

### Still getting 404?
- Did you enable GitHub Pages? (Step 1)
- Did the workflow complete? (Check Actions tab)
- Wait 5 minutes and refresh

### Need to check setup?
Run: `check-deployment.bat`

---

## That's it! 🎉

The `index.tsx` file is automatically converted to JavaScript during build.
GitHub Pages will serve the built files from the `dist` folder.
