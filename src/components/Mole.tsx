import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface MoleProps {
  isVisible: boolean;
  isHit: boolean;
  onClick: () => void;
  holeIndex: number;
}

export function Mole({ isVisible, isHit, onClick, holeIndex }: MoleProps) {
  return (
    <div className="relative w-24 h-24 mx-auto">
      {/* Hole background with candy gradient */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-900 via-indigo-800 to-slate-900 shadow-inner border-4 border-purple-300 overflow-hidden">
        {/* Hole rim with sparkle effect */}
        <div className="absolute inset-0 rounded-full border-2 border-gradient-to-r from-pink-300 to-purple-300 animate-pulse"></div>
        
        {/* Mole character */}
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{
            y: isVisible ? -10 : 80,
            opacity: isVisible ? 1 : 0,
            scale: isHit ? 0.8 : 1,
            rotate: isHit ? 10 : 0
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            duration: 0.3
          }}
          className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 cursor-pointer ${
            isHit ? 'pointer-events-none' : ''
          }`}
          onClick={onClick}
        >
          <div className="relative">
            {/* Mole body with candy styling */}
            <div className="w-16 h-20 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full shadow-lg border-2 border-amber-400">
              {/* Face */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                {/* Eyes */}
                <div className="flex space-x-2 mb-1">
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                </div>
                {/* Nose */}
                <div className="w-1 h-1 bg-pink-500 rounded-full mx-auto"></div>
              </div>
              
              {/* Cute cheeks */}
              <div className="absolute top-4 left-0 w-3 h-2 bg-pink-300 rounded-full opacity-60"></div>
              <div className="absolute top-4 right-0 w-3 h-2 bg-pink-300 rounded-full opacity-60"></div>
            </div>
            
            {/* Hit effect */}
            {isHit && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <div className="text-2xl">💥</div>
              </motion.div>
            )}
            
            {/* Sparkle effects around mole */}
            {isVisible && !isHit && (
              <>
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -top-2 -left-2 text-yellow-300"
                >
                  ✨
                </motion.div>
                <motion.div
                  animate={{ 
                    rotate: -360,
                    scale: [1, 1.3, 1]
                  }}
                  transition={{ 
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 0.5
                  }}
                  className="absolute -top-1 -right-2 text-pink-300"
                >
                  ⭐
                </motion.div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}