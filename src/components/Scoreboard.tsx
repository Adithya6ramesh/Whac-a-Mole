import { motion } from 'motion/react';

interface ScoreboardProps {
  player1Score: number;
  player2Score: number;
  gameMode: '1P' | '2P';
  isMultiplayer?: boolean;
  multiplayerRole?: 'host' | 'guest' | null;
}

export function Scoreboard({ player1Score, player2Score, gameMode, isMultiplayer = false, multiplayerRole }: ScoreboardProps) {
  return (
    <div className="flex justify-center space-x-8 mb-6">
      {/* Player 1 Score */}
      <motion.div 
        className="bg-gradient-to-br from-pink-400 via-pink-300 to-pink-200 px-6 py-4 rounded-2xl shadow-lg border-3 border-white relative overflow-hidden"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Sparkle background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        
        <div className="relative z-10 text-center">
          <div className="text-white mb-1">
            {isMultiplayer ? '🏠 Host' : '👤 Player 1'}
            {isMultiplayer && multiplayerRole === 'host' && ' (You)'}
          </div>
          <motion.div 
            className="text-3xl text-white"
            key={player1Score}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {player1Score.toLocaleString()}
          </motion.div>
        </div>
        
        {/* Crown decoration for leading player */}
        {(gameMode === '2P' && player1Score > player2Score) && (
          <div className="absolute -top-2 -right-2 text-2xl animate-bounce">👑</div>
        )}
      </motion.div>

      {/* Player 2 Score (only in 2P mode) */}
      {gameMode === '2P' && (
        <motion.div 
          className="bg-gradient-to-br from-blue-400 via-blue-300 to-blue-200 px-6 py-4 rounded-2xl shadow-lg border-3 border-white relative overflow-hidden"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {/* Sparkle background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          
          <div className="relative z-10 text-center">
            <div className="text-white mb-1">
              {isMultiplayer ? '👤 Guest' : '👤 Player 2'}
              {isMultiplayer && multiplayerRole === 'guest' && ' (You)'}
            </div>
            <motion.div 
              className="text-3xl text-white"
              key={player2Score}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {player2Score.toLocaleString()}
            </motion.div>
          </div>
          
          {/* Crown decoration for leading player */}
          {player2Score > player1Score && (
            <div className="absolute -top-2 -right-2 text-2xl animate-bounce">👑</div>
          )}
        </motion.div>
      )}
      
      {/* High Score indicator in 1P mode */}
      {gameMode === '1P' && (
        <motion.div 
          className="bg-gradient-to-br from-purple-400 via-purple-300 to-purple-200 px-6 py-4 rounded-2xl shadow-lg border-3 border-white relative overflow-hidden"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          
          <div className="relative z-10 text-center">
            <div className="text-white mb-1">🏆 Best</div>
            <div className="text-3xl text-white">
              {Math.max(player1Score, parseInt(localStorage.getItem('whac-a-mole-highscore') || '0')).toLocaleString()}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}