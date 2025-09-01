import { io, Socket } from 'socket.io-client';
import { moleHitRateLimiter, gameStateRateLimiter } from '../utils/rateLimiter';

export interface GameSession {
  code: string;
  hostId: string;
  guestId?: string;
  gameState: {
    gameActive: boolean;
    gameStartTime?: number;
    player1Score: number;
    player2Score: number;
    currentMoles: boolean[];
    timeLeft: number;
  };
  lastUpdate: number;
}

export interface MultiplayerEvent {
  type: 'mole_hit' | 'game_start' | 'game_end' | 'sync';
  playerId: string;
  data: any;
  timestamp: number;
}

class MultiplayerService {
  private socket: Socket | null = null;
  private currentSession: GameSession | null = null;
  private eventListeners: { [key: string]: Function[] } = {};
  private playerId: string;
  private playerRole: 'host' | 'guest' | null = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private initialized: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.playerId = this.generatePlayerId();
    // Don't auto-initialize in constructor to prevent issues during development
  }

  private generatePlayerId(): string {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Lazy initialization to prevent connection issues during development
  private initializeSocket() {
    if (this.initialized || this.socket?.connected) {
      return;
    }

    this.initialized = true;
    this.connectionStatus = 'connecting';

    try {
      // Connect to the Socket.IO server
      // Always use localhost for development (force localhost even if NODE_ENV is production)
      const serverUrl = 'http://localhost:3001';

      console.log('Initializing Socket.IO connection to:', serverUrl);

      this.socket = io(serverUrl, {
        transports: ['polling', 'websocket'],
        timeout: 10000,
        reconnection: false, // Disable auto-reconnection to prevent issues
        forceNew: true,
        autoConnect: true
      });

      this.setupSocketListeners();
      
      // Connect after a small delay to ensure setup is complete
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, 100);

    } catch (error) {
      console.error('Failed to initialize socket:', error);
      this.connectionStatus = 'disconnected';
      this.initialized = false;
    }
  }

  // Public method to ensure connection
  public ensureConnection() {
    if (!this.initialized && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.initializeSocket();
    }
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    // Clear any existing listeners to prevent duplicates
    this.socket.removeAllListeners();

    this.socket.on('connect', () => {
      console.log('Connected to multiplayer server:', this.socket?.id);
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0; // Reset on successful connection
      this.emit('connected', { playerId: this.socket?.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from multiplayer server, reason:', reason);
      this.connectionStatus = 'disconnected';
      this.emit('disconnected');
      
      // Don't auto-reconnect on manual disconnect
      if (reason === 'io client disconnect') {
        this.initialized = false;
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.connectionStatus = 'disconnected';
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.initialized = false;
      }
      
      this.emit('connectionError', error.message);
    });

    // Game session events
    this.socket.on('player-connected', (data) => {
      console.log('Player connected:', data);
      this.emit('playerConnected', data);
    });

    this.socket.on('player-disconnected', (data) => {
      console.log('Player disconnected:', data);
      this.emit('playerDisconnected', data);
    });

    this.socket.on('host-disconnected', () => {
      console.log('Host disconnected');
      this.currentSession = null;
      this.playerRole = null;
      this.emit('hostDisconnected');
      this.emit('sessionLeft');
    });

    // Game state events
    this.socket.on('game-state-updated', (gameState) => {
      if (this.currentSession) {
        this.currentSession.gameState = gameState;
        this.currentSession.lastUpdate = Date.now();
      }
      this.emit('gameStateUpdate', gameState);
    });

    this.socket.on('game-started', (gameState) => {
      if (this.currentSession) {
        this.currentSession.gameState = gameState;
      }
      this.emit('gameStarted', gameState);
    });

    this.socket.on('game-ended', (gameState) => {
      if (this.currentSession) {
        this.currentSession.gameState = gameState;
      }
      this.emit('gameEnded', gameState);
    });

    this.socket.on('mole-hit-sync', (data) => {
      this.emit('moleHitSync', data);
    });

    this.socket.on('moles-updated', (data) => {
      console.log('MultiplayerService received moles-updated:', data);
      this.emit('molesUpdated', data);
    });

    this.socket.on('mole-spawned', (data) => {
      console.log('MultiplayerService received mole-spawned:', data);
      this.emit('moleSpawned', data);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error.message);
    });
  }

  // Event system with memory leak prevention
  on(event: string, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    
    // Prevent duplicate listeners
    if (!this.eventListeners[event].includes(callback)) {
      this.eventListeners[event].push(callback);
    }
  }

  off(event: string, callback: Function) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
      
      // Clean up empty arrays to prevent memory leaks
      if (this.eventListeners[event].length === 0) {
        delete this.eventListeners[event];
      }
    }
  }

  private emit(event: string, data?: any) {
    if (this.eventListeners[event]) {
      // Create a copy to prevent issues if listeners modify the array during iteration
      const listeners = [...this.eventListeners[event]];
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Check if connected to server
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' {
    return this.connectionStatus;
  }

  // Create a new game session
  createGame(): string {
    this.ensureConnection();
    
    if (!this.socket || !this.socket.connected) {
      this.emit('joinError', 'Not connected to server');
      return '';
    }

    return new Promise<string>((resolve) => {
      this.socket?.emit('create-game', (response: { success: boolean; code?: string; role?: string; error?: string }) => {
        if (response.success && response.code) {
          this.currentSession = {
            code: response.code,
            hostId: this.socket?.id || '',
            gameState: {
              gameActive: false,
              player1Score: 0,
              player2Score: 0,
              currentMoles: Array(16).fill(false),
              timeLeft: 180
            },
            lastUpdate: Date.now()
          };
          this.playerRole = 'host';
          this.emit('sessionCreated', { code: response.code, role: 'host' });
          resolve(response.code);
        } else {
          this.emit('joinError', response.error || 'Failed to create game');
          resolve('');
        }
      });
    }) as any; // Type assertion to handle the async nature
  }

  // Join an existing game session with code
  joinGame(code: string): boolean {
    this.ensureConnection();
    
    if (!this.socket || !this.socket.connected) {
      this.emit('joinError', 'Not connected to server');
      return false;
    }

    this.socket.emit('join-game', { code }, (response: { success: boolean; code?: string; role?: string; gameState?: any; error?: string }) => {
      if (response.success && response.code) {
        this.currentSession = {
          code: response.code,
          hostId: '', // Will be set by server
          guestId: this.socket?.id,
          gameState: response.gameState || {
            gameActive: false,
            player1Score: 0,
            player2Score: 0,
            currentMoles: Array(16).fill(false),
            timeLeft: 180
          },
          lastUpdate: Date.now()
        };
        this.playerRole = 'guest';
        this.emit('sessionJoined', { code: response.code, role: 'guest' });
        return true;
      } else {
        this.emit('joinError', response.error || 'Failed to join game');
        return false;
      }
    });

    return true; // Optimistic return, actual result comes via callback
  }

  // Update game state (scores, mole hits, etc.)
  updateGameState(updates: Partial<GameSession['gameState']>) {
    if (!this.currentSession || !this.socket?.connected) return;

    // Rate limit game state updates to prevent spam
    if (!gameStateRateLimiter.canExecute()) {
      console.warn('Game state update rate limited');
      return;
    }

    this.socket.emit('update-game-state', {
      code: this.currentSession.code,
      updates
    });
  }

  // Start the game (host only)
  startGame() {
    if (!this.currentSession || !this.socket?.connected || this.playerRole !== 'host') {
      return;
    }

    this.socket.emit('start-game', {
      code: this.currentSession.code
    });
  }

  // End the game
  endGame() {
    if (!this.currentSession || !this.socket?.connected) return;

    this.socket.emit('end-game', {
      code: this.currentSession.code
    });
  }

  // Handle mole hit with rate limiting
  handleMoleHit(moleIndex: number, score: number) {
    if (!this.currentSession || !this.socket?.connected) return;

    // Rate limit mole hits to prevent spam and browser crashes
    if (!moleHitRateLimiter.canExecute()) {
      console.warn('Mole hit rate limited');
      return;
    }

    this.socket.emit('mole-hit', {
      code: this.currentSession.code,
      moleIndex,
      score
    });
  }

  // Send multiplayer event
  sendEvent(event: Omit<MultiplayerEvent, 'playerId' | 'timestamp'>) {
    if (!this.currentSession || !this.socket?.connected) return;

    const fullEvent: MultiplayerEvent = {
      ...event,
      playerId: this.playerId,
      timestamp: Date.now()
    };

    // Handle different event types
    switch (event.type) {
      case 'mole_hit':
        this.handleMoleHit(event.data.moleIndex, event.data.score);
        break;
      case 'game_start':
        this.startGame();
        break;
      case 'game_end':
        this.endGame();
        break;
      default:
        console.warn('Unknown event type:', event.type);
    }
  }

  // Leave current session
  leaveSession() {
    if (this.currentSession && this.socket?.connected) {
      this.socket.emit('leave-game', {
        code: this.currentSession.code
      });
    }

    this.currentSession = null;
    this.playerRole = null;
    this.emit('sessionLeft');
  }

  // Get current session info
  getCurrentSession(): GameSession | null {
    return this.currentSession;
  }

  // Get player role
  getPlayerRole(): 'host' | 'guest' | null {
    return this.playerRole;
  }

  // Get player ID
  getPlayerId(): string {
    return this.socket?.id || this.playerId;
  }

  // Cleanup with proper memory management
  disconnect() {
    console.log('Disconnecting multiplayer service...');
    
    // Clear reconnection timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Leave current session first
    if (this.currentSession) {
      this.leaveSession();
    }
    
    // Disconnect socket and clean up listeners
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    // Clear all event listeners
    this.eventListeners = {};
    this.connectionStatus = 'disconnected';
    this.initialized = false;
    this.reconnectAttempts = 0;
    this.currentSession = null;
    this.playerRole = null;
  }
}

// Export singleton instance
export const multiplayerService = new MultiplayerService();

// Also export the class for testing
export default MultiplayerService;