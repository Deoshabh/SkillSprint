# 🔑 API Key Setup Guide for SkillSprint

## Quick Fix for GEMINI_API_KEY Error

The error you're seeing occurs because the `GEMINI_API_KEY` environment variable is not set. Here's how to fix it:

### Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### Step 2: Add the API Key to Your Project

1. Open the `.env.local` file in your project root
2. Replace `your_gemini_api_key_here` with your actual API key:
   ```
   GEMINI_API_KEY=AIzaSyC...your_actual_key_here
   ```

### Step 3: Restart Your Development Server

After adding the API key:
```bash
# Stop your current server (Ctrl+C)
# Then restart it
npm run dev
```

### Optional: YouTube API Key (for enhanced playlist features)

If you want full YouTube playlist functionality:

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API key)
5. Add it to `.env.local`:
   ```
   YOUTUBE_API_KEY=AIzaSyD...your_youtube_key_here
   ```

### Security Note ⚠️

- Never commit your `.env.local` file to version control
- The `.env.local` file is already in `.gitignore` for security
- Keep your API keys private and secure

### Troubleshooting

If you still get the error after adding the key:

1. **Check the key format**: Make sure there are no extra spaces or quotes
2. **Restart the server**: Environment variables are loaded at startup
3. **Verify the file**: Make sure you're editing `.env.local` in the project root
4. **Check the key validity**: Test your API key at [AI Studio](https://aistudio.google.com/)

### Example `.env.local` format:
```bash
# Clerk Authentication (existing)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI Features (add these)
GEMINI_API_KEY=AIzaSyC...your_actual_key_here
YOUTUBE_API_KEY=AIzaSyD...your_youtube_key_here
```

Once you've added your GEMINI_API_KEY, all AI features including:
- Course import enhancements
- AI quiz generation  
- Course content suggestions
- Chatbot functionality

Should work properly! 🚀
