#!/usr/bin/env tsx

import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const envTemplate = `# ShotCaller Environment Variables

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your_redis_password_if_needed

# Flow Blockchain Configuration
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
NEXT_PUBLIC_FLOW_NETWORK=testnet

# Find Labs API (for NFT data)
FINDLABS_API_URL=https://api.find.xyz
# FINDLABS_API_KEY=your_api_key_if_needed

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Job Processing
ENABLE_BACKGROUND_JOBS=false
JOB_CONCURRENCY=5

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING=true
METRICS_RETENTION_HOURS=24
`;

function setupEnvironment() {
  const envPath = join(process.cwd(), '.env.local');
  
  if (existsSync(envPath)) {
    console.log('✓ .env.local already exists');
    console.log('Please check and update your environment variables as needed.');
    return;
  }
  
  try {
    writeFileSync(envPath, envTemplate);
    console.log('✓ Created .env.local with template values');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. Update .env.local with your actual values');
    console.log('2. Set up Supabase project and get URL/key');
    console.log('3. Start Redis server (or use Docker)');
    console.log('4. Run: pnpm cache:warmup to test cache');
    console.log('');
    console.log('📚 For more info, see lib/cache/README.md');
  } catch (error) {
    console.error('❌ Failed to create .env.local:', error);
    process.exit(1);
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupEnvironment();
}

export { setupEnvironment };