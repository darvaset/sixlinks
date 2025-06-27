import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({
        players: [],
        message: 'Query must be at least 2 characters'
      })
    }

    // Search players by name (case insensitive, partial match)
    const players = await prisma.player.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            fullName: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      include: {
        playerTeams: {
          include: {
            team: true
          },
          orderBy: {
            startDate: 'desc'
          },
          take: 1 // Get most recent team
        }
      },
      take: 10 // Limit results for performance
    })

    // Format the response
    const formattedPlayers = players.map(player => ({
      id: player.id,
      name: player.name,
      fullName: player.fullName,
      nationality: player.nationality,
      position: player.position,
      currentTeam: player.playerTeams[0]?.team ? {
        name: player.playerTeams[0].team.name,
        country: player.playerTeams[0].team.country,
        league: player.playerTeams[0].team.league
      } : null
    }))

    return NextResponse.json({
      players: formattedPlayers,
      count: formattedPlayers.length
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { 
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
