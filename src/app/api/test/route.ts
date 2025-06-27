import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    const playerCount = await prisma.player.count()
    const teamCount = await prisma.team.count()
    
    return NextResponse.json({
      message: 'Database connection successful!',
      stats: {
        players: playerCount,
        teams: teamCount
      }
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }
}
