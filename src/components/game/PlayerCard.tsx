'use client'

import { Player } from "@/types/game";

interface PlayerCardProps {
  player: Player;
  role: 'START' | 'END' | string; // e.g., "STEP 1"
}

export function PlayerCard({ player, role }: PlayerCardProps) {
  const isStartOrEnd = role === 'START' || role === 'END';
  const roleColor = isStartOrEnd ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  const borderColor = isStartOrEnd ? 'border-green-200' : 'border-gray-200';

  return (
    <div className={`flex items-center bg-white rounded-lg p-3 border-2 ${borderColor}`}>
      <div className="w-10 h-10 bg-gray-100 rounded-full mr-4 flex items-center justify-center">
        <span className="text-gray-600 font-bold text-lg">
          {player.name.charAt(0)}
        </span>
      </div>
      <div className="flex-1">
        <div className="font-semibold text-gray-900">{player.name}</div>
        <div className="text-sm text-gray-600">
          {player.nationality}
          {player.position && ` • ${player.position}`}
        </div>
      </div>
      <div className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${roleColor}`}>
        {role}
      </div>
    </div>
  )
}