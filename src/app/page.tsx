'use client'

import { useState } from 'react';
import { PersonSearch } from '@/components/game/PersonSearch'; // Import new component
import { PersonCard } from '@/components/game/PersonCard';     // Import new component
import { GameResult, Person } from '@/types/game';   // Import new types

export default function HomePage() {
  const [startPerson, setStartPerson] = useState<Person | null>(null); // Updated state
  const [endPerson, setEndPerson] = useState<Person | null>(null);     // Updated state
  const [gameResult, setGameResult] = useState<GameResult | null>(null); // Updated state name
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testPathfinding = async () => {
    if (!startPerson || !endPerson) { // Updated check
      setError('Please select both a start and an end person.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGameResult(null); // Reset result

    try {
      const response = await fetch('/api/pathfinding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          startPersonId: startPerson.id, // Updated ID name
          endPersonId: endPerson.id     // Updated ID name
        }),
      });

      const data: GameResult = await response.json(); // Cast to GameResult
      
      if (!response.ok) {
        setError(data.message || 'Pathfinding failed'); // Assuming API returns message on error
      } else {
        setGameResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">FootyLinks</h1>
        <p className="text-gray-400 mb-8">Development Test Page</p>
        
        {/* Connection Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Database Status</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-400">Neo4j URI:</span>{' '}
              <span className="text-yellow-400">
                {process.env.NEXT_PUBLIC_NEO4J_STATUS || 'Check server logs'}
              </span>
            </p>
            <p>
              <span className="text-gray-400">Supabase:</span>{' '}
              <span className="text-yellow-400">
                {process.env.NEXT_PUBLIC_SUPABASE_STATUS || 'Check server logs'}
              </span>
            </p>
          </div>
        </div>

        {/* Pathfinding Test */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Pathfinding</h2>
          <p className="text-gray-400 text-sm mb-4">
            Select persons to test the pathfinding algorithm.
            (Requires Neo4j connection and data)
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <PersonSearch // Using new component
              label="Start Person"
              placeholder="Search for a player or manager..."
              selectedPerson={startPerson}
              onPersonSelect={setStartPerson}
            />
            <PersonSearch // Using new component
              label="End Person"
              placeholder="Search for a player or manager..."
              selectedPerson={endPerson}
              onPersonSelect={setEndPerson}
            />
          </div>

          <button
            onClick={testPathfinding}
            disabled={isLoading || !startPerson || !endPerson} // Disable if persons not selected
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {isLoading ? 'Finding Path...' : 'Test Connection'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-300 font-medium">Error</p>
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Result Display */}
        {gameResult && gameResult.found && (
          <div className="bg-green-900/50 border border-green-500 rounded-lg p-4">
            <h3 className="text-xl font-semibold text-green-300 mb-4">Path Found!</h3>
            <p className="text-green-200 text-sm mb-2">Total Steps: {gameResult.totalSteps}</p>
            <p className="text-green-200 text-sm mb-4">Search Time: {gameResult.searchTime}ms</p>

            <div className="flex flex-col space-y-4">
              {gameResult.path.map((step, index) => (
                <div key={index} className="bg-green-800/50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <PersonCard person={step.from} /> {/* Using PersonCard */}
                    <span className="text-green-200 text-lg font-bold">--&gt;</span>
                    <PersonCard person={step.to} />   {/* Using PersonCard */}
                  </div>
                  <p className="text-green-100 text-sm">{step.connection.description}</p>
                  {step.connection.venue && <p className="text-green-100 text-xs">({step.connection.venue} {step.connection.period})</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {gameResult && !gameResult.found && (
          <div className="bg-orange-900/50 border border-orange-500 rounded-lg p-4">
            <h3 className="text-xl font-semibold text-orange-300 mb-4">No Path Found</h3>
            <p className="text-orange-200 text-sm">{gameResult.message || 'Could not find a connection between the selected persons.'}</p>
          </div>
        )}

        {/* Next Steps */}
        <div className="mt-8 text-gray-400 text-sm">
          <h3 className="font-semibold text-white mb-2">Next Steps:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Create Supabase project and get credentials</li>
            <li>Create Neo4j Aura instance and get credentials</li>
            <li>Add credentials to .env.local</li>
            <li>Run Prisma migrations</li>
            <li>Seed sample data</li>
            <li>Test pathfinding with real person IDs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

