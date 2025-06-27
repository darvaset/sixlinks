// src/components/game/ConnectionResultNeo4j.tsx
'use client'

import { useState } from 'react'
import { useNeo4jPathfinding } from '@/lib/use-neo4j-pathfinding'

// Define a type for the result structure for type safety
interface PathResult {
  found: boolean;
  totalSteps: number;
  searchTime: number;
  path?: any[]; // Be more specific with your path type if possible
  error?: string;
  message?: string;
}

interface Player {
  id?: number;
  name: string;
  nationality?: string;
  position?: string;
}

interface ConnectionResultProps {
  player1: Player | null;
  player2: Player | null;
  useNeo4j?: boolean;
}

export function ConnectionResultNeo4j({ player1, player2, useNeo4j = true }: ConnectionResultProps) {
  // The hook provides its own result state, but not the setter
  const { findPath, isLoading, result } = useNeo4jPathfinding(); 
  
  const [isPsqlLoading, setIsPsqlLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  // --- FIX ---
  // 1. Create a separate state for the PostgreSQL result
  const [pgResult, setPgResult] = useState<PathResult | null>(null);

  const handleSearch = async () => {
    if (!player1 || !player2) return;
    
    setHasSearched(true);
    setPgResult(null); // Clear previous postgres result
    
    if (useNeo4j) {
      await findPath(player1.name, player2.name);
    } else {
      setIsPsqlLoading(true); 
      try {
        const response = await fetch('/api/find-path', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startPlayerId: player1.id,
            endPlayerId: player2.id
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', { status: response.status, statusText: response.statusText, body: errorText });
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const data = await response.json();
        // --- FIX ---
        // 2. Use our new local state setter
        setPgResult(data);

      } catch (error) {
        console.error('Error finding path with PostgreSQL:', error);
        // --- FIX ---
        // 3. Use the local state setter in the catch block too
        setPgResult({ found: false, error: 'API Error', message: 'Failed to fetch or parse data from the server.', path: [], totalSteps: 0, searchTime: 0 });
      } finally {
        setIsPsqlLoading(false); 
      }
    }
  };
  
  // (Your getConnectionTypeIcon function remains the same)
  const getConnectionTypeIcon = (type: string) => { /* ... */ };

  const isCurrentlyLoading = isLoading || isPsqlLoading;
  // --- FIX ---
  // 4. Decide which result to display based on the `useNeo4j` prop
  const displayResult = useNeo4j ? result : pgResult;

  return (
    <div className="mt-8 w-full max-w-4xl mx-auto">
      {player1 && player2 && (
        <div className="text-center mb-6">
          <button
            onClick={handleSearch}
            disabled={isCurrentlyLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {isCurrentlyLoading ? 'Finding Connection...' : 'Find Connection'}
          </button>
        </div>
      )}

      {/* Render the results based on the 'displayResult' variable */}
      {hasSearched && !isCurrentlyLoading && displayResult && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {displayResult.found ? (
            <>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                  Connection Found!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {displayResult.totalSteps} degree{displayResult.totalSteps !== 1 ? 's' : ''} of separation
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Found in {displayResult.searchTime}ms {useNeo4j ? '(Neo4j)' : '(PostgreSQL)'}
                </p>
              </div>

              <div className="space-y-4">
                {displayResult.path?.map((step: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    {/* ... your path rendering logic ... */}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center">
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
                {displayResult.error || 'No Connection Found'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {displayResult.message || 'These players are not connected within 6 degrees.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}