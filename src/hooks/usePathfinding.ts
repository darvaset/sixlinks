import { useState } from 'react';
// --- FIX: Import the centralized GameResult type ---
import { GameResult } from '@/types/game';

export function usePathfinding() {
  // --- FIX: Use the imported type for the state ---
  const [result, setResult] = useState<GameResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findConnection = async (startId: number, endId: number) => {
    setIsSearching(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/pathfinding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startPlayerId: startId, endPlayerId: endId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to find connection');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSearching(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setIsSearching(false);
  };

  return { result, isSearching, error, findConnection, reset };
}