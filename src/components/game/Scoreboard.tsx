'use client'

interface ScoreboardProps {
  steps: number;
  time: number;
  points: number;
}

export function Scoreboard({ steps, time, points }: ScoreboardProps) {
  return (
    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
      <div className="flex justify-around items-center text-center">
        <div className="px-2">
          <div className="text-3xl font-bold text-green-700">{steps}</div>
          <div className="text-xs sm:text-sm font-medium text-gray-600 uppercase">Steps</div>
        </div>
        <div className="border-l border-green-200 h-10"></div>
        <div className="px-2">
          <div className="text-3xl font-bold text-green-700">{time}<span className="text-lg">ms</span></div>
          <div className="text-xs sm:text-sm font-medium text-gray-600 uppercase">Time</div>
        </div>
        <div className="border-l border-green-200 h-10"></div>
        <div className="px-2">
          <div className="text-3xl font-bold text-green-700">{points}</div>
          <div className="text-xs sm:text-sm font-medium text-gray-600 uppercase">Points</div>
        </div>
      </div>
    </div>
  );
}