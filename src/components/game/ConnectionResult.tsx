'use client'

// --- FIX: Import 'motion' from the framer-motion library ---
import { motion } from 'framer-motion' 
import { GameResult, Player } from '@/types/game'
import { Scoreboard } from './Scoreboard'
import { ConnectionLink } from './ConnectionLink'
import { PlayerCard } from './PlayerCard'

interface ConnectionResultProps {
  result: GameResult
  onPlayAgain: () => void
}

export function ConnectionResult({ result, onPlayAgain }: ConnectionResultProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Connection Found!</h2>
        <p className="text-gray-600">
          Connected {result.startPlayer.name} to {result.endPlayer.name} in {result.totalSteps} steps
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Scoreboard 
          steps={result.totalSteps} 
          time={result.searchTime} 
          points={result.score} 
        />
      </motion.div>

      <div className="space-y-2">
        <motion.div variants={itemVariants}>
          <PlayerCard player={result.startPlayer} role="START" />
        </motion.div>

        {result.path.map((step, index) => {
          // Find the corresponding "to" player from the full player objects
          const toPlayer = index === result.path.length - 1 ? result.endPlayer : (step.to as Player);
          return (
            <motion.div key={index} variants={itemVariants} className="space-y-2">
              <ConnectionLink 
                title={step.connection.team || 'Unknown Connection'} 
                subtitle={step.connection.description} 
              />
              <PlayerCard player={toPlayer} role={index < result.path.length - 1 ? `STEP ${index + 1}` : 'END'} />
            </motion.div>
          )
        })}
      </div>

      <motion.div variants={itemVariants} className="pt-6 border-t border-gray-200 space-y-4">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
          Share Result
        </button>
        <button
          onClick={onPlayAgain}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Play Again
        </button>
      </motion.div>
    </motion.div>
  )
}