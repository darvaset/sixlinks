// src/lib/pathfinding-enhanced.ts
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

export class EnhancedPathfinder {
  private visitedCache = new Map<string, Set<string>>()
  
  async findPath(startPlayerId: number, endPlayerId: number): Promise<PathResult> {
    const searchStartTime = Date.now()
    
    try {
      // Clear cache for new search
      this.visitedCache.clear()
      
      // BFS with bidirectional search for better performance
      const queue: { nodeId: number; nodeType: 'player' | 'manager'; path: PathStep[]; depth: number }[] = []
      const visited = new Set<string>()
      
      queue.push({ 
        nodeId: startPlayerId, 
        nodeType: 'player', 
        path: [],
        depth: 0
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

        // Limit depth to 6
        if (current.depth >= 6) continue

        // Get connections - now includes national teams
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
              }],
              depth: current.depth + 1
            })
          }
        }
      }

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

      // 1. CLUB TEAMMATES
      const teamConnections = await this.getTeammates(player, fromNode)
      connections.push(...teamConnections)

      // 2. NATIONAL TEAM TEAMMATES
      if (player.nationality) {
        const nationalTeammates = await this.getNationalTeammates(player, fromNode)
        connections.push(...nationalTeammates)
      }

      // 3. MANAGERS
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
            period: this.formatPeriod(playerManager.startDate, playerManager.endDate)
          }
        })
      }
    }

    if (nodeType === 'manager') {
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
            period: this.formatPeriod(playerManager.startDate, playerManager.endDate)
          }
        })
      }
    }

    return connections
  }

  private async getTeammates(player: any, fromNode: ConnectionNode) {
    const connections: any[] = []
    
    // Get all teams this player has played for
    for (const playerTeam of player.playerTeams) {
      const teammates = await prisma.player.findMany({
        where: {
          id: { not: player.id },
          playerTeams: {
            some: {
              teamId: playerTeam.teamId,
              OR: [
                {
                  // Overlapping time periods
                  startDate: { lte: playerTeam.endDate || new Date() },
                  endDate: { gte: playerTeam.startDate || new Date('1900-01-01') }
                },
                {
                  // Current teammates (no end date)
                  startDate: { lte: new Date() },
                  endDate: null
                }
              ]
            }
          }
        },
        take: 50 // Limit for performance
      })

      for (const teammate of teammates) {
        connections.push({
          from: fromNode,
          to: {
            id: teammate.id,
            name: teammate.name,
            type: 'player',
            nationality: teammate.nationality || undefined,
            position: teammate.position || undefined
          },
          connection: {
            type: 'teammate',
            description: `Teammates at ${playerTeam.team.name}`,
            team: playerTeam.team.name,
            period: this.formatPeriod(playerTeam.startDate, playerTeam.endDate)
          }
        })
      }
    }
    
    return connections
  }

  private async getNationalTeammates(player: any, fromNode: ConnectionNode) {
    const connections: any[] = []
    
    // Find other players with same nationality
    const nationalTeammates = await prisma.player.findMany({
      where: {
        id: { not: player.id },
        nationality: player.nationality
      },
      take: 100 // Reasonable limit
    })

    // For MVP, assume players of same nationality could have played together
    // In production, you'd have actual national team roster data
    for (const teammate of nationalTeammates) {
      connections.push({
        from: fromNode,
        to: {
          id: teammate.id,
          name: teammate.name,
          type: 'player',
          nationality: teammate.nationality || undefined,
          position: teammate.position || undefined
        },
        connection: {
          type: 'national_team',
          description: `${player.nationality} National Team`,
          team: player.nationality
        }
      })
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

export const enhancedPathfinder = new EnhancedPathfinder()
