'use client'

import { motion } from 'framer-motion';

export function GameHeader() {
  return (
    <div className="text-center mb-6">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-5xl font-bold text-white mb-2"
      >
        Six Degrees of World Football
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-300 text-lg"
      >
        Discover how any two football players are connected through their careers, teammates, and managers
      </motion.p>
    </div>
  );
}