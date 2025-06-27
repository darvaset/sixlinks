// src/components/game/PathfindingToggle.tsx
'use client'

interface PathfindingToggleProps {
  useNeo4j: boolean;
  onToggle: (useNeo4j: boolean) => void;
}

export function PathfindingToggle({ useNeo4j, onToggle }: PathfindingToggleProps) {
  return (
    <div className="flex items-center justify-center mb-4">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex items-center">
        <button
          onClick={() => onToggle(false)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            !useNeo4j
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          PostgreSQL
          <span className="ml-1 text-xs text-gray-500">(Slow)</span>
        </button>
        <button
          onClick={() => onToggle(true)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            useNeo4j
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Neo4j
          <span className="ml-1 text-xs text-green-600 dark:text-green-400">(Fast)</span>
        </button>
      </div>
      {useNeo4j && (
        <div className="ml-4 text-sm text-green-600 dark:text-green-400">
          ⚡ Using graph database
        </div>
      )}
    </div>
  );
}