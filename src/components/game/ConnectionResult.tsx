'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameResult } from '@/types/game';
import { Scoreboard } from './Scoreboard';
import { CarouselStep } from './CarouselStep';

interface ConnectionResultProps {
  result: GameResult;
  onPlayAgain: () => void;
}

export function ConnectionResult({ result, onPlayAgain }: ConnectionResultProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // FIX: For direct connections, we need to handle the display differently
  const isDirectConnection = result.path.length === 1;
  
  // For direct connections, we only have one slide
  // For multi-step connections, we show each step
  const slides = result.path.map((step, index) => ({
    player1: step.from,
    player2: step.to,
    connection: step.connection
  }));

  const totalSteps = slides.length;

  const navigate = (direction: number) => {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < totalSteps) {
      setCurrentIndex(newIndex);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 space-y-4 w-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Connection Found!</h2>
        <p className="text-gray-600">
          Connected {result.startPlayer.name} to {result.endPlayer.name} in {totalSteps} {totalSteps === 1 ? 'step' : 'steps'}
        </p>
      </div>

      <Scoreboard steps={totalSteps} time={result.searchTime} points={result.score} />
      
      {/* Carousel Container */}
      <div className="relative h-96 overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.div
            key={currentIndex}
            className="absolute w-full h-full"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              if (swipe < -10000 && currentIndex < totalSteps - 1) {
                navigate(1); // Next
              } else if (swipe > 10000 && currentIndex > 0) {
                navigate(-1); // Previous
              }
            }}
          >
            <CarouselStep
              stepNumber={currentIndex + 1}
              totalSteps={totalSteps}
              player1={slides[currentIndex].player1}
              player2={slides[currentIndex].player2}
              connection={slides[currentIndex].connection}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls - Only show if more than 1 step */}
      {totalSteps > 1 && (
        <div className="flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)} 
            disabled={currentIndex === 0}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors font-medium"
          >
            ← Previous
          </button>
          <div className="text-sm font-semibold text-gray-700">
            {currentIndex + 1} / {totalSteps}
          </div>
          <button 
            onClick={() => navigate(1)} 
            disabled={currentIndex === totalSteps - 1}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors font-medium"
          >
            Next →
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4 border-t border-gray-200 space-y-4">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
          Share Result
        </button>
        <button
          onClick={onPlayAgain}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}