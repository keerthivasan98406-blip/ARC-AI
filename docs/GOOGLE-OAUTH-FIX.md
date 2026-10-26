# Fix Google OAuth Authorization Error

## Error: "Access blocked: Authorisation error"
**Error 400: origin_mismatch**

This error occurs because your Google Cloud Console OAuth app doesn't have the correct JavaScript origins configured.

## Steps to Fix:

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Select Your Project
- Click on the project dropdown at the top
- Select the project associated with your OAuth Client ID: `668572083647-brs9bobppbein5a0i12aahdji1a5dorc.apps.googleusercontent.com`

### 3. Navigate to OAuth Consent Screen
- In the left sidebar, go to: **APIs & Services** > **Credentials**
- Find your OAuth 2.0 Client ID in the list
- Click on it to edit

### 4. Add Authorized JavaScript Origins
Add these URLs to the "Authorized JavaScript origins" section:

```
https://leonuxai-3.onrender.com
http://localhost:5173
http://localhost:3000
```

### 5. Add Authorized Redirect URIs
Add these URLs to the "Authorized redirect URIs" section:

```
https://leonuxai-3.onrender.com
https://leonuxai-3.onrender.com/
http://localhost:5173
http://localhost:3000
```

### 6. Save Changes
- Click **Save** at the bottom
- Wait 5-10 minutes for changes to propagate

### 7. Test Again
- Clear your browser cache
- Refresh your website
- Try Google Sign-In again

## Alternative: Use Manual Login
If you can't fix the OAuth configuration immediately, users can still use the manual email/OTP login method that's already working.

## Current Status
- ✅ Manual email/OTP login: Working
- ❌ Google OAuth login: Needs configuration fix
- ✅ Direct login after Google auth: Implemented (no OTP step)

## Need Help?
If you need help accessing the Google Cloud Console or don't have the credentials, contact the person who created the OAuth Client ID.
