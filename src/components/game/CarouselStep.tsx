'use client'



interface CarouselStepProps {
  stepNumber: number;
  totalSteps: number;
  player1: {
    id: number;
    name: string;
    type: 'player' | 'manager';
    nationality?: string;
    position?: string;
  };
  player2: {
    id: number;
    name: string;
    type: 'player' | 'manager';
    nationality?: string;
    position?: string;
  };
  connection: {
    type: 'teammate' | 'manager' | 'national_team';
    description: string;
    team?: string;
    period?: string;
  };
}

export function CarouselStep({ stepNumber, totalSteps, player1, player2, connection }: CarouselStepProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      {/* Step indicator */}
      <div className="text-sm text-gray-500 mb-4">
        Step {stepNumber} of {totalSteps}
      </div>

      {/* Connection display */}
      <div className="text-center space-y-6 max-w-md">
        {/* Main connection description */}
        <div
          className="text-xl font-semibold text-gray-900"
        >
          {connection.description}
        </div>

        {/* Visual connection representation */}
        <div className="flex items-center justify-center space-x-4">
          {/* Player 1 */}
          <div
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {player1.name.split(' ').map(n => n[0]).join('')}
            </div>
            <p className="mt-2 font-medium text-gray-900">{player1.name}</p>
            {player1.position && (
              <p className="text-sm text-gray-500">{player1.position}</p>
            )}
          </div>

          {/* Connection line */}
          <div
            className="w-16 h-0.5 bg-gray-300"
          />

          {/* Team/Connection Point (if applicable) */}
          {connection.team && (
            <>
              <div
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                  <span className="text-xs text-center">{connection.team.slice(0, 3).toUpperCase()}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-gray-700">{connection.team}</p>
              </div>

              <div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="w-16 h-0.5 bg-gray-300"
              />
            </>
          )}

          {/* Player 2 */}
          <div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {player2.name.split(' ').map(n => n[0]).join('')}
            </div>
            <p className="mt-2 font-medium text-gray-900">{player2.name}</p>
            {player2.position && (
              <p className="text-sm text-gray-500">{player2.position}</p>
            )}
          </div>
        </div>

        {/* Additional connection info - Always show period if available */}
        <div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-sm text-gray-600 mt-4"
        >
          {connection.period ? (
            connection.period === 'current' ? (
              <span className="flex items-center justify-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-700 font-medium">Currently connected</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                <span>📅</span>
                <span className="text-gray-700 font-medium">{connection.period}</span>
              </span>
            )
          ) : (
            // Fallback if no period information
            <span className="text-gray-500 italic">Date information not available</span>
          )}
        </div>
      </div>

      {/* Swipe hint for first step */}
      {stepNumber === 1 && totalSteps > 1 && (
        <div
          className="absolute bottom-4 text-sm text-gray-400"
        >
          Swipe or use arrows to navigate →
        </div>
      )}
    </div>
  );
}