'use client'

import { useState, useEffect, useRef } from 'react'
import { Person } from '@/types/game' // Updated import

interface PersonSearchProps {
  label: string
  placeholder: string
  selectedPerson: Person | null // Updated prop type
  onPersonSelect: (person: Person | null) => void // Updated prop type
}

export function PersonSearch({ label, placeholder, selectedPerson, onPersonSelect }: PersonSearchProps) { // Updated component name and prop names
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Person[]>([]) // Updated type
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const searchPersons = async () => { // Renamed function
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
          setResults(data.persons || []) // Assuming API now returns 'persons'
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
    const debounceTimer = setTimeout(searchPersons, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePersonSelect = (person: Person) => { // Updated function name and type
    onPersonSelect(person)
    setQuery('')
    setIsOpen(false)
  }

  const handleClearSelection = () => {
    onPersonSelect(null)
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={searchRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {selectedPerson ? ( // Updated prop name
        <div className="flex items-center bg-green-50 rounded-lg p-4 border-2 border-green-200">
          <div className="w-12 h-12 bg-green-100 rounded-full mr-4 flex items-center justify-center">
            <span className="text-green-600 font-bold text-lg">{selectedPerson.name.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{selectedPerson.name}</div>
            <div className="text-sm text-gray-700">
              {selectedPerson.nationality}
              {selectedPerson.primaryPosition && (<span> • {selectedPerson.primaryPosition}</span>)} {/* Updated to primaryPosition */}
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
              {results.map((person) => (
                <div key={person.id} onClick={() => handlePersonSelect(person)} className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full mr-3 flex items-center justify-center"><span className="text-gray-600 font-medium text-sm">{person.name.charAt(0)}</span></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{person.name}</div>
                      <div className="text-sm text-gray-700">{person.nationality}{person.primaryPosition && <span> • {person.primaryPosition}</span>}</div> {/* Updated to primaryPosition */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {isOpen && results.length === 0 && query.length >= 2 && !isLoading && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg z-10 p-4 text-center text-gray-800">No persons found for &quot;{query}&quot;</div> {/* Updated text */}
          )}
        </div>
      )}
    </div>
  )
}