'use client'

import { useState, useEffect } from 'react';


interface League {
  name: string;
  playerCount: number;
}

interface Stats {
  players: number;
  teams: number;
  leagues: League[];
  nationalTeams: League[];
}

export function LeaguesCoverage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);

  if (!stats) {
    return (
      <div className="text-center py-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-48 mx-auto mb-2"></div>
          <div className="h-3 bg-gray-600 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Get top leagues for summary
  const topLeagues = stats.leagues.slice(0, 5);
  const totalLeagues = stats.leagues.length;

  return (
    <div className="mb-8">
      {/* Summary Bar */}
      <div
        className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4"
      >
        <div className="text-center mb-2">
          <h3 className="text-white font-semibold text-lg mb-1">
            {stats.players.toLocaleString()} Players Available
          </h3>
          <p className="text-gray-300 text-sm">
            From {totalLeagues} leagues worldwide
          </p>
        </div>
        
        {/* Quick League Summary */}
        <div className="flex flex-wrap justify-center gap-2 mb-3">
          {topLeagues.map((league, _index) => (
            <span
              key={league.name}
              className="inline-flex items-center gap-1 bg-white/20 text-white px-3 py-1 rounded-full text-sm"
            >
              <span className="font-medium">{league.name}</span>
              <span className="text-gray-300">({league.playerCount})</span>
            </span>
          ))}
          {totalLeagues > 5 && (
            <span className="inline-flex items-center text-gray-300 text-sm">
              +{totalLeagues - 5} more
            </span>
          )}
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-center text-white/80 hover:text-white text-sm font-medium transition-colors"
        >
          {showDetails ? 'Hide Details ↑' : 'View All Leagues ↓'}
        </button>
      </div>

      {/* Detailed View */}
      {showDetails && (
        <div
          className="bg-white rounded-lg shadow-lg p-6 space-y-6"
        >
          {/* Club Leagues */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Club Leagues</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {stats.leagues.map((league) => (
                <div
                  key={league.name}
                  className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                >
                  <p className="font-medium text-gray-900">{league.name}</p>
                  <p className="text-sm text-gray-600">{league.playerCount} players</p>
                </div>
              ))}
            </div>
          </div>

          {/* National Teams */}
          {stats.nationalTeams && stats.nationalTeams.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">National Teams</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {stats.nationalTeams.map((team) => (
                  <div
                    key={team.name}
                    className="bg-blue-50 rounded-lg p-3 hover:bg-blue-100 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{team.name}</p>
                    <p className="text-sm text-gray-600">{team.playerCount} players</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.players.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Players</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.teams.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Teams</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalLeagues}</p>
                <p className="text-sm text-gray-600">Leagues</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}