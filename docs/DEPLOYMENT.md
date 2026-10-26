# 🚀 Deployment Instructions for GitHub Pages

## ⚠️ IMPORTANT: You MUST Do These Steps

Your site works on localhost but shows 404 on GitHub Pages because **GitHub Pages is not enabled yet**.

---

## 📋 Step-by-Step Instructions

### STEP 1: Enable GitHub Pages (REQUIRED!)
**This is the main reason for the 404 error!**

1. Open this link: https://github.com/keerthivasan98406-blip/leonuxAI/settings/pages
2. Under **"Build and deployment"**:
   - **Source**: Select **"GitHub Actions"** (NOT "Deploy from a branch")
3. Click **Save**

✅ After this, GitHub will start deploying your site automatically.

---

### STEP 2: Add API Key Secret
So the AI can work on the deployed site:

1. Open: https://github.com/keerthivasan98406-blip/leonuxAI/settings/secrets/actions
2. Click **"New repository secret"**
3. Enter:
   - **Name**: `VITE_OPENROUTER_API_KEY`
   - **Value**: (Copy the key from your `.env.local` file)
4. Click **"Add secret"**

---

### STEP 3: Push Changes & Deploy
Run these commands in your terminal:

```bash
git add .
git commit -m "Update deployment workflow"
git push origin main
```

---

### STEP 4: Monitor Deployment
1. Go to: https://github.com/keerthivasan98406-blip/leonuxAI/actions
2. You'll see the workflow running
3. Wait for the green checkmark ✅ (takes 2-3 minutes)
4. If you see a red X ❌, click on it to see the error

---

### STEP 5: Access Your Site
After the workflow completes successfully:

**Your site URL**: https://keerthivasan98406-blip.github.io/leonuxAI/

⏰ **Note**: It may take 2-5 minutes after deployment for the site to be live.

---

## 🔍 Troubleshooting

### Still seeing 404?
- ✅ Did you enable GitHub Pages? (Step 1 - this is the most common issue!)
- ✅ Did the workflow complete successfully? (Check for green checkmark)
- ✅ Wait 5 minutes and try again (GitHub Pages can be slow)
- ✅ Try clearing your browser cache (Ctrl+Shift+R)

### Workflow failed?
- Check if you added the API key secret (Step 2)
- Click on the failed workflow to see the error message
- Re-run the workflow after fixing the issue

### AI not responding?
- Make sure you added the `VITE_OPENROUTER_API_KEY` secret (Step 2)
- The secret must match exactly (case-sensitive)

---

## ✅ What's Already Done
- ✅ Code is ready and working on localhost
- ✅ GitHub Actions workflow configured
- ✅ Build process set up correctly
- ✅ Asset paths configured for GitHub Pages
- ✅ All files pushed to repository

## ⏳ What You Need to Do
1. ⏳ Enable GitHub Pages (Step 1) - **THIS IS CRITICAL!**
2. ⏳ Add API key secret (Step 2)
3. ⏳ Push the updated workflow (Step 3)
4. ⏳ Wait for deployment (Step 4)

---

## 🧪 Local Testing
Your site already works locally. To test the production build:

```bash
npm run build
npm run preview
```

Then open: http://localhost:4173/leonuxAI/

---

## 📞 Need Help?
If you're still having issues after following all steps:
1. Check the Actions tab for error messages
2. Make sure GitHub Pages source is set to "GitHub Actions"
3. Verify the API key secret is added correctly
