'use client'

import { useState, useEffect, useRef } from 'react'
// --- FIX: Import the centralized Player type ---
import { Player } from '@/types/game'

interface PlayerSearchProps {
  label: string
  placeholder: string
  selectedPlayer: Player | null
  // --- FIX: Update the prop type to safely accept Player or null ---
  onPlayerSelect: (player: Player | null) => void
}

export function PlayerSearch({ label, placeholder, selectedPlayer, onPlayerSelect }: PlayerSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Player[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Search for players (useEffect logic is unchanged)
  useEffect(() => {
    const searchPlayers = async () => {
      if (query.length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }
      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        if (response.ok) {
          setResults(data.players || [])
          setIsOpen(true)
        } else {
          setResults([])
          setIsOpen(false)
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
    }
    const debounceTimer = setTimeout(searchPlayers, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  // Close dropdown when clicking outside (useEffect logic is unchanged)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePlayerSelect = (player: Player) => {
    onPlayerSelect(player)
    setQuery('')
    setIsOpen(false)
  }

  const handleClearSelection = () => {
    // --- FIX: Removed the risky 'as any'. This is now type-safe. ---
    onPlayerSelect(null)
    setQuery('')
    setIsOpen(false)
  }

  return (
    // Your JSX for this component remains unchanged
    <div className="relative" ref={searchRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {selectedPlayer ? (
        <div className="flex items-center bg-green-50 rounded-lg p-4 border-2 border-green-200">
          <div className="w-12 h-12 bg-green-100 rounded-full mr-4 flex items-center justify-center">
            <span className="text-green-600 font-bold text-lg">{selectedPlayer.name.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{selectedPlayer.name}</div>
            <div className="text-sm text-gray-700">
              {selectedPlayer.nationality}
              {selectedPlayer.currentTeam && (<span> • {selectedPlayer.currentTeam.name}</span>)}
            </div>
          </div>
          <button onClick={handleClearSelection} className="ml-4 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ) : (
        <div className="relative">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-gray-900 placeholder-gray-500" />
          {isLoading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2"><svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
          )}
          {isOpen && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg z-10 max-h-64 overflow-y-auto">
              {results.map((player) => (
                <div key={player.id} onClick={() => handlePlayerSelect(player)} className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full mr-3 flex items-center justify-center"><span className="text-gray-600 font-medium text-sm">{player.name.charAt(0)}</span></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{player.name}</div>
                      <div className="text-sm text-gray-700">{player.nationality}{player.position && <span> • {player.position}</span>}{player.currentTeam && (<span> • {player.currentTeam.name}</span>)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {isOpen && results.length === 0 && query.length >= 2 && !isLoading && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg z-10 p-4 text-center text-gray-800">No players found for "{query}"</div>
          )}
        </div>
      )}
    </div>
  )
}