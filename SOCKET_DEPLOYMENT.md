# Socket.IO Server Deployment Guide

Since Vercel is a static hosting platform and doesn't support persistent WebSocket connections, you need to deploy your Socket.IO server separately.

## Quick Fix Steps

### Step 1: Deploy Socket.IO Server to Railway (Recommended)

1. **Go to [Railway.app](https://railway.app)**
2. **Sign up/login with GitHub**
3. **Create New Project** → **Deploy from GitHub repo**
4. **Select your Whac-a-Mole repository**
5. **Configure the service**:
   - Set **Start Command**: `node server/server.js`
   - Set **Port**: Railway will auto-configure this
6. **Add Environment Variables** in Railway dashboard:
   - `ALLOWED_ORIGINS` = `https://your-vercel-app.vercel.app` (replace with your actual Vercel URL)
7. **Deploy** - Railway will give you a URL like `https://whac-a-mole-production.railway.app`

### Step 2: Update Vercel Environment Variables

1. **Go to your Vercel dashboard**
2. **Select your Whac-a-Mole project**
3. **Go to Settings → Environment Variables**
4. **Add new variable**:
   - **Name**: `VITE_SOCKET_SERVER_URL`
   - **Value**: `https://your-railway-app.railway.app` (replace with your actual Railway URL)
   - **Environments**: Production

### Step 3: Redeploy Frontend

1. **Trigger a new deployment** in Vercel (push to main branch or redeploy from dashboard)

## Alternative Deployment Options

### Option 2: Render
1. Go to [Render.com](https://render.com)
2. Create a new **Web Service**
3. Connect your GitHub repository
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `node server/server.js`
6. Add environment variable: `ALLOWED_ORIGINS` = `https://your-vercel-app.vercel.app`

### Option 3: Heroku
1. Install Heroku CLI
2. Create app: `heroku create your-socket-server`
3. Set environment variables:
   ```bash
   heroku config:set ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   ```
4. Deploy: `git push heroku main`

## Testing Your Deployment

1. **Check server logs** on your deployment platform to ensure it's running
2. **Test from browser console** on your deployed Vercel app:
   ```javascript
   // This should show successful connection in browser console
   console.log('Testing Socket.IO connection...');
   ```
3. **Verify multiplayer functionality** by opening two browser tabs

## Troubleshooting

### Common Issues:

1. **CORS errors**: Make sure `ALLOWED_ORIGINS` includes your Vercel URL
2. **Connection refused**: Verify the `VITE_SOCKET_SERVER_URL` is correct
3. **Server not starting**: Check logs on your deployment platform

### Debug Steps:

1. **Check browser console** for connection errors
2. **Verify environment variables** are set correctly
3. **Test server directly** by visiting your server URL in browser

## Current Configuration

- ✅ **Local development**: Uses `http://localhost:3001`
- ✅ **Production**: Uses environment variable `VITE_SOCKET_SERVER_URL`
- ✅ **CORS**: Configured to accept your Vercel domain
- ✅ **Port**: Automatically configured for deployment platforms
