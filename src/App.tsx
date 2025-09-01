import { useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { GameHeader } from './components/GameHeader';
import { GameGrid } from './components/GameGrid';
import { GameControls } from './components/GameControls';
import { Scoreboard } from './components/Scoreboard';
import { Timer } from './components/Timer';
import { MultiplayerControls } from './components/MultiplayerControls';
import { multiplayerService } from './services/MultiplayerService';

export default function App() {
  const [gameActive, setGameActive] = useState(false);
  const [gameMode, setGameMode] = useState<'1P' | '2P'>('1P');
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gameTime] = useState(180); // 3 minutes in seconds
  
  // Multiplayer state
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [multiplayerRole, setMultiplayerRole] = useState<'host' | 'guest' | null>(null);
  const [showMultiplayerControls, setShowMultiplayerControls] = useState(false);

  // Handle scoring
  const handleScore = useCallback((points: number) => {
    if (gameMode === '1P') {
      setPlayer1Score(prev => prev + points);
    } else if (isMultiplayer) {
      // In multiplayer mode, update based on player role
      if (multiplayerRole === 'host') {
        setPlayer1Score(prev => {
          const newScore = prev + points;
          multiplayerService.updateGameState({ player1Score: newScore });
          return newScore;
        });
      } else {
        setPlayer2Score(prev => {
          const newScore = prev + points;
          multiplayerService.updateGameState({ player2Score: newScore });
          return newScore;
        });
      }
    } else {
      // Local 2P mode, alternate scoring
      if (currentPlayer === 1) {
        setPlayer1Score(prev => prev + points);
        setCurrentPlayer(2);
      } else {
        setPlayer2Score(prev => prev + points);
        setCurrentPlayer(1);
      }
    }
  }, [gameMode, currentPlayer, isMultiplayer, multiplayerRole]);

  // Start game
  const handleStartGame = useCallback(() => {
    if (isMultiplayer && multiplayerRole === 'host') {
      // Host starts the multiplayer game
      multiplayerService.startGame();
    } else if (!isMultiplayer) {
      // Local game start
      setGameActive(true);
      setPlayer1Score(0);
      setPlayer2Score(0);
      setCurrentPlayer(1);
    }
    // For multiplayer guests, they can't start the game
  }, [isMultiplayer, multiplayerRole]);

  // Stop game
  const handleStopGame = useCallback(() => {
    if (isMultiplayer) {
      // End multiplayer game
      multiplayerService.endGame();
    } else {
      // Local game end
      setGameActive(false);
      
      // Save high score in 1P mode
      if (gameMode === '1P') {
        const currentHighScore = parseInt(localStorage.getItem('whac-a-mole-highscore') || '0');
        if (player1Score > currentHighScore) {
          localStorage.setItem('whac-a-mole-highscore', player1Score.toString());
        }
      }
    }
  }, [gameMode, player1Score, isMultiplayer]);

  // Handle time up
  const handleTimeUp = useCallback(() => {
    handleStopGame();
  }, [handleStopGame]);

  // Handle mode change
  const handleModeChange = useCallback((mode: '1P' | '2P') => {
    if (!gameActive) {
      setGameMode(mode);
      setPlayer1Score(0);
      setPlayer2Score(0);
      setCurrentPlayer(1);
      
      // Show multiplayer controls when switching to 2P mode
      if (mode === '2P') {
        setShowMultiplayerControls(true);
      } else {
        setShowMultiplayerControls(false);
        setIsMultiplayer(false);
        setMultiplayerRole(null);
      }
    }
  }, [gameActive]);

  // Handle multiplayer state changes
  const handleMultiplayerStateChange = useCallback((isMultiplayerActive: boolean, role?: 'host' | 'guest') => {
    setIsMultiplayer(isMultiplayerActive);
    setMultiplayerRole(role || null);
    
    if (isMultiplayerActive) {
      setGameMode('2P');
    }
  }, []);

  // Sync multiplayer game state
  useEffect(() => {
    if (!isMultiplayer) return;

    const handleGameStateUpdate = (gameState: any) => {
      setPlayer1Score(gameState.player1Score);
      setPlayer2Score(gameState.player2Score);
      setGameActive(gameState.gameActive);
    };

    const handleGameStarted = (gameState: any) => {
      setGameActive(true);
      setPlayer1Score(gameState.player1Score);
      setPlayer2Score(gameState.player2Score);
    };

    const handleGameEnded = (gameState: any) => {
      setGameActive(false);
      setPlayer1Score(gameState.player1Score);
      setPlayer2Score(gameState.player2Score);
    };

    const handleHostDisconnected = () => {
      setIsMultiplayer(false);
      setMultiplayerRole(null);
      setGameActive(false);
      // Show a notification that host disconnected
      console.log('Host disconnected from the game');
    };

    const handleConnectionError = (error: string) => {
      console.error('Multiplayer connection error:', error);
      // Could show a toast notification here
    };

    multiplayerService.on('gameStateUpdate', handleGameStateUpdate);
    multiplayerService.on('gameStarted', handleGameStarted);
    multiplayerService.on('gameEnded', handleGameEnded);
    multiplayerService.on('hostDisconnected', handleHostDisconnected);
    multiplayerService.on('connectionError', handleConnectionError);

    return () => {
      multiplayerService.off('gameStateUpdate', handleGameStateUpdate);
      multiplayerService.off('gameStarted', handleGameStarted);
      multiplayerService.off('gameEnded', handleGameEnded);
      multiplayerService.off('hostDisconnected', handleHostDisconnected);
      multiplayerService.off('connectionError', handleConnectionError);
    };
  }, [isMultiplayer]);

  // Cleanup on component unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      multiplayerService.disconnect();
    };

    // Add cleanup on page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Don't disconnect here as it may interfere with other components
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-blue-200 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating candy pattern */}
        <div className="absolute top-10 left-10 text-6xl opacity-20 animate-spin-slow">🍭</div>
        <div className="absolute top-20 right-20 text-4xl opacity-20 animate-bounce">🍬</div>
        <div className="absolute bottom-20 left-20 text-5xl opacity-20 animate-pulse">🧁</div>
        <div className="absolute bottom-10 right-10 text-3xl opacity-20 animate-spin-slow">🍫</div>
        
        {/* Gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-radial from-pink-300/30 to-transparent rounded-full blur-xl"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-3/4 right-1/4 w-40 h-40 bg-gradient-radial from-blue-300/30 to-transparent rounded-full blur-xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* Main game content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Game Header */}
          <GameHeader />

          {/* Scoreboard */}
          <Scoreboard 
            player1Score={player1Score}
            player2Score={player2Score}
            gameMode={gameMode}
            isMultiplayer={isMultiplayer}
            multiplayerRole={multiplayerRole}
          />

          {/* Timer */}
          <Timer 
            totalTime={gameTime}
            gameActive={gameActive}
            onTimeUp={handleTimeUp}
          />

          {/* Multiplayer Controls */}
          {showMultiplayerControls && (
            <MultiplayerControls 
              onMultiplayerStateChange={handleMultiplayerStateChange}
            />
          )}

          {/* Game Grid */}
          <div className="mb-8 relative">
            <GameGrid 
              gameActive={gameActive}
              onScore={handleScore}
              isMultiplayer={isMultiplayer}
            />
            
            {/* Current player indicator for 2P mode */}
            {gameMode === '2P' && gameActive && !isMultiplayer && (
              <motion.div
                className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full shadow-lg"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                Player {currentPlayer}'s Turn!
              </motion.div>
            )}
            
            {/* Multiplayer indicator */}
            {isMultiplayer && gameActive && (
              <motion.div
                className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-400 to-blue-400 text-white px-4 py-2 rounded-full shadow-lg"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🌐 You are {multiplayerRole === 'host' ? 'Player 1 (Host)' : 'Player 2 (Guest)'}
              </motion.div>
            )}
          </div>

          {/* Game Controls */}
          <GameControls 
            gameActive={gameActive}
            gameMode={gameMode}
            onStartGame={handleStartGame}
            onStopGame={handleStopGame}
            onModeChange={handleModeChange}
            isMultiplayer={isMultiplayer}
            multiplayerRole={multiplayerRole}
          />

          {/* Game over celebration */}
          {!gameActive && (player1Score > 0 || player2Score > 0) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 text-center p-6 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-3xl border-4 border-white shadow-xl"
            >
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-2xl mb-2">Game Over!</div>
              {gameMode === '1P' ? (
                <div className="text-lg">
                  Final Score: {player1Score} points!
                  {player1Score > parseInt(localStorage.getItem('whac-a-mole-highscore') || '0') && (
                    <div className="text-yellow-600 mt-2">🏆 New High Score! 🏆</div>
                  )}
                </div>
              ) : isMultiplayer ? (
                <div className="text-lg">
                  <div className="text-xl mb-3">🌐 Multiplayer Results</div>
                  {player1Score > player2Score 
                    ? '👑 Player 1 (Host) Wins!' 
                    : player2Score > player1Score 
                      ? '👑 Player 2 (Guest) Wins!'
                      : '🤝 It\'s a Tie!'}
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className={`p-2 rounded-lg ${multiplayerRole === 'host' ? 'bg-yellow-200' : 'bg-gray-200'}`}>
                      🏠 Host: {player1Score}
                    </div>
                    <div className={`p-2 rounded-lg ${multiplayerRole === 'guest' ? 'bg-yellow-200' : 'bg-gray-200'}`}>
                      👤 Guest: {player2Score}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-lg">
                  {player1Score > player2Score 
                    ? '👑 Player 1 Wins!' 
                    : player2Score > player1Score 
                      ? '👑 Player 2 Wins!'
                      : '🤝 It\'s a Tie!'}
                  <div className="mt-2">
                    Player 1: {player1Score} | Player 2: {player2Score}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}