# 🧪 Multiplayer Test Steps

## Current Issues:
- ✅ Server is running (localhost:3001)
- ✅ Event names are consistent (`moles-updated`, `mole-spawned`)
- ✅ Array sizes match (9 moles)
- ❓ Moles not appearing in multiplayer mode

## Debug Steps:

### 1. Open Browser Console
- Open Developer Tools (F12)
- Go to Console tab
- Look for these logs:

**Expected Server Logs:**
```
startMoleSpawning called for session: XXX
spawnMole called for session: XXX
Attempting to spawn X moles. Empty spots: [0,1,2,3,4,5,6,7,8]
Broadcasting moles for session XXX: [true,false,false,...]
```

**Expected Client Logs:**
```
MultiplayerService received moles-updated: {...}
GameGrid received moles update: [true,false,false,...]
```

### 2. Test Flow:
1. **Host**: Switch to 2P mode → Create Invite → Get code
2. **Guest**: Switch to 2P mode → Enter code → Join
3. **Host**: Click "START GAME"
4. **Check**: Both consoles should show logs above
5. **Result**: Moles should appear for both players

### 3. Common Issues & Solutions:

**Issue 1**: No "startMoleSpawning" logs
- Solution: Host needs to start the game (only host can start)

**Issue 2**: "spawnMole called" but no moles broadcast
- Solution: Check if gameActive is true in session

**Issue 3**: Server broadcasts but client doesn't receive
- Solution: Check Socket.IO connection status

**Issue 4**: Client receives but GameGrid doesn't update
- Solution: Check if `isMultiplayer` prop is true

## 🔧 Quick Debug Commands:

**Check server status:**
```bash
curl http://localhost:3001/health
curl http://localhost:3001/sessions
```

**Manual test in browser console:**
```javascript
// Check if socket is connected
multiplayerService.isConnected()

// Check multiplayer status
console.log("Current session:", multiplayerService.getCurrentSession())
```
