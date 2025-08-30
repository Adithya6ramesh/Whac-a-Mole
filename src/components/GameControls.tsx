import { motion } from 'motion/react';
import { Button } from './ui/button';

interface GameControlsProps {
  gameActive: boolean;
  gameMode: '1P' | '2P';
  onStartGame: () => void;
  onStopGame: () => void;
  onModeChange: (mode: '1P' | '2P') => void;
}

export function GameControls({ 
  gameActive, 
  gameMode, 
  onStartGame, 
  onStopGame, 
  onModeChange 
}: GameControlsProps) {
  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Mode Selection */}
      <div className="flex space-x-4 mb-4">
        <motion.button
          className={`px-6 py-3 rounded-2xl border-3 border-white shadow-lg transition-all duration-300 ${
            gameMode === '1P' 
              ? 'bg-gradient-to-br from-pink-400 to-pink-600 text-white shadow-pink-400/50' 
              : 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-600 hover:from-pink-300 hover:to-pink-500'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onModeChange('1P')}
          disabled={gameActive}
        >
          <div className="flex items-center space-x-2">
            <span>👤</span>
            <span>Single Player</span>
          </div>
        </motion.button>

        <motion.button
          className={`px-6 py-3 rounded-2xl border-3 border-white shadow-lg transition-all duration-300 ${
            gameMode === '2P' 
              ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-blue-400/50' 
              : 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-600 hover:from-blue-300 hover:to-blue-500'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onModeChange('2P')}
          disabled={gameActive}
        >
          <div className="flex items-center space-x-2">
            <span>👥</span>
            <span>Two Players</span>
          </div>
        </motion.button>
      </div>

      {/* Start/Stop Button */}
      <motion.button
        className={`px-12 py-6 rounded-3xl border-4 border-white shadow-2xl text-2xl relative overflow-hidden ${
          gameActive
            ? 'bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-white shadow-red-400/50'
            : 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-white shadow-emerald-400/50'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={gameActive ? onStopGame : onStartGame}
        animate={gameActive ? {} : { 
          boxShadow: [
            '0 0 20px rgba(16, 185, 129, 0.5)',
            '0 0 40px rgba(16, 185, 129, 0.8)',
            '0 0 20px rgba(16, 185, 129, 0.5)'
          ]
        }}
        transition={{ 
          duration: 2, 
          repeat: gameActive ? 0 : Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Animated background shine */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        
        {/* Button content */}
        <div className="relative z-10 flex items-center space-x-3">
          <span className="text-3xl">
            {gameActive ? '⏹️' : '▶️'}
          </span>
          <span>
            {gameActive ? 'STOP GAME' : 'START GAME'}
          </span>
        </div>

        {/* Pulsing effect for start button */}
        {!gameActive && (
          <motion.div
            className="absolute inset-0 bg-white/10 rounded-3xl"
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Game instructions */}
      <motion.div 
        className="text-center max-w-md mx-auto mt-6 p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl border-2 border-white shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-lg mb-2">🎯 How to Play</div>
        <div className="text-sm text-purple-700">
          Click on the moles as they pop up! Base score: 10 points + difficulty bonus. 
          {gameMode === '2P' ? ' Compete simultaneously!' : ' INTENSE difficulty increases every 15 seconds!'}
          <div className="mt-1 text-xs text-purple-600">
            🔥 3-minute challenge! Game gets MUCH faster and awards +5 points per level!
          </div>
        </div>
      </motion.div>
    </div>
  );
}