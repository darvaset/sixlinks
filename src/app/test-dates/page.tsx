'use client'

import { useState, useEffect } from 'react'
import { StatsBar, Stats } from '@/components/layout/StatsBar'
import { PlayerSearch } from '@/components/game/PlayerSearch'
import { ConnectionResult } from '@/components/game/ConnectionResult'
import { GameHeader } from '@/components/layout/GameHeader'
import { LeaguesCoverage } from '@/components/layout/LeaguesCoverage'
import { usePathfinding } from '@/hooks/usePathfinding'
import { Player } from '@/types/game'

export default function HomePage() {
  const [startPlayer, setStartPlayer] = useState<Player | null>(null)
  const [endPlayer, setEndPlayer] = useState<Player | null>(null)
  
  // New state for the richer, dynamic stats. Initialized to null for loading state.
  const [stats, setStats] = useState<Stats | null>(null);

  const { 
    result: gameResult, 
    isSearching, 
    error: searchError, 
    findConnection, 
    reset: resetSearch 
  } = usePathfinding();

  const [validationError, setValidationError] = useState<string | null>(null);

  // --- FIX: This useEffect hook fetches stats when the component mounts ---
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data: Stats = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, []); // The empty dependency array [] ensures this runs only once

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <GameHeader />
        
        {/* Add LeaguesCoverage component here */}
        <LeaguesCoverage />
        
        {!gameResult ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Connect the Players</h2>
                <p className="text-gray-800">Find the shortest path between two football players</p>
              </div>

              {/* StatsBar component */}
              <StatsBar stats={stats} />

              {/* --- FIX: Side-by-side player selection for larger screens --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <PlayerSearch
                  label="From:"
                  placeholder="Search for first player..."
                  selectedPlayer={startPlayer}
                  onPlayerSelect={(player) => { setStartPlayer(player); setValidationError(null); }}
                />
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
                {isSearching ? ( <span>Finding Connection...</span> ) : ( 'Find Connection' )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <ConnectionResult
              result={gameResult}
              onPlayAgain={handleReset}
            />
          </div>
        )}
      </div>
    </div>
  )
}