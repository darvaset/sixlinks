'use client'

export interface Stats {
  players: number;
  teams: number;
  managers: number;
  totalConnections: number;
}

interface StatsBarProps {
  stats: Stats | null;
}

export function StatsBar({ stats }: StatsBarProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const statItems = [
    { label: 'Players', value: stats.players, icon: '⚽', color: 'from-blue-600 to-blue-700' },
    { label: 'Teams', value: stats.teams, icon: '🏆', color: 'from-green-600 to-green-700' },
    { label: 'Managers', value: stats.managers, icon: '📋', color: 'from-purple-600 to-purple-700' },
    { label: 'Connections', value: stats.totalConnections || '∞', icon: '🔗', color: 'from-orange-600 to-orange-700' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statItems.map((stat, _index) => (
        <div
          key={stat.label}
          className="relative overflow-hidden rounded-lg shadow-sm"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10`}></div>
          <div className="relative bg-white/90 backdrop-blur-sm p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-700">{stat.label}</p>
              <span className="text-lg">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}