'use client';

import React from 'react';

interface StoryStepProps {
  player1Name: string;
  player2Name: string;
  connectionTeam: string;
  connectionType: string; // e.g., 'REPRESENTS', 'PLAYED_FOR'
  stepNumber: number;
}

export function StoryStep({
  player1Name,
  player2Name,
  connectionTeam,
  connectionType,
  stepNumber,
}: StoryStepProps) {
  let sentence: React.ReactNode;

  switch (connectionType) {
    case 'REPRESENTS':
      sentence = (
        <>
          <span className="font-bold text-gray-900 dark:text-gray-100">{player1Name}</span> represents{' '}
          <span className="font-bold text-gray-900 dark:text-gray-100">{connectionTeam}</span> alongside{' '}
          <span className="font-bold text-gray-900 dark:text-gray-100">{player2Name}</span>.
        </>
      );
      break;
    case 'PLAYED_FOR':
      sentence = (
        <>
          <span className="font-bold text-gray-900 dark:text-gray-100">{player1Name}</span> played at{' '}
          <span className="font-bold text-gray-900 dark:text-gray-100">{connectionTeam}</span> with{' '}
          <span className="font-bold text-gray-900 dark:text-gray-100">{player2Name}</span>.
        </>
      );
      break;
    default: // Fallback for other connection types like 'MANAGED_BY'
      sentence = (
        <>
          <span className="font-bold text-gray-900 dark:text-gray-100">{player1Name}</span> is connected to{' '}
          <span className="font-bold text-gray-900 dark:text-gray-100">{player2Name}</span> via{' '}
          <span className="font-bold text-gray-900 dark:text-gray-100">{connectionTeam}</span>.
        </>
      );
  }

  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white flex items-center justify-center rounded-full font-bold text-lg ring-4 ring-white dark:ring-gray-900">
        {stepNumber}
      </div>
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{sentence}</p>
      </div>
    </div>
  );
}