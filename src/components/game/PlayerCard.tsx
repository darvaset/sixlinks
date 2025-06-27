'use client';

import React from 'react';

interface PlayerCardProps {
  player: {
    name: string;
    nationality?: string | null;
    position?: string | null;
  };
  isStart?: boolean;
  isEnd?: boolean;
}

export function PlayerCard({ player, isStart = false, isEnd = false }: PlayerCardProps) {
  const borderClass = isStart
    ? 'border-blue-500'
    : isEnd
    ? 'border-green-500'
    : 'border-gray-300 dark:border-gray-600';

  const initialCharBgClass = isStart
    ? 'bg-blue-500'
    : isEnd
    ? 'bg-green-500'
    : 'bg-gray-400 dark:bg-gray-500';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border-l-4 ${borderClass}`}>
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-full ${initialCharBgClass} flex-shrink-0 flex items-center justify-center text-white font-bold text-xl`}>
          {(player.name || '').charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">{player.name}</p>
          {(player.nationality || player.position) && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {player.nationality}
              {player.nationality && player.position && ' • '}
              {player.position}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}