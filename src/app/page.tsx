'use client'

import { useState } from 'react'
import { PlayerSearch } from '@/components/game/PlayerSearch'
import { ConnectionResult } from '@/components/game/ConnectionResult'
import { GameHeader } from '@/components/layout/GameHeader'
import { usePathfinding } from '@/hooks/usePathfinding'
// --- FIX: Import the official Player type from your central file ---
import { Player } from '@/types/game'

export default function HomePage() {
  // --- FIX: Use the imported Player type for state ---
  const [startPlayer, setStartPlayer] = useState<Player | null>(null)
  const [endPlayer, setEndPlayer] = useState<Player | null>(null)
  
  const { 
    result: gameResult, 
    isSearching, 
    error: searchError, 
    findConnection, 
    reset: resetSearch 
  } = usePathfinding();

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFindConnection = () => {
    if (!startPlayer || !endPlayer) {
      setValidationError('Please select both players');
      return;
    }
    if (startPlayer.id === endPlayer.id) {
      setValidationError('Please select different players');
      return;
    }
    setValidationError(null);
    findConnection(startPlayer.id, endPlayer.id);
  }

  const handleReset = () => {
    setStartPlayer(null)
    setEndPlayer(null)
    resetSearch();
    setValidationError(null);
  }

  const error = validationError || searchError;

  return (
    // Your UI code remains unchanged
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <GameHeader />
        
        {!gameResult ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Connect the Players</h2>
                <p className="text-gray-800">Find the shortest path between two football players</p>
              </div>

              <div className="space-y-6">
                <PlayerSearch
                  label="From:"
                  placeholder="Search for first player..."
                  selectedPlayer={startPlayer}
                  onPlayerSelect={(player) => { setStartPlayer(player); setValidationError(null); }}
                />

                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl text-green-600">↓</span>
                  </div>
                </div>

                <PlayerSearch
                  label="To:"
                  placeholder="Search for second player..."
                  selectedPlayer={endPlayer}
                  onPlayerSelect={(player) => { setEndPlayer(player); setValidationError(null); }}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                onClick={handleFindConnection}
                disabled={isSearching || !startPlayer || !endPlayer}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-4 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Finding Connection...
                  </span>
                ) : ( 'Find Connection' )}
              </button>
              
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="font-bold text-gray-900">12</div>
                  <div className="text-sm text-gray-800">Players</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900">6</div>
                  <div className="text-sm text-gray-800">Max Steps</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900">∞</div>
                  <div className="text-sm text-gray-800">Connections</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ConnectionResult
            result={gameResult}
            onPlayAgain={handleReset}
          />
        )}
      </div>
    </div>
  )
}