import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface TimerProps {
  totalTime: number; // in seconds
  gameActive: boolean;
  onTimeUp: () => void;
}

export function Timer({ totalTime, gameActive, onTimeUp }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalTime);

  useEffect(() => {
    if (!gameActive) {
      setTimeLeft(totalTime);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameActive, totalTime, onTimeUp]);

  const progress = (timeLeft / totalTime) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Color changes based on time remaining
  const getTimerColor = () => {
    if (progress > 66) return 'from-green-400 to-emerald-500';
    if (progress > 33) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-red-600';
  };

  const getGlowColor = () => {
    if (progress > 66) return 'shadow-green-400/50';
    if (progress > 33) return 'shadow-yellow-400/50';
    return 'shadow-red-400/50';
  };

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      {/* Timer display */}
      <motion.div 
        className="text-center mb-4"
        animate={{ scale: timeLeft <= 10 ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
      >
        <div className="text-2xl mb-2">⏰</div>
        <div className={`text-4xl ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-purple-600'}`}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </motion.div>

      {/* Progress bar container */}
      <div className="relative bg-gray-200 rounded-full h-6 overflow-hidden border-2 border-white shadow-lg">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400"></div>
        
        {/* Progress bar */}
        <motion.div
          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getTimerColor()} ${getGlowColor()} shadow-lg relative overflow-hidden`}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          
          {/* Pulsing glow when time is low */}
          {timeLeft <= 30 && (
            <motion.div
              className="absolute inset-0 bg-white/20"
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </motion.div>

        {/* Progress bar decorative elements */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="w-1 h-3 bg-white/40 rounded-full"
              style={{ opacity: progress > (i * 20) ? 1 : 0.3 }}
            />
          ))}
        </div>
      </div>

      {/* Time indicators */}
      <div className="flex justify-between mt-2 text-sm text-purple-600">
        <span>0:00</span>
        <span className="animate-pulse">
          {timeLeft <= 10 ? '🚨 HURRY! 🚨' : ''}
        </span>
        <span>{Math.floor(totalTime / 60)}:00</span>
      </div>
    </div>
  );
}