import { useState, useEffect, useRef } from 'react';
import { Mole } from './Mole';
import { multiplayerService } from '../services/MultiplayerService';

interface GameGridProps {
  gameActive: boolean;
  onScore: (points: number) => void;
  isMultiplayer?: boolean;
}

interface MoleState {
  isVisible: boolean;
  isHit: boolean;
  timeoutId?: NodeJS.Timeout;
}

// Pattern generator for unique game sequences
class PatternGenerator {
  private usedPatterns: Set<string> = new Set();
  private gameStartTime: number = 0;

  generatePattern(gameTime: number): number[] {
    // Create a unique pattern based on game time and random seed
    const seed = Date.now() + Math.random();
    const pattern: number[] = [];
    
    // Generate a sequence of hole indices that won't repeat
    for (let i = 0; i < 50; i++) { // Generate 50 moves ahead
      let nextHole;
      do {
        nextHole = Math.floor((seed * (i + 1) * 997) % 9); // Use prime number for better distribution
      } while (pattern.length > 0 && pattern[pattern.length - 1] === nextHole);
      
      pattern.push(nextHole);
    }
    
    const patternKey = pattern.slice(0, 10).join('-'); // Use first 10 moves as pattern key
    
    // If pattern was used before, modify it slightly
    if (this.usedPatterns.has(patternKey)) {
      for (let i = 0; i < pattern.length; i += 3) {
        pattern[i] = (pattern[i] + 1) % 9;
      }
    }
    
    this.usedPatterns.add(patternKey);
    return pattern;
  }

  reset() {
    this.usedPatterns.clear();
    this.gameStartTime = Date.now();
  }
}

export function GameGrid({ gameActive, onScore, isMultiplayer = false }: GameGridProps) {
  const [moles, setMoles] = useState<MoleState[]>(
    Array(9).fill(null).map(() => ({ isVisible: false, isHit: false }))
  );
  
  // Progressive difficulty and pattern system
  const gameStartTimeRef = useRef<number>(0);
  const patternGeneratorRef = useRef<PatternGenerator>(new PatternGenerator());
  const currentPatternRef = useRef<number[]>([]);
  const patternIndexRef = useRef<number>(0);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!gameActive) {
      // Clear all moles when game is not active
      setMoles(prev => prev.map(mole => ({ 
        ...mole, 
        isVisible: false, 
        isHit: false 
      })));
      
      // Clear intervals and reset pattern
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
      patternIndexRef.current = 0;
      return;
    }

    // Skip local mole spawning in multiplayer mode (server controls moles)
    if (isMultiplayer) {
      // Initialize game start time for scoring in multiplayer
      gameStartTimeRef.current = Date.now();
      return;
    }

    // Initialize game session
    gameStartTimeRef.current = Date.now();
    patternGeneratorRef.current.reset();
    currentPatternRef.current = patternGeneratorRef.current.generatePattern(gameStartTimeRef.current);
    patternIndexRef.current = 0;

    const spawnMole = () => {
      const currentTime = Date.now();
      const elapsedSeconds = (currentTime - gameStartTimeRef.current) / 1000;
      
      // INTENSIVE progressive difficulty: speed increases every 15 seconds (much more aggressive)
      const difficultyLevel = Math.floor(elapsedSeconds / 15); // Faster level progression
      const baseSpawnRate = 1000; // Slightly faster base spawn rate
      const speedIncrease = Math.min(difficultyLevel * 80, 750); // Much bigger speed jumps per level
      const currentSpawnRate = Math.max(baseSpawnRate - speedIncrease, 150); // Much faster minimum (150ms)
      
      // INTENSIVE mole visibility time reduction - gets VERY challenging
      const baseMoleTime = 1800; // Slightly shorter base time
      const timeReduction = Math.min(difficultyLevel * 150, 1200); // Much bigger time reductions
      const currentMoleTime = Math.max(baseMoleTime - timeReduction, 400); // Much shorter minimum (400ms)

      // Use pattern-based hole selection
      const patternIndex = patternIndexRef.current % currentPatternRef.current.length;
      const targetHole = currentPatternRef.current[patternIndex];
      patternIndexRef.current++;

      // Check if target hole is available
      if (!moles[targetHole]?.isVisible && !moles[targetHole]?.isHit) {
        setMoles(prev => {
          const newMoles = [...prev];
          
          // Clear any existing timeout for this hole
          if (newMoles[targetHole].timeoutId) {
            clearTimeout(newMoles[targetHole].timeoutId);
          }
          
          newMoles[targetHole] = { 
            isVisible: true, 
            isHit: false,
            timeoutId: setTimeout(() => {
              setMoles(current => {
                const updated = [...current];
                updated[targetHole] = { isVisible: false, isHit: false };
                return updated;
              });
            }, currentMoleTime)
          };
          return newMoles;
        });
      }

      // Schedule next spawn with progressive speed
      spawnIntervalRef.current = setTimeout(spawnMole, currentSpawnRate + Math.random() * 200);
    };

    // Start the spawning process
    spawnMole();

    return () => {
      if (spawnIntervalRef.current) {
        clearTimeout(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
      moles.forEach(mole => {
        if (mole.timeoutId) clearTimeout(mole.timeoutId);
      });
    };
  }, [gameActive, isMultiplayer]);

  // Handle server-controlled moles in multiplayer mode
  useEffect(() => {
    if (!isMultiplayer) return;

    const handleMolesUpdated = (data: { currentMoles: boolean[]; timestamp: number }) => {
      console.log('GameGrid received moles update:', data.currentMoles);
      setMoles(prev => 
        prev.map((mole, index) => ({
          ...mole,
          isVisible: data.currentMoles[index] || false,
          isHit: false // Reset hit state when moles update
        }))
      );
    };

    const handleMoleSpawned = (data: { moleIndex: number; isVisible: boolean; timestamp: number }) => {
      setMoles(prev => {
        const newMoles = [...prev];
        newMoles[data.moleIndex] = {
          ...newMoles[data.moleIndex],
          isVisible: data.isVisible,
          isHit: false
        };
        return newMoles;
      });
    };

    multiplayerService.on('molesUpdated', handleMolesUpdated);
    multiplayerService.on('moleSpawned', handleMoleSpawned);

    return () => {
      multiplayerService.off('molesUpdated', handleMolesUpdated);
      multiplayerService.off('moleSpawned', handleMoleSpawned);
    };
  }, [isMultiplayer]);

  // Handle multiplayer mole hit synchronization
  useEffect(() => {
    if (!isMultiplayer) return;

    const handleMoleHitSync = (data: { moleIndex: number; playerId: string; score: number }) => {
      // Sync mole hit from other player
      setMoles(prev => {
        const newMoles = [...prev];
        if (newMoles[data.moleIndex].isVisible && !newMoles[data.moleIndex].isHit) {
          newMoles[data.moleIndex] = { ...newMoles[data.moleIndex], isHit: true };
          
          // Clear the mole after hit animation
          setTimeout(() => {
            setMoles(current => {
              const updated = [...current];
              updated[data.moleIndex] = { isVisible: false, isHit: false };
              return updated;
            });
          }, 300);
          
          // Clear timeout if exists
          if (newMoles[data.moleIndex].timeoutId) {
            clearTimeout(newMoles[data.moleIndex].timeoutId);
          }
        }
        return newMoles;
      });
    };

    multiplayerService.on('moleHitSync', handleMoleHitSync);

    return () => {
      multiplayerService.off('moleHitSync', handleMoleHitSync);
    };
  }, [isMultiplayer]);

  const handleMoleClick = (index: number) => {
    if (!gameActive) return;
    
    setMoles(prev => {
      const newMoles = [...prev];
      if (newMoles[index].isVisible && !newMoles[index].isHit) {
        newMoles[index] = { ...newMoles[index], isHit: true };
        
        // Calculate bonus score based on current difficulty level - higher rewards for higher difficulty
        const currentTime = Date.now();
        const gameStartTime = gameStartTimeRef.current || currentTime; // Fallback to current time if not set
        const elapsedSeconds = Math.max(0, (currentTime - gameStartTime) / 1000);
        const difficultyLevel = Math.floor(elapsedSeconds / 15); // Match new 15-second intervals
        const baseScore = 10;
        const difficultyBonus = Math.min(difficultyLevel * 5, 50); // Cap bonus at 50 points
        const totalScore = baseScore + difficultyBonus;
        
        // Schedule score update to happen after render
        setTimeout(() => {
          onScore(totalScore);
        }, 0);
        
        // Send mole hit to multiplayer service if in multiplayer mode
        if (isMultiplayer) {
          multiplayerService.handleMoleHit(index, totalScore);
        }
        
        // Clear the mole after hit animation
        setTimeout(() => {
          setMoles(current => {
            const updated = [...current];
            updated[index] = { isVisible: false, isHit: false };
            return updated;
          });
        }, 300);
        
        // Clear timeout if exists
        if (newMoles[index].timeoutId) {
          clearTimeout(newMoles[index].timeoutId);
        }
      }
      return newMoles;
    });
  };

  // Calculate current difficulty level for display
  const getCurrentDifficultyLevel = () => {
    if (!gameActive) return 0;
    const currentTime = Date.now();
    const gameStartTime = gameStartTimeRef.current || currentTime;
    const elapsedSeconds = Math.max(0, (currentTime - gameStartTime) / 1000);
    return Math.floor(elapsedSeconds / 15) + 1; // Match new 15-second intervals
  };

  return (
    <div className="relative bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-8 rounded-3xl shadow-2xl border-4 border-white backdrop-blur-sm">
      {/* Difficulty Level Indicator - Gets more intense with higher levels */}
      {gameActive && (
        <div className={`absolute -top-4 right-4 text-white px-4 py-2 rounded-full shadow-lg border-2 border-white transition-all duration-300 ${
          getCurrentDifficultyLevel() <= 3 
            ? 'bg-gradient-to-r from-orange-400 to-red-500' 
            : getCurrentDifficultyLevel() <= 6
              ? 'bg-gradient-to-r from-red-500 to-red-700 animate-pulse' 
              : 'bg-gradient-to-r from-red-700 to-purple-900 animate-bounce shadow-red-500/50'
        }`}>
          <div className="flex items-center space-x-2">
            <span>{getCurrentDifficultyLevel() <= 3 ? '🔥' : getCurrentDifficultyLevel() <= 6 ? '💀' : '⚡'}</span>
            <span className="font-bold">
              Level {getCurrentDifficultyLevel()}
              {getCurrentDifficultyLevel() > 6 && ' INSANE!'}
            </span>
          </div>
        </div>
      )}
      
      {/* Decorative candy border */}
      <div className="absolute -inset-2 bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 rounded-3xl blur opacity-75 animate-pulse"></div>
      
      <div className="relative grid grid-cols-3 gap-6 max-w-md mx-auto">
        {moles.map((mole, index) => (
          <div key={index} className="relative">
            {/* Hole decoration ring */}
            <div className="absolute -inset-2 bg-gradient-conic from-pink-300 via-purple-300 to-blue-300 rounded-full opacity-50 animate-spin-slow"></div>
            
            <Mole
              isVisible={mole.isVisible}
              isHit={mole.isHit}
              onClick={() => handleMoleClick(index)}
              holeIndex={index}
            />
          </div>
        ))}
      </div>
      
      {/* Floating candy decorations */}
      <div className="absolute top-4 left-4 text-2xl animate-bounce" style={{ animationDelay: '0s' }}>🍭</div>
      <div className="absolute top-4 right-4 text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>🍬</div>
      <div className="absolute bottom-4 left-4 text-2xl animate-bounce" style={{ animationDelay: '1s' }}>🧁</div>
      <div className="absolute bottom-4 right-4 text-2xl animate-bounce" style={{ animationDelay: '1.5s' }}>🍫</div>
    </div>
  );
}