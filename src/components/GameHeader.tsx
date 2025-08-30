import { motion } from 'motion/react';

export function GameHeader() {
  return (
    <motion.div 
      className="text-center mb-8 relative"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10">
        {/* Floating candy decorations */}
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/4 text-4xl"
        >
          🍭
        </motion.div>
        
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, -5, 5, 0]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-0 right-1/4 text-4xl"
        >
          🍬
        </motion.div>

        <motion.div
          animate={{ 
            y: [0, -8, 0],
            rotate: [0, 8, -8, 0]
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-4 left-1/6 text-3xl"
        >
          🧁
        </motion.div>

        <motion.div
          animate={{ 
            y: [0, -12, 0],
            rotate: [0, -8, 8, 0]
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute top-4 right-1/6 text-3xl"
        >
          🍫
        </motion.div>
      </div>

      {/* Main title */}
      <motion.div
        className="relative"
        animate={{ 
          scale: [1, 1.02, 1],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Title shadow/glow effect */}
        <div className="absolute inset-0 text-6xl md:text-8xl bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent blur-sm opacity-50">
          WHAC-A-MOLE
        </div>
        
        {/* Main title text */}
        <h1 className="relative text-6xl md:text-8xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent drop-shadow-lg">
          WHAC-A-MOLE
        </h1>
        
        {/* Decorative elements on title */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-3xl"
        >
          ⭐
        </motion.div>
      </motion.div>

      {/* Subtitle */}
      <motion.div 
        className="mt-4 text-xl md:text-2xl text-purple-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
          🎮 Candy Arcade Edition 🎮
        </span>
      </motion.div>

      {/* Animated border decoration */}
      <motion.div 
        className="mx-auto mt-6 w-64 h-1 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-full"
        animate={{ 
          scaleX: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Sparkle effects */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-yellow-300"
            style={{
              left: `${20 + (i * 15)}%`,
              top: `${30 + (i % 2) * 40}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
          >
            ✨
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}