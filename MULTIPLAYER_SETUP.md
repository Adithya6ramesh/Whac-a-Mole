# Whac-a-Mole Multiplayer Setup

## 🚀 Quick Start

Your Whac-a-Mole game now has **real multiplayer functionality** using Socket.IO!

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Application

**Option A: Run both server and client together (Recommended)**
```bash
npm run dev:full
```

**Option B: Run separately**

Terminal 1 (Server):
```bash
npm run server
```

Terminal 2 (Client):
```bash
npm run dev
```

### 3. How to Play Multiplayer

1. **Host a Game:**
   - Switch to "2P" mode in the game
   - Click "Create Invite" 
   - Share the 3-digit code with your friend

2. **Join a Game:**
   - Switch to "2P" mode in the game
   - Enter the 3-digit code from your friend
   - Click "Join"

3. **Start Playing:**
   - Only the host can start the game
   - Both players compete to hit moles
   - Scores are synchronized in real-time
   - Game ends automatically after 3 minutes

## 🔧 Technical Details

### Server
- **Port:** 3001
- **Technology:** Node.js + Express + Socket.IO
- **Features:** 
  - Real-time multiplayer sessions
  - Automatic session cleanup
  - Connection management
  - Game state synchronization

### Client
- **Port:** 5173 (Vite dev server)
- **Technology:** React + TypeScript + Socket.IO Client
- **Features:**
  - Real-time mole hit synchronization
  - Live score updates
  - Connection status indicators
  - Automatic reconnection handling

## 🌐 Deployment

For production deployment:

1. **Update server URL** in `src/services/MultiplayerService.ts`:
   ```typescript
   const serverUrl = 'https://your-deployed-server.com';
   ```

2. **Deploy the server** to platforms like:
   - Heroku
   - Railway
   - Render
   - DigitalOcean

3. **Deploy the client** to platforms like:
   - Vercel (already configured)
   - Netlify
   - GitHub Pages

## 🐛 Troubleshooting

### Browser Crashes / Performance Issues
- **Fixed**: Added rate limiting to prevent mole hit spam
- **Fixed**: Improved memory management with proper event listener cleanup
- **Fixed**: Added connection throttling to prevent rapid reconnection attempts
- Clear browser cache and restart if issues persist

### Connection Issues
- Make sure the server is running on port 3001
- Check if firewall is blocking the connection
- Ensure both server and client are running
- **New**: Connection will now auto-retry up to 3 times before giving up

### Game Not Syncing
- Check browser console for errors
- Verify Socket.IO connection in Network tab
- Restart both server and client
- **New**: Rate limiting prevents too many updates at once

### Code Not Working
- Ensure both players are connected to the same server
- Check that the game code is exactly 3 digits
- Try creating a new game session
- **New**: Wait for connection status to show "connected" before creating/joining

### Memory Leaks (Fixed)
- ✅ Event listeners are now properly cleaned up
- ✅ Socket connections are properly terminated
- ✅ Rate limiting prevents spam that could crash the browser
- ✅ Duplicate listeners are prevented

## 📝 What Changed

### Before (localStorage-based)
- Fake multiplayer using browser storage
- No real connection between players
- Codes didn't actually work across devices

### After (Socket.IO-based)
- ✅ Real-time multiplayer connections
- ✅ Cross-device gameplay
- ✅ Live game state synchronization
- ✅ Proper connection management
- ✅ Automatic session cleanup

## 🎮 Game Features

- **Real-time scoring:** See opponent's score update instantly
- **Synchronized mole hits:** When one player hits a mole, it disappears for both
- **Connection status:** Visual indicators for connection state
- **Host controls:** Only host can start/stop the game
- **Auto cleanup:** Sessions automatically expire after 1 hour of inactivity

Enjoy your real multiplayer Whac-a-Mole game! 🎯✨
