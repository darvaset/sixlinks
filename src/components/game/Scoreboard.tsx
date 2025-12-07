'use client'



interface ScoreboardProps {
  steps: number;
  time: number;
  points: number;
}

export function Scoreboard({ steps, time, points }: ScoreboardProps) {
  const timeInSeconds = (time / 1000).toFixed(1);
  
  return (
    <div
      className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4"
    >
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-gray-600">Steps</p>
          <p className="text-2xl font-bold text-gray-900">{steps}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Time</p>
          <p className="text-2xl font-bold text-gray-900">{timeInSeconds}s</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Points</p>
          <p className="text-2xl font-bold text-green-600">{points}</p>
        </div>
      </div>
    </div>
  );
}