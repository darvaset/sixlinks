'use client'

import { useState, useEffect } from 'react';
import { PlayerSearch } from '@/components/game/PlayerSearch';
import { ConnectionResult } from '@/components/game/ConnectionResult';
import { GameHeader } from '@/components/layout/GameHeader';
import { StatsBar } from '@/components/layout/StatsBar'; // Assuming you created this from the prompt
import { usePathfinding } from '@/hooks/usePathfinding';
import { Player } from '@/types/game';

export default function HomePage() {
  const [startPlayer, setStartPlayer] = useState<Player | null>(null);
  const [endPlayer, setEndPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState(null); // Initial state as null
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const { 
    result: gameResult, 
    isSearching, 
    error: searchError, 
    findConnection, 
    reset: resetSearch 
  } = usePathfinding();

  // useEffect hook to fetch stats when the component mounts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, []); // Correctly closed hook

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
  }; // Correctly closed function

  const handleReset = () => {
    setStartPlayer(null);
    setEndPlayer(null);
    resetSearch();
    setValidationError(null);
  }; // Correctly closed function

  const error = validationError || searchError;

  // The return statement must be at the top level of the component function
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <GameHeader />

        {/* New StatsBar component rendered prominently */}
        {stats && <StatsBar stats={stats} />}
        
        {!gameResult ? (
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8 mt-6">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Connect the Players
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Find the shortest path between two football players
                </p>
              </div>

              {/* Side-by-side player selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-300 text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={handleFindConnection}
                  disabled={isSearching || !startPlayer || !endPlayer}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-4 rounded-lg transition-all duration-300 ease-in-out disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {isSearching ? 'Finding Connection...' : 'Find Connection'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center mt-6">
            <ConnectionResult
              result={gameResult}
              onPlayAgain={handleReset}
            />
          </div>
        )}
      </div>
    </div>
  );
}