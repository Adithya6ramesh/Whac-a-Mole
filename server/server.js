const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Store active game sessions
const gameSessions = new Map();

// Store active mole spawning intervals
const moleSpawningIntervals = new Map();

// Generate a unique 3-digit game code
function generateGameCode() {
  let code;
  do {
    code = Math.floor(100 + Math.random() * 900).toString();
  } while (gameSessions.has(code));
  return code;
}

// Clean up expired sessions (older than 1 hour)
function cleanupExpiredSessions() {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  for (const [code, session] of gameSessions.entries()) {
    if (now - session.lastUpdate > oneHour) {
      console.log(`Cleaning up expired session: ${code}`);
      gameSessions.delete(code);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupExpiredSessions, 10 * 60 * 1000);

// Server-controlled mole spawning
function startMoleSpawning(gameCode) {
  console.log(`startMoleSpawning called for session: ${gameCode}`);
  const session = gameSessions.get(gameCode);
  if (!session) {
    console.log(`No session found for ${gameCode}`);
    return;
  }

  // Clear any existing interval
  if (moleSpawningIntervals.has(gameCode)) {
    clearInterval(moleSpawningIntervals.get(gameCode));
  }

  const spawnMole = () => {
    console.log(`spawnMole called for session: ${gameCode}`);
    const session = gameSessions.get(gameCode);
    if (!session || !session.gameState.gameActive) {
      console.log(`Game ended or session not found for ${gameCode}, stopping spawning`);
      // Game ended, stop spawning
      if (moleSpawningIntervals.has(gameCode)) {
        clearInterval(moleSpawningIntervals.get(gameCode));
        moleSpawningIntervals.delete(gameCode);
      }
      return;
    }

    // Find empty spots
    const emptySpots = [];
    for (let i = 0; i < 9; i++) {
      if (!session.gameState.currentMoles[i]) {
        emptySpots.push(i);
      }
    }

    // Spawn 1-2 moles if there are empty spots
    const molesToSpawn = Math.min(Math.floor(Math.random() * 2) + 1, emptySpots.length, 3);
    console.log(`Attempting to spawn ${molesToSpawn} moles. Empty spots:`, emptySpots);
    
    for (let i = 0; i < molesToSpawn; i++) {
      if (emptySpots.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptySpots.length);
        const moleIndex = emptySpots.splice(randomIndex, 1)[0];
        
        session.gameState.currentMoles[moleIndex] = true;
        
        // Schedule mole to disappear after 1.5-3 seconds
        setTimeout(() => {
          const currentSession = gameSessions.get(gameCode);
          if (currentSession && currentSession.gameState.currentMoles[moleIndex]) {
            currentSession.gameState.currentMoles[moleIndex] = false;
            currentSession.lastUpdate = Date.now();
            
            // Broadcast updated mole state
            io.to(gameCode).emit('mole-spawned', {
              moleIndex,
              isVisible: false,
              timestamp: Date.now()
            });
          }
        }, 1500 + Math.random() * 1500);
      }
    }

    session.lastUpdate = Date.now();
    
    // Broadcast new mole state to all players
    console.log(`Broadcasting moles for session ${gameCode}:`, session.gameState.currentMoles);
    io.to(gameCode).emit('moles-updated', {
      currentMoles: session.gameState.currentMoles,
      timestamp: Date.now()
    });
  };

  // Start spawning moles every 800-1200ms
  const interval = setInterval(spawnMole, 800 + Math.random() * 400);
  moleSpawningIntervals.set(gameCode, interval);
  
  // Spawn first mole immediately
  console.log(`Scheduling first mole spawn for session ${gameCode}`);
  setTimeout(spawnMole, 100); // Reduce delay to 100ms
}

function stopMoleSpawning(gameCode) {
  if (moleSpawningIntervals.has(gameCode)) {
    clearInterval(moleSpawningIntervals.get(gameCode));
    moleSpawningIntervals.delete(gameCode);
  }
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create a new game session
  socket.on('create-game', (callback) => {
    const gameCode = generateGameCode();
    const gameSession = {
      code: gameCode,
      hostId: socket.id,
      guestId: null,
      gameState: {
        gameActive: false,
        gameStartTime: null,
        player1Score: 0,
        player2Score: 0,
        currentMoles: Array(9).fill(false),
        timeLeft: 180
      },
      lastUpdate: Date.now()
    };

    gameSessions.set(gameCode, gameSession);
    socket.join(gameCode);
    
    console.log(`Game created: ${gameCode} by ${socket.id}`);
    callback({ success: true, code: gameCode, role: 'host' });
  });

  // Join an existing game session
  socket.on('join-game', (data, callback) => {
    const { code } = data;
    const session = gameSessions.get(code);

    if (!session) {
      callback({ success: false, error: 'Invalid game code' });
      return;
    }

    if (session.guestId && session.guestId !== socket.id) {
      callback({ success: false, error: 'Game is full' });
      return;
    }

    // Join the session
    session.guestId = socket.id;
    session.lastUpdate = Date.now();
    socket.join(code);

    console.log(`Player joined game: ${code} - ${socket.id}`);
    
    // Notify both players that connection is established
    socket.to(code).emit('player-connected', { playerId: socket.id });
    callback({ success: true, code, role: 'guest', gameState: session.gameState });
  });

  // Update game state (scores, mole hits, etc.)
  socket.on('update-game-state', (data) => {
    const { code, updates } = data;
    const session = gameSessions.get(code);

    if (!session) {
      socket.emit('error', { message: 'Game session not found' });
      return;
    }

    // Verify the player is part of this session
    if (socket.id !== session.hostId && socket.id !== session.guestId) {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    // Update the game state
    session.gameState = { ...session.gameState, ...updates };
    session.lastUpdate = Date.now();

    // Broadcast the updated game state to all players in the room
    io.to(code).emit('game-state-updated', session.gameState);
    console.log(`Game state updated for session ${code}:`, updates);
  });

  // Start game
  socket.on('start-game', (data) => {
    const { code } = data;
    const session = gameSessions.get(code);

    if (!session || socket.id !== session.hostId) {
      socket.emit('error', { message: 'Only host can start the game' });
      return;
    }

    session.gameState.gameActive = true;
    session.gameState.gameStartTime = Date.now();
    session.gameState.player1Score = 0;
    session.gameState.player2Score = 0;
    session.gameState.timeLeft = 180;
    session.gameState.currentMoles = Array(9).fill(false); // Reset moles
    session.lastUpdate = Date.now();

    // Start mole spawning on server
    console.log(`Starting mole spawning for session ${code}`);
    startMoleSpawning(code);

    io.to(code).emit('game-started', session.gameState);
    console.log(`Game started for session ${code}`);
  });

  // End game
  socket.on('end-game', (data) => {
    const { code } = data;
    const session = gameSessions.get(code);

    if (!session) {
      socket.emit('error', { message: 'Game session not found' });
      return;
    }

    session.gameState.gameActive = false;
    session.gameState.currentMoles = Array(9).fill(false); // Clear all moles
    session.lastUpdate = Date.now();

    // Stop mole spawning
    stopMoleSpawning(code);

    io.to(code).emit('game-ended', session.gameState);
    console.log(`Game ended for session ${code}`);
  });

  // Handle mole hits
  socket.on('mole-hit', (data) => {
    const { code, moleIndex, score } = data;
    const session = gameSessions.get(code);

    if (!session) {
      socket.emit('error', { message: 'Game session not found' });
      return;
    }

    // Check if the mole is actually visible and not already hit
    if (!session.gameState.currentMoles[moleIndex]) {
      socket.emit('error', { message: 'Invalid mole hit' });
      return;
    }

    // Mark mole as hit (make it invisible)
    session.gameState.currentMoles[moleIndex] = false;

    // Determine which player scored
    let updates = {};
    if (socket.id === session.hostId) {
      updates.player1Score = session.gameState.player1Score + score;
    } else if (socket.id === session.guestId) {
      updates.player2Score = session.gameState.player2Score + score;
    }

    // Update game state
    session.gameState = { ...session.gameState, ...updates };
    session.lastUpdate = Date.now();

    // Broadcast to all players in the room
    io.to(code).emit('game-state-updated', session.gameState);
    io.to(code).emit('mole-hit-sync', { moleIndex, playerId: socket.id, score });
    
    console.log(`Mole hit in session ${code} by ${socket.id}, score: ${score}`);
  });

  // Leave game session
  socket.on('leave-game', (data) => {
    const { code } = data;
    const session = gameSessions.get(code);

    if (session) {
      socket.leave(code);
      
      if (socket.id === session.hostId) {
        // Host left, notify guest and clean up session
        socket.to(code).emit('host-disconnected');
        stopMoleSpawning(code);
        gameSessions.delete(code);
        console.log(`Host left, session ${code} deleted`);
      } else if (socket.id === session.guestId) {
        // Guest left, just remove them from session
        session.guestId = null;
        session.lastUpdate = Date.now();
        socket.to(code).emit('player-disconnected', { playerId: socket.id });
        console.log(`Guest left session ${code}`);
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find and clean up any sessions this user was part of
    for (const [code, session] of gameSessions.entries()) {
      if (session.hostId === socket.id) {
        // Host disconnected, notify guest and remove session
        socket.to(code).emit('host-disconnected');
        stopMoleSpawning(code);
        gameSessions.delete(code);
        console.log(`Host disconnected, session ${code} deleted`);
      } else if (session.guestId === socket.id) {
        // Guest disconnected, just remove them
        session.guestId = null;
        session.lastUpdate = Date.now();
        socket.to(code).emit('player-disconnected', { playerId: socket.id });
        console.log(`Guest disconnected from session ${code}`);
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    activeSessions: gameSessions.size,
    timestamp: new Date().toISOString()
  });
});

// Get session info (for debugging)
app.get('/sessions', (req, res) => {
  const sessions = Array.from(gameSessions.entries()).map(([code, session]) => ({
    code,
    hostId: session.hostId,
    guestId: session.guestId,
    gameActive: session.gameState.gameActive,
    lastUpdate: session.lastUpdate
  }));
  res.json(sessions);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
  console.log(`🎮 Ready for Whac-a-Mole multiplayer connections!`);
});
