'use client'

import { useState } from 'react';
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
  // const isDirectConnection = result.path.length === 1;
  
  // For direct connections, we only have one slide
  // For multi-step connections, we show each step
  const slides = result.path.map((step) => ({
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
          <div
            key={currentIndex}
            className="absolute w-full h-full"
          >
            <CarouselStep
              stepNumber={currentIndex + 1}
              totalSteps={totalSteps}
              player1={slides[currentIndex].player1}
              player2={slides[currentIndex].player2}
              connection={slides[currentIndex].connection}
            />
          </div>
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