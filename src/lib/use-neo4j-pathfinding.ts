// src/lib/use-neo4j-pathfinding.ts
import { useState } from 'react';

interface PathResult {
  found: boolean;
  path?: any[];
  totalSteps?: number;
  searchTime?: number;
  message?: string;
  error?: string;
}

export function useNeo4jPathfinding() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PathResult | null>(null);

  const findPath = async (player1Name: string, player2Name: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/neo4j-pathfind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ player1Name, player2Name }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setResult({ found: false, error: data.error || 'Failed to find path' });
      } else {
        setResult(data);
      }
    } catch (error) {
      setResult({ 
        found: false, 
        error: 'Network error. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { findPath, isLoading, result };
}