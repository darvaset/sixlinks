'use client'

export function GameHeader() {
  return (
    <div className="text-center mb-6">
      <h1 
        className="text-4xl md:text-5xl font-bold text-white mb-2"
      >
        Six Degrees of World Football
      </h1>
      
      <p 
        className="text-gray-300 text-lg"
      >
        Discover how any two football players are connected through their careers, teammates, and managers
      </p>
    </div>
  );
}