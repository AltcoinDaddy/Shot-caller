#!/usr/bin/env tsx

/**
 * Production Environment Validation Script
 * 
 * This script validates that all required environment variables
 * are properly configured for production deployment.
 */

interface EnvVariable {
  name: string;
  required: boolean;
  description: string;
  example?: string;
}

const requiredEnvVars: EnvVariable[] = [
  {
    name: 'NODE_ENV',
    required: true,
    description: 'Application environment',
    example: 'production'
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    description: 'Public application URL',
    example: 'https://shotcaller-fantasy-game.vercel.app'
  },
  {
    name: 'SUPABASE_URL',
    required: true,
    description: 'Supabase project URL'
  },
  {
    name: 'SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key (for admin operations)'
  },
  {
    name: 'NBA_API_KEY',
    required: true,
    description: 'NBA statistics API key'
  },
  {
    name: 'NBA_API_BASE_URL',
    required: true,
    description: 'NBA API base URL',
    example: 'https://api.balldontlie.io/v1'
  },
  {
    name: 'NFL_API_KEY',
    required: true,
    description: 'NFL statistics API key'
  },
  {
    name: 'NFL_API_BASE_URL',
    required: true,
    description: 'NFL API base URL',
    example: 'https://api.sportsdata.io/v3/nfl'
  },
  {
    name: 'FLOW_ACCESS_API_URL',
    required: true,
    description: 'Flow blockchain access API URL',
    example: 'https://rest-mainnet.onflow.org'
  },
  {
    name: 'FLOW_PRIVATE_KEY',
    required: true,
    description: 'Flow blockchain private key'
  },
  {
    name: 'FLOW_ACCOUNT_ADDRESS',
    required: true,
    description: 'Flow blockchain account address'
  },
  {
    name: 'REDIS_URL',
    required: false,
    description: 'Redis connection URL (optional but recommended)'
  },
  {
    name: 'SENTRY_DSN',
    required: false,
    description: 'Sentry error tracking DSN (optional)'
  },
  {
    name: 'VERCEL_ANALYTICS_ID',
    required: false,
    description: 'Vercel Analytics ID (optional)'
  }
];

function validateEnvironment(): void {
  console.log('🔍 Validating production environment variables...\n');
  
  let hasErrors = false;
  let hasWarnings = false;
  
  const results: Array<{
    name: string;
    status: 'ok' | 'missing' | 'empty';
    required: boolean;
  }> = [];
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.name];
    let status: 'ok' | 'missing' | 'empty' = 'ok';
    
    if (value === undefined) {
      status = 'missing';
      if (envVar.required) {
        hasErrors = true;
      } else {
        hasWarnings = true;
      }
    } else if (value.trim() === '') {
      status = 'empty';
      if (envVar.required) {
        hasErrors = true;
      } else {
        hasWarnings = true;
      }
    }
    
    results.push({
      name: envVar.name,
      status,
      required: envVar.required
    });
  }
  
  // Print results
  console.log('Environment Variable Status:');
  console.log('============================\n');
  
  for (const result of results) {
    const envVar = requiredEnvVars.find(v => v.name === result.name)!;
    const icon = result.status === 'ok' ? '✅' : result.required ? '❌' : '⚠️';
    const statusText = result.status === 'ok' ? 'OK' : 
                      result.status === 'missing' ? 'MISSING' : 'EMPTY';
    
    console.log(`${icon} ${result.name}: ${statusText}`);
    console.log(`   ${envVar.description}`);
    if (envVar.example && result.status !== 'ok') {
      console.log(`   Example: ${envVar.example}`);
    }
    console.log();
  }
  
  // Summary
  const totalVars = requiredEnvVars.length;
  const okVars = results.filter(r => r.status === 'ok').length;
  const requiredVars = requiredEnvVars.filter(v => v.required).length;
  const requiredOkVars = results.filter(r => r.status === 'ok' && r.required).length;
  
  console.log('Summary:');
  console.log('========');
  console.log(`Total variables: ${totalVars}`);
  console.log(`Configured: ${okVars}/${totalVars}`);
  console.log(`Required configured: ${requiredOkVars}/${requiredVars}`);
  console.log();
  
  if (hasErrors) {
    console.log('❌ Environment validation failed!');
    console.log('   Please configure all required environment variables before deploying to production.');
    console.log();
    console.log('📖 See DEPLOYMENT.md for detailed setup instructions.');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Environment validation passed with warnings.');
    console.log('   Some optional environment variables are not configured.');
    console.log('   The application will work but some features may be limited.');
    console.log();
  } else {
    console.log('✅ Environment validation passed!');
    console.log('   All environment variables are properly configured.');
    console.log();
  }
  
  // Additional validations
  console.log('🔍 Running additional validations...\n');
  
  // Validate URLs
  const urlVars = ['NEXT_PUBLIC_APP_URL', 'SUPABASE_URL', 'NBA_API_BASE_URL', 'NFL_API_BASE_URL', 'FLOW_ACCESS_API_URL'];
  for (const varName of urlVars) {
    const value = process.env[varName];
    if (value && !isValidUrl(value)) {
      console.log(`⚠️  ${varName} does not appear to be a valid URL: ${value}`);
      hasWarnings = true;
    }
  }
  
  // Validate Flow address format
  const flowAddress = process.env.FLOW_ACCOUNT_ADDRESS;
  if (flowAddress && !isValidFlowAddress(flowAddress)) {
    console.log(`⚠️  FLOW_ACCOUNT_ADDRESS does not appear to be a valid Flow address: ${flowAddress}`);
    hasWarnings = true;
  }
  
  // Check for development values in production
  if (process.env.NODE_ENV === 'production') {
    const devIndicators = ['localhost', '127.0.0.1', 'test', 'dev', 'example'];
    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar.name];
      if (value && devIndicators.some(indicator => value.toLowerCase().includes(indicator))) {
        console.log(`⚠️  ${envVar.name} contains development-like value in production: ${value}`);
        hasWarnings = true;
      }
    }
  }
  
  if (!hasWarnings) {
    console.log('✅ Additional validations passed!');
  }
  
  console.log('\n🚀 Environment is ready for production deployment!');
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function isValidFlowAddress(address: string): boolean {
  // Flow addresses are typically 16 characters long and start with 0x
  return /^0x[a-fA-F0-9]{16}$/.test(address);
}

// Run validation
validateEnvironment();