#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Production Database Setup Script
 * 
 * This script sets up the production Supabase database with all required tables,
 * indexes, and security policies.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runSQLFile(filePath: string): Promise<void> {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`❌ Error executing ${filePath}:`, error);
      throw error;
    }
    
    console.log(`✅ Successfully executed ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to read or execute ${filePath}:`, error);
    throw error;
  }
}

async function setupProductionDatabase(): Promise<void> {
  console.log('🚀 Setting up production database...');
  
  try {
    // Run migrations
    const migrationsDir = path.join(process.cwd(), 'lib/database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log('📦 Running migrations...');
    for (const file of migrationFiles) {
      await runSQLFile(path.join(migrationsDir, file));
    }
    
    // Run production seeds (if any)
    const seedsDir = path.join(process.cwd(), 'lib/database/seeds');
    const productionSeedFile = path.join(seedsDir, '003_production_data.sql');
    
    if (fs.existsSync(productionSeedFile)) {
      console.log('🌱 Running production seeds...');
      await runSQLFile(productionSeedFile);
    }
    
    // Verify tables exist
    console.log('🔍 Verifying database setup...');
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      throw error;
    }
    
    const expectedTables = [
      'users',
      'nfts',
      'lineups',
      'contests',
      'treasury_transactions',
      'marketplace_listings',
      'boosters',
      'premium_access',
      'player_stats'
    ];
    
    const existingTables = tables?.map(t => t.table_name) || [];
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.error('❌ Missing tables:', missingTables);
      throw new Error('Database setup incomplete');
    }
    
    console.log('✅ All required tables exist');
    console.log('🎉 Production database setup complete!');
    
  } catch (error) {
    console.error('❌ Production database setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupProductionDatabase();