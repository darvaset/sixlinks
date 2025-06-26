'use client'

export function GameHeader() {
  return (
    <div className="text-center mb-8">
      {/* Logo and Title */}
      <div className="flex items-center justify-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-xl">⚽</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          SixLinks
        </h1>
      </div>

      {/* Subtitle */}
      <p className="text-lg text-gray-800 mb-2">
        Six Degrees of World Football
      </p>
      
      {/* Description */}
      <p className="text-sm text-gray-700 max-w-md mx-auto">
        Discover how any two football players are connected through their careers, 
        teammates, and managers
      </p>

      {/* Beta Badge */}
      <div className="inline-flex items-center mt-4 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        MVP Version - 12 Players Available
      </div>
    </div>
  )
}