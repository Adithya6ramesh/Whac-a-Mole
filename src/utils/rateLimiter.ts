// Rate limiter to prevent spam and browser crashes
class RateLimiter {
  private lastExecutionTime: number = 0;
  private minInterval: number;

  constructor(minIntervalMs: number) {
    this.minInterval = minIntervalMs;
  }

  canExecute(): boolean {
    const now = Date.now();
    if (now - this.lastExecutionTime >= this.minInterval) {
      this.lastExecutionTime = now;
      return true;
    }
    return false;
  }

  reset() {
    this.lastExecutionTime = 0;
  }
}

// Rate limiter for mole hits (prevent more than 10 hits per second)
export const moleHitRateLimiter = new RateLimiter(100);

// Rate limiter for game state updates (prevent more than 5 updates per second)
export const gameStateRateLimiter = new RateLimiter(200);

// Rate limiter for connection attempts (prevent more than 1 attempt per 2 seconds)
export const connectionRateLimiter = new RateLimiter(2000);
