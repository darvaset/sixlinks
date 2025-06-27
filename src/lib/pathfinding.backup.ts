import { prisma } from './prisma'

export interface ConnectionNode {
  id: number
  name: string
  type: 'player' | 'manager'
  nationality?: string
  position?: string
}

export interface Connection {
  type: 'teammate' | 'manager' | 'national_team'
  description: string
  team?: string
  period?: string
  startDate?: Date
  endDate?: Date
}

export interface PathStep {
  from: ConnectionNode
  to: ConnectionNode
  connection: Connection
}

export interface PathResult {
  found: boolean
  path: PathStep[]
  totalSteps: number
  searchTime: number
}

export class SixDegreesPathfinder {
  
  async findPath(startPlayerId: number, endPlayerId: number): Promise<PathResult> {
    const searchStartTime = Date.now()
    
    try {
      // BFS to find shortest path
      const queue: { nodeId: number; nodeType: 'player' | 'manager'; path: PathStep[] }[] = []
      const visited = new Set<string>()
      
      // Start with the starting player
      queue.push({ 
        nodeId: startPlayerId, 
        nodeType: 'player', 
        path: [] 
      })
      visited.add(`player-${startPlayerId}`)

      while (queue.length > 0) {
        const current = queue.shift()!
        
        // If we've reached the target
        if (current.nodeType === 'player' && current.nodeId === endPlayerId) {
          return {
            found: true,
            path: current.path,
            totalSteps: current.path.length,
            searchTime: Date.now() - searchStartTime
          }
        }

        // If we've already found a path longer than 6 steps, skip
        if (current.path.length >= 6) {
          continue
        }

        // Get connections from current node
        const connections = await this.getConnections(current.nodeId, current.nodeType)
        
        for (const connection of connections) {
          const nextKey = `${connection.to.type}-${connection.to.id}`
          
          if (!visited.has(nextKey)) {
            visited.add(nextKey)
            queue.push({
              nodeId: connection.to.id,
              nodeType: connection.to.type,
              path: [...current.path, {
                from: connection.from,
                to: connection.to,
                connection: connection.connection
              }]
            })
          }
        }
      }

      // No path found
      return {
        found: false,
        path: [],
        totalSteps: 0,
        searchTime: Date.now() - searchStartTime
      }

    } catch (error) {
      console.error('Pathfinding error:', error)
      throw error
    }
  }

  private async getConnections(nodeId: number, nodeType: 'player' | 'manager'): Promise<{
    from: ConnectionNode
    to: ConnectionNode
    connection: Connection
  }[]> {
    const connections: {
      from: ConnectionNode
      to: ConnectionNode
      connection: Connection
    }[] = []

    if (nodeType === 'player') {
      // Get player info
      const player = await prisma.player.findUnique({
        where: { id: nodeId },
        include: {
          playerTeams: {
            include: { team: true }
          },
          playerManagers: {
            include: { manager: true }
          }
        }
      })

      if (!player) return connections

      const fromNode: ConnectionNode = {
        id: player.id,
        name: player.name,
        type: 'player',
        nationality: player.nationality || undefined,
        position: player.position || undefined
      }

      // Find teammates (players who played at the same team)
      for (const playerTeam of player.playerTeams) {
        const teammates = await prisma.playerTeam.findMany({
          where: {
            teamId: playerTeam.teamId,
            playerId: { not: player.id },
            // Check for overlapping periods
            OR: [
              {
                AND: [
                  { startDate: { lte: playerTeam.endDate || new Date() } },
                  { endDate: { gte: playerTeam.startDate || new Date('1900-01-01') } }
                ]
              },
              {
                AND: [
                  { startDate: { lte: playerTeam.endDate || new Date() } },
                  { endDate: null }
                ]
              },
              {
                AND: [
                  { startDate: null },
                  { endDate: { gte: playerTeam.startDate || new Date('1900-01-01') } }
                ]
              }
            ]
          },
          include: {
            player: true
          }
        })

        for (const teammate of teammates) {
          connections.push({
            from: fromNode,
            to: {
              id: teammate.player.id,
              name: teammate.player.name,
              type: 'player',
              nationality: teammate.player.nationality || undefined,
              position: teammate.player.position || undefined
            },
            connection: {
              type: 'teammate',
              description: `Teammates at ${playerTeam.team.name}`,
              team: playerTeam.team.name,
              period: this.formatPeriod(playerTeam.startDate, playerTeam.endDate),
              startDate: playerTeam.startDate || undefined,
              endDate: playerTeam.endDate || undefined
            }
          })
        }
      }

      // Find managers who coached this player
      for (const playerManager of player.playerManagers) {
        connections.push({
          from: fromNode,
          to: {
            id: playerManager.manager.id,
            name: playerManager.manager.name,
            type: 'manager',
            nationality: playerManager.manager.nationality || undefined
          },
          connection: {
            type: 'manager',
            description: `Coached by ${playerManager.manager.name}`,
            period: this.formatPeriod(playerManager.startDate, playerManager.endDate),
            startDate: playerManager.startDate || undefined,
            endDate: playerManager.endDate || undefined
          }
        })
      }
    }

    if (nodeType === 'manager') {
      // Get manager info
      const manager = await prisma.manager.findUnique({
        where: { id: nodeId },
        include: {
          playerManagers: {
            include: { player: true }
          }
        }
      })

      if (!manager) return connections

      const fromNode: ConnectionNode = {
        id: manager.id,
        name: manager.name,
        type: 'manager',
        nationality: manager.nationality || undefined
      }

      // Find players coached by this manager
      for (const playerManager of manager.playerManagers) {
        connections.push({
          from: fromNode,
          to: {
            id: playerManager.player.id,
            name: playerManager.player.name,
            type: 'player',
            nationality: playerManager.player.nationality || undefined,
            position: playerManager.player.position || undefined
          },
          connection: {
            type: 'manager',
            description: `Coached ${playerManager.player.name}`,
            period: this.formatPeriod(playerManager.startDate, playerManager.endDate),
            startDate: playerManager.startDate || undefined,
            endDate: playerManager.endDate || undefined
          }
        })
      }
    }

    return connections
  }

  private formatPeriod(startDate: Date | null, endDate: Date | null): string {
    if (!startDate && !endDate) return 'Unknown period'
    
    const formatYear = (date: Date | null) => 
      date ? date.getFullYear().toString() : 'Present'
    
    const start = formatYear(startDate)
    const end = formatYear(endDate)
    
    return start === end ? start : `${start}-${end}`
  }
}

// Export singleton instance
export const pathfinder = new SixDegreesPathfinder()