// Simple multiplayer service using localStorage for demo
// In production, this would use WebSocket/Socket.io with a backend

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
  private playerId: string;
  private currentSession: GameSession | null = null;
  private eventListeners: { [key: string]: Function[] } = {};
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.playerId = this.generatePlayerId();
    this.startSync();
  }

  private generatePlayerId(): string {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateGameCode(): string {
    // Generate random 3-digit code
    return Math.floor(100 + Math.random() * 900).toString();
  }

  private startSync() {
    // Sync every 100ms for real-time feel
    this.syncInterval = setInterval(() => {
      if (this.currentSession) {
        this.syncGameState();
      }
    }, 100);
  }

  private syncGameState() {
    if (!this.currentSession) return;

    const sessions = this.getAllSessions();
    const updatedSession = sessions[this.currentSession.code];
    
    if (updatedSession && updatedSession.lastUpdate > this.currentSession.lastUpdate) {
      this.currentSession = updatedSession;
      this.emit('gameStateUpdate', updatedSession.gameState);
    }
  }

  private getAllSessions(): { [code: string]: GameSession } {
    const sessions = localStorage.getItem('whac_multiplayer_sessions');
    return sessions ? JSON.parse(sessions) : {};
  }

  private saveSessions(sessions: { [code: string]: GameSession }) {
    localStorage.setItem('whac_multiplayer_sessions', JSON.stringify(sessions));
  }

  private updateSession(updates: Partial<GameSession>) {
    if (!this.currentSession) return;

    const sessions = this.getAllSessions();
    this.currentSession = {
      ...this.currentSession,
      ...updates,
      lastUpdate: Date.now()
    };
    sessions[this.currentSession.code] = this.currentSession;
    this.saveSessions(sessions);
  }

  // Create a new game session and return invite code
  createGame(): string {
    const code = this.generateGameCode();
    const session: GameSession = {
      code,
      hostId: this.playerId,
      gameState: {
        gameActive: false,
        player1Score: 0,
        player2Score: 0,
        currentMoles: new Array(9).fill(false),
        timeLeft: 180
      },
      lastUpdate: Date.now()
    };

    const sessions = this.getAllSessions();
    sessions[code] = session;
    this.saveSessions(sessions);
    this.currentSession = session;

    this.emit('sessionCreated', { code, role: 'host' });
    return code;
  }

  // Join an existing game session with code
  joinGame(code: string): boolean {
    const sessions = this.getAllSessions();
    const session = sessions[code];

    if (!session) {
      this.emit('joinError', 'Invalid code');
      return false;
    }

    if (session.guestId && session.guestId !== this.playerId) {
      this.emit('joinError', 'Game is full');
      return false;
    }

    // Join the session
    session.guestId = this.playerId;
    session.lastUpdate = Date.now();
    sessions[code] = session;
    this.saveSessions(sessions);
    this.currentSession = session;

    this.emit('sessionJoined', { code, role: 'guest' });
    this.emit('playerConnected', { playerId: this.playerId });
    return true;
  }

  // Update game state (scores, mole hits, etc.)
  updateGameState(updates: Partial<GameSession['gameState']>) {
    if (!this.currentSession) return;

    this.updateSession({
      gameState: {
        ...this.currentSession.gameState,
        ...updates
      }
    });

    this.emit('gameStateUpdate', this.currentSession.gameState);
  }

  // Send multiplayer event
  sendEvent(event: Omit<MultiplayerEvent, 'playerId' | 'timestamp'>) {
    if (!this.currentSession) return;

    const fullEvent: MultiplayerEvent = {
      ...event,
      playerId: this.playerId,
      timestamp: Date.now()
    };

    // Store event in session for other player to pick up
    const sessions = this.getAllSessions();
    const session = sessions[this.currentSession.code];
    if (session) {
      session.lastUpdate = Date.now();
      sessions[this.currentSession.code] = session;
      this.saveSessions(sessions);
    }

    this.emit('multiplayerEvent', fullEvent);
  }

  // Get current session info
  getCurrentSession(): GameSession | null {
    return this.currentSession;
  }

  // Check if player is host
  isHost(): boolean {
    return this.currentSession?.hostId === this.playerId;
  }

  // Check if game has both players
  isGameReady(): boolean {
    return this.currentSession?.guestId != null;
  }

  // Leave current session
  leaveSession() {
    if (this.currentSession) {
      const sessions = this.getAllSessions();
      delete sessions[this.currentSession.code];
      this.saveSessions(sessions);
    }
    this.currentSession = null;
    this.emit('sessionLeft');
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data?: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  // Cleanup
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.leaveSession();
  }
}

export const multiplayerService = new MultiplayerService();
