import { NextRequest, NextResponse } from 'next/server'
import { pathfinder } from '@/lib/pathfinding'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startId = searchParams.get('start')
    const endId = searchParams.get('end')

    if (!startId || !endId) {
      return NextResponse.json(
        { error: 'Both start and end player IDs are required' },
        { status: 400 }
      )
    }

    const startPlayerId = parseInt(startId)
    const endPlayerId = parseInt(endId)

    if (isNaN(startPlayerId) || isNaN(endPlayerId)) {
      return NextResponse.json(
        { error: 'Player IDs must be valid numbers' },
        { status: 400 }
      )
    }

    if (startPlayerId === endPlayerId) {
      return NextResponse.json(
        { error: 'Start and end players cannot be the same' },
        { status: 400 }
      )
    }

    // Verify both players exist
    const [startPlayer, endPlayer] = await Promise.all([
      prisma.player.findUnique({ where: { id: startPlayerId } }),
      prisma.player.findUnique({ where: { id: endPlayerId } })
    ])

    if (!startPlayer) {
      return NextResponse.json(
        { error: `Start player with ID ${startPlayerId} not found` },
        { status: 404 }
      )
    }

    if (!endPlayer) {
      return NextResponse.json(
        { error: `End player with ID ${endPlayerId} not found` },
        { status: 404 }
      )
    }

    // Find the path
    const result = await pathfinder.findPath(startPlayerId, endPlayerId)

    // Calculate score based on path length and search time
    let score = 0
    if (result.found) {
      const baseScore = 1000
      const stepPenalty = result.totalSteps * 100
      const timePenalty = Math.floor(result.searchTime / 100) * 10
      score = Math.max(100, baseScore - stepPenalty - timePenalty)
    }

    return NextResponse.json({
      ...result,
      score,
      startPlayer: {
        id: startPlayer.id,
        name: startPlayer.name,
        fullName: startPlayer.fullName,
        nationality: startPlayer.nationality,
        position: startPlayer.position
      },
      endPlayer: {
        id: endPlayer.id,
        name: endPlayer.name,
        fullName: endPlayer.fullName,
        nationality: endPlayer.nationality,
        position: endPlayer.position
      }
    })

  } catch (error) {
    console.error('Find path error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to find path',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
