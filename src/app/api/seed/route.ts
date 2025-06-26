import { NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seed-data'

export async function POST() {
  try {
    await seedDatabase()
    return NextResponse.json({ 
      message: 'Database seeded successfully!',
      success: true 
    })
  } catch (error) {
    console.error('Seeding error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// For development - also allow GET requests
export async function GET() {
  return NextResponse.json({
    message: 'Send a POST request to seed the database',
    instructions: 'Use: curl -X POST http://localhost:3000/api/seed'
  })
}
