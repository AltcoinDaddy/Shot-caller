import { NextRequest, NextResponse } from 'next/server'
import { databaseMigrator } from '@/lib/database/migrate'
import { z } from 'zod'

const DatabaseActionSchema = z.object({
  action: z.enum(['migrate', 'seed', 'setup', 'reset', 'check']),
  reset: z.boolean().optional().default(false)
})

export async function POST(request: NextRequest) {
  try {
    // In production, you'd want to add authentication/authorization here
    // For now, we'll allow it for development purposes
    
    const body = await request.json()
    const { action, reset } = DatabaseActionSchema.parse(body)

    let result

    switch (action) {
      case 'migrate':
        result = await databaseMigrator.runMigrations()
        break
      case 'seed':
        result = await databaseMigrator.runSeeds()
        break
      case 'setup':
        result = await databaseMigrator.setupDatabase(reset)
        break
      case 'reset':
        result = await databaseMigrator.resetDatabase()
        break
      case 'check':
        result = await databaseMigrator.checkConnection()
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      error: result.error,
      timestamp: new Date().toISOString()
    }, {
      status: result.success ? 200 : 500
    })

  } catch (error) {
    console.error('Database admin error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors.map(e => e.message)
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check database status
    const connectionResult = await databaseMigrator.checkConnection()
    
    return NextResponse.json({
      success: true,
      database: {
        connected: connectionResult.success,
        message: connectionResult.message,
        error: connectionResult.error
      },
      availableActions: [
        'migrate - Run pending migrations',
        'seed - Run database seeds', 
        'setup - Full setup (migrations + seeds)',
        'reset - Reset database (WARNING: deletes all data)',
        'check - Check database connection'
      ],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database status error:', error)
    
    return NextResponse.json(
      { success: false, error: 'Failed to check database status' },
      { status: 500 }
    )
  }
}