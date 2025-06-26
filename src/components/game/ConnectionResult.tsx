'use client'

interface PathStep {
  from: {
    id: number
    name: string
    type: 'player' | 'manager'
    nationality?: string
    position?: string
  }
  to: {
    id: number
    name: string
    type: 'player' | 'manager'
    nationality?: string
    position?: string
  }
  connection: {
    type: 'teammate' | 'manager' | 'national_team'
    description: string
    team?: string
    period?: string
  }
}

interface Player {
  id: number
  name: string
  fullName?: string
  nationality?: string
  position?: string
}

interface GameResult {
  found: boolean
  path: PathStep[]
  totalSteps: number
  searchTime: number
  score: number
  startPlayer: Player
  endPlayer: Player
}

interface ConnectionResultProps {
  result: GameResult
  onPlayAgain: () => void
}

export function ConnectionResult({ result, onPlayAgain }: ConnectionResultProps) {
  const handleShare = () => {
    const shareText = result.found
      ? `🎯 I connected ${result.startPlayer.name} to ${result.endPlayer.name} in ${result.totalSteps} step${result.totalSteps !== 1 ? 's' : ''}! Score: ${result.score} points on SixLinks ⚽`
      : `🤔 Couldn't find a connection between ${result.startPlayer.name} and ${result.endPlayer.name} on SixLinks ⚽`
    
    if (navigator.share) {
      navigator.share({
        title: 'SixLinks Challenge',
        text: shareText,
        url: window.location.origin
      })
    } else {
      navigator.clipboard.writeText(shareText + ` - ${window.location.origin}`)
      alert('Result copied to clipboard!')
    }
  }

  if (!result.found) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* No Connection Found */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🤔</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Connection Found</h3>
          <div className="text-gray-800">
            We couldn't find a connection between <strong>{result.startPlayer.name}</strong> and{' '}
            <strong>{result.endPlayer.name}</strong> in our database.
          </div>
        </div>

        {/* Search Info */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-center">
          <div className="text-sm text-gray-600 mb-2">Search completed in</div>
          <div className="text-2xl font-bold text-gray-900">{result.searchTime}ms</div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleShare}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Share Challenge
          </button>
          <button
            onClick={onPlayAgain}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Try Different Players
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎉</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Connection Found!</h3>
        <div className="text-gray-600">
          Connected <strong>{result.startPlayer.name}</strong> to <strong>{result.endPlayer.name}</strong> in{' '}
          <strong>{result.totalSteps} step{result.totalSteps !== 1 ? 's' : ''}</strong>
        </div>
      </div>

      {/* Score Display */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-8 text-center">
        <div className="text-3xl font-bold text-green-600 mb-2">{result.score} Points</div>
        <div className="text-sm text-gray-700">
          {result.totalSteps} step{result.totalSteps !== 1 ? 's' : ''} • {result.searchTime}ms search time
        </div>
      </div>

      {/* Connection Path */}
      <div className="space-y-3 mb-8">
        {/* Start Player */}
        <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full mr-4 flex items-center justify-center">
              <span className="text-white font-bold">
                {result.startPlayer.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{result.startPlayer.name}</div>
              <div className="text-sm text-gray-700">
                {result.startPlayer.nationality}
                {result.startPlayer.position && <span> • {result.startPlayer.position}</span>}
              </div>
            </div>
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
              START
            </div>
          </div>
        </div>

        {/* Path Steps - Show each intermediate player */}
        {result.path.map((step, index) => (
          <div key={index}>
            {/* Connection Arrow & Description */}
            <div className="flex justify-center py-2">
              <div className="flex flex-col items-center">
                <div className="text-gray-400 mb-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-2 rounded-full text-xs font-medium text-center max-w-xs">
                  {step.connection.description}
                  {step.connection.period && (
                    <div className="text-green-100 mt-1 text-xs">({step.connection.period})</div>
                  )}
                </div>
              </div>
            </div>

            {/* Intermediate/End Player */}
            <div className={`rounded-lg p-4 border-2 ${
              index === result.path.length - 1 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-full mr-4 flex items-center justify-center ${
                  index === result.path.length - 1
                    ? 'bg-green-500'
                    : 'bg-gray-400'
                }`}>
                  <span className="text-white font-bold">
                    {step.to.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{step.to.name}</div>
                  <div className="text-sm text-gray-600">
                    {step.to.nationality}
                    {step.to.type === 'player' && step.to.position && (
                      <span> • {step.to.position}</span>
                    )}
                    {step.to.type === 'manager' && <span> • Manager</span>}
                  </div>
                </div>
                {index === result.path.length - 1 && (
                  <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                    END
                  </div>
                )}
                {index < result.path.length - 1 && (
                  <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                    STEP {index + 1}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleShare}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Share Result
        </button>
        <button
          onClick={onPlayAgain}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  )
}