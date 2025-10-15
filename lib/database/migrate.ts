import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

export interface MigrationResult {
  success: boolean
  message: string
  error?: string
}

export class DatabaseMigrator {
  private migrationsPath: string
  private seedsPath: string

  constructor() {
    this.migrationsPath = path.join(process.cwd(), 'lib/database/migrations')
    this.seedsPath = path.join(process.cwd(), 'lib/database/seeds')
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<MigrationResult> {
    try {
      console.log('Starting database migrations...')

      // Get migration files
      const migrationFiles = fs.readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort()

      console.log(`Found ${migrationFiles.length} migration files`)

      for (const file of migrationFiles) {
        console.log(`Running migration: ${file}`)
        
        const migrationSQL = fs.readFileSync(
          path.join(this.migrationsPath, file), 
          'utf8'
        )

        // Split SQL into individual statements and execute them
        const statements = migrationSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0)

        for (const statement of statements) {
          if (statement.trim()) {
            const { error } = await supabase.rpc('exec_sql', { sql: statement })
            if (error) {
              console.error(`Migration ${file} failed on statement:`, statement.substring(0, 100) + '...')
              console.error('Error:', error)
              return {
                success: false,
                message: `Migration ${file} failed`,
                error: error.message
              }
            }
          }
        }

        console.log(`✓ Migration ${file} completed`)
      }

      return {
        success: true,
        message: `Successfully ran ${migrationFiles.length} migrations`
      }

    } catch (error) {
      console.error('Migration error:', error)
      return {
        success: false,
        message: 'Migration failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Run database seeds
   */
  async runSeeds(): Promise<MigrationResult> {
    try {
      console.log('Starting database seeding...')

      // Get seed files
      const seedFiles = fs.readdirSync(this.seedsPath)
        .filter(file => file.endsWith('.sql'))
        .sort()

      console.log(`Found ${seedFiles.length} seed files`)

      for (const file of seedFiles) {
        console.log(`Running seed: ${file}`)
        
        const seedSQL = fs.readFileSync(
          path.join(this.seedsPath, file), 
          'utf8'
        )

        // Execute seed
        const { error } = await supabase.rpc('exec_sql', { sql: seedSQL })
        
        if (error) {
          console.error(`Seed ${file} failed:`, error)
          return {
            success: false,
            message: `Seed ${file} failed`,
            error: error.message
          }
        }

        console.log(`✓ Seed ${file} completed`)
      }

      return {
        success: true,
        message: `Successfully ran ${seedFiles.length} seeds`
      }

    } catch (error) {
      console.error('Seeding error:', error)
      return {
        success: false,
        message: 'Seeding failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check database connection and basic setup
   */
  async checkConnection(): Promise<MigrationResult> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      if (error) {
        return {
          success: false,
          message: 'Database connection failed',
          error: error.message
        }
      }

      return {
        success: true,
        message: 'Database connection successful'
      }

    } catch (error) {
      return {
        success: false,
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Reset database (drop all tables and recreate)
   * WARNING: This will delete all data!
   */
  async resetDatabase(): Promise<MigrationResult> {
    try {
      console.log('WARNING: Resetting database - this will delete all data!')

      // Drop all tables in reverse dependency order
      const dropTablesSQL = `
        DROP TABLE IF EXISTS player_stats CASCADE;
        DROP TABLE IF EXISTS premium_access CASCADE;
        DROP TABLE IF EXISTS boosters CASCADE;
        DROP TABLE IF EXISTS marketplace_listings CASCADE;
        DROP TABLE IF EXISTS treasury_transactions CASCADE;
        DROP TABLE IF EXISTS lineups CASCADE;
        DROP TABLE IF EXISTS contests CASCADE;
        DROP TABLE IF EXISTS nfts CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        
        -- Drop views
        DROP VIEW IF EXISTS active_contests CASCADE;
        DROP VIEW IF EXISTS active_marketplace_listings CASCADE;
        DROP VIEW IF EXISTS user_stats CASCADE;
        
        -- Drop functions
        DROP FUNCTION IF EXISTS update_contest_status() CASCADE;
        DROP FUNCTION IF EXISTS expire_boosters() CASCADE;
        DROP FUNCTION IF EXISTS expire_premium_access() CASCADE;
      `

      const { error } = await supabase.rpc('exec_sql', { sql: dropTablesSQL })
      
      if (error) {
        return {
          success: false,
          message: 'Failed to reset database',
          error: error.message
        }
      }

      return {
        success: true,
        message: 'Database reset successfully'
      }

    } catch (error) {
      return {
        success: false,
        message: 'Database reset failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Full database setup (migrations + seeds)
   */
  async setupDatabase(reset: boolean = false): Promise<MigrationResult> {
    try {
      console.log('Starting full database setup...')

      // Check connection first
      const connectionResult = await this.checkConnection()
      if (!connectionResult.success) {
        return connectionResult
      }

      // Reset if requested
      if (reset) {
        const resetResult = await this.resetDatabase()
        if (!resetResult.success) {
          return resetResult
        }
      }

      // Run migrations
      const migrationResult = await this.runMigrations()
      if (!migrationResult.success) {
        return migrationResult
      }

      // Run seeds
      const seedResult = await this.runSeeds()
      if (!seedResult.success) {
        return seedResult
      }

      return {
        success: true,
        message: 'Database setup completed successfully'
      }

    } catch (error) {
      return {
        success: false,
        message: 'Database setup failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const databaseMigrator = new DatabaseMigrator()

// CLI usage
if (require.main === module) {
  const command = process.argv[2]
  
  async function runCommand() {
    const migrator = new DatabaseMigrator()
    let result: MigrationResult

    switch (command) {
      case 'migrate':
        result = await migrator.runMigrations()
        break
      case 'seed':
        result = await migrator.runSeeds()
        break
      case 'reset':
        result = await migrator.resetDatabase()
        break
      case 'setup':
        const reset = process.argv[3] === '--reset'
        result = await migrator.setupDatabase(reset)
        break
      case 'check':
        result = await migrator.checkConnection()
        break
      default:
        console.log('Usage: node migrate.js [migrate|seed|reset|setup|check]')
        console.log('  migrate - Run pending migrations')
        console.log('  seed    - Run database seeds')
        console.log('  reset   - Reset database (WARNING: deletes all data)')
        console.log('  setup   - Full setup (migrations + seeds)')
        console.log('  setup --reset - Reset and full setup')
        console.log('  check   - Check database connection')
        process.exit(1)
    }

    if (result.success) {
      console.log('✓', result.message)
      process.exit(0)
    } else {
      console.error('✗', result.message)
      if (result.error) {
        console.error('Error:', result.error)
      }
      process.exit(1)
    }
  }

  runCommand().catch(console.error)
}