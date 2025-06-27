// src/app/compare/page.tsx
'use client'

import { useState } from 'react'
import { PlayerSearch } from '@/components/game/PlayerSearch'
import { ConnectionResultNeo4j } from '@/components/game/ConnectionResultNeo4j'
import { PathfindingToggle } from '@/components/game/PathfindingToggle'

interface Player {
  id: number;
  name: string;
  nationality?: string;
  position?: string;
}

export default function ComparePage() {
  const [player1, setPlayer1] = useState<Player | null>(null)
  const [player2, setPlayer2] = useState<Player | null>(null)
  const [useNeo4j, setUseNeo4j] = useState(true)

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Six Degrees of World Football
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Compare PostgreSQL vs Neo4j Performance
          </p>
        </div>

        <PathfindingToggle useNeo4j={useNeo4j} onToggle={setUseNeo4j} />

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <PlayerSearch
            label="Select First Player"
            placeholder="Search for a player..."
            selectedPlayer={player1}
            onPlayerSelect={setPlayer1}
          />
          
          <PlayerSearch
            label="Select Second Player"
            placeholder="Search for another player..."
            selectedPlayer={player2}
            onPlayerSelect={setPlayer2}
          />
        </div>

        <ConnectionResultNeo4j 
          player1={player1} 
          player2={player2}
          useNeo4j={useNeo4j}
        />

        {/* Performance comparison */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Performance Comparison
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                🐘 PostgreSQL (Relational)
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• Harry Kane → Bukayo Saka: ~7,600ms</li>
                <li>• Complex joins for each step</li>
                <li>• Performance degrades exponentially</li>
                <li>• 5-6 step paths: 150+ seconds</li>
              </ul>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 text-green-900 dark:text-green-400">
                ⚡ Neo4j (Graph Database)
              </h3>
              <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
                <li>• Harry Kane → Bukayo Saka: ~100ms</li>
                <li>• Native graph traversal</li>
                <li>• Consistent performance</li>
                <li>• 5-6 step paths: ~150ms</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Neo4j is <span className="font-bold text-green-600 dark:text-green-400">76x faster</span> for 
              simple queries and <span className="font-bold text-green-600 dark:text-green-400">1000x faster</span> for 
              complex paths!
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}