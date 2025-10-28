/**
 * Comprehensive Sync Integration Test Runner
 * 
 * Orchestrates the execution of all sync-related tests including:
 * - Unit tests
 * - Integration tests  
 * - Performance tests
 * - End-to-end tests
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface TestSuite {
  name: string;
  command: string;
  timeout: number;
  critical: boolean;
}

interface TestResult {
  suite: string;
  success: boolean;
  duration: number;
  output: string;
  error?: string;
}

class SyncIntegrationTestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'Sync Manager Unit Tests',
      command: 'npx vitest run test/services/sync-manager-unit.test.ts',
      timeout: 30000,
      critical: true
    },
    {
      name: 'Sync Event Bus Tests',
      command: 'npx vitest run test/services/sync-event-bus.test.ts',
      timeout: 15000,
      critical: true
    },
    {
      name: 'Network Resilience Tests',
      command: 'npx vitest run test/services/network-resilience-manager.test.ts',
      timeout: 30000,
      critical: true
    },
    {
      name: 'Auth Context Integration Tests',
      command: 'npx vitest run test/contexts/enhanced-auth-context.test.tsx',
      timeout: 30000,
      critical: true
    },
    {
      name: 'Complete Sync Integration Tests',
      command: 'npx vitest run test/integration/complete-sync-integration.test.ts',
      timeout: 60000,
      critical: true
    },
    {
      name: 'Wallet Profile Sync Integration Tests',
      command: 'npx vitest run test/integration/wallet-profile-sync-integration.test.ts',
      timeout: 45000,
      critical: true
    },
    {
      name: 'Sync Performance Tests',
      command: 'npx vitest run test/performance/sync-performance.test.ts',
      timeout: 120000,
      critical: false
    },
    {
      name: 'Sync UI Components Tests',
      command: 'npx vitest run test/components/sync-ui-components.test.tsx',
      timeout: 30000,
      critical: true
    },
    {
      name: 'End-to-End Wallet Connection Tests',
      command: 'npx playwright test test/e2e/wallet-connection.spec.ts',
      timeout: 60000,
      critical: true
    },
    {
      name: 'End-to-End Sync Integration Tests',
      command: 'npx playwright test test/e2e/wallet-profile-sync-e2e.spec.ts',
      timeout: 180000,
      critical: true
    }
  ];

  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Sync Integration Tests\n');
    console.log(`Running ${this.testSuites.length} test suites...\n`);

    const startTime = Date.now();

    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    const totalDuration = Date.now() - startTime;
    this.printSummary(totalDuration);
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`📋 Running: ${suite.name}`);
    console.log(`   Command: ${suite.command}`);
    console.log(`   Timeout: ${suite.timeout}ms`);
    console.log(`   Critical: ${suite.critical ? 'Yes' : 'No'}`);

    const startTime = Date.now();
    let result: TestResult;

    try {
      const output = execSync(suite.command, {
        timeout: suite.timeout,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      result = {
        suite: suite.name,
        success: true,
        duration: Date.now() - startTime,
        output: output.toString()
      };

      console.log(`   ✅ PASSED (${result.duration}ms)\n`);
    } catch (error: any) {
      result = {
        suite: suite.name,
        success: false,
        duration: Date.now() - startTime,
        output: error.stdout?.toString() || '',
        error: error.stderr?.toString() || error.message
      };

      console.log(`   ❌ FAILED (${result.duration}ms)`);
      if (result.error) {
        console.log(`   Error: ${result.error.split('\n')[0]}`);
      }
      console.log();

      // If this is a critical test and it failed, we might want to stop
      if (suite.critical) {
        console.log(`   ⚠️  Critical test failed: ${suite.name}`);
      }
    }

    this.results.push(result);
  }

  private printSummary(totalDuration: number): void {
    console.log('📊 TEST SUMMARY');
    console.log('================\n');

    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => r.success === false).length;
    const criticalFailed = this.results.filter(r => !r.success && this.testSuites.find(s => s.name === r.suite)?.critical).length;

    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Critical Failures: ${criticalFailed} ⚠️`);
    console.log(`Total Duration: ${totalDuration}ms\n`);

    // Detailed results
    console.log('DETAILED RESULTS:');
    console.log('-----------------');
    
    this.results.forEach(result => {
      const suite = this.testSuites.find(s => s.name === result.suite);
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const critical = suite?.critical ? ' (CRITICAL)' : '';
      
      console.log(`${status} ${result.suite}${critical} - ${result.duration}ms`);
      
      if (!result.success && result.error) {
        console.log(`      Error: ${result.error.split('\n')[0]}`);
      }
    });

    console.log();

    // Performance metrics
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    const slowestTest = this.results.reduce((prev, current) => 
      (prev.duration > current.duration) ? prev : current
    );

    console.log('PERFORMANCE METRICS:');
    console.log('-------------------');
    console.log(`Average Test Duration: ${Math.round(avgDuration)}ms`);
    console.log(`Slowest Test: ${slowestTest.suite} (${slowestTest.duration}ms)`);
    console.log(`Total Test Time: ${totalDuration}ms`);

    // Final status
    console.log('\nFINAL STATUS:');
    console.log('=============');
    
    if (criticalFailed > 0) {
      console.log('❌ CRITICAL TESTS FAILED - Sync system has critical issues');
      process.exit(1);
    } else if (failed > 0) {
      console.log('⚠️  SOME TESTS FAILED - Non-critical issues detected');
      process.exit(1);
    } else {
      console.log('✅ ALL TESTS PASSED - Sync system is ready for production');
      process.exit(0);
    }
  }

  // Utility methods for specific test scenarios
  async runCriticalTestsOnly(): Promise<void> {
    console.log('🔥 Running Critical Tests Only\n');
    
    const criticalSuites = this.testSuites.filter(suite => suite.critical);
    
    for (const suite of criticalSuites) {
      await this.runTestSuite(suite);
    }

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    this.printSummary(totalDuration);
  }

  async runPerformanceTestsOnly(): Promise<void> {
    console.log('⚡ Running Performance Tests Only\n');
    
    const performanceSuites = this.testSuites.filter(suite => 
      suite.name.toLowerCase().includes('performance')
    );
    
    for (const suite of performanceSuites) {
      await this.runTestSuite(suite);
    }

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    this.printSummary(totalDuration);
  }

  async runE2ETestsOnly(): Promise<void> {
    console.log('🌐 Running End-to-End Tests Only\n');
    
    const e2eSuites = this.testSuites.filter(suite => 
      suite.name.toLowerCase().includes('end-to-end')
    );
    
    for (const suite of e2eSuites) {
      await this.runTestSuite(suite);
    }

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    this.printSummary(totalDuration);
  }

  // Validate test environment
  validateEnvironment(): boolean {
    console.log('🔍 Validating Test Environment...\n');

    const requiredFiles = [
      'package.json',
      'vitest.config.ts',
      'playwright.config.ts',
      'test/setup.ts'
    ];

    const requiredDirs = [
      'test/services',
      'test/integration',
      'test/performance',
      'test/e2e',
      'test/components'
    ];

    let isValid = true;

    // Check required files
    for (const file of requiredFiles) {
      if (!existsSync(file)) {
        console.log(`❌ Missing required file: ${file}`);
        isValid = false;
      } else {
        console.log(`✅ Found: ${file}`);
      }
    }

    // Check required directories
    for (const dir of requiredDirs) {
      if (!existsSync(dir)) {
        console.log(`❌ Missing required directory: ${dir}`);
        isValid = false;
      } else {
        console.log(`✅ Found: ${dir}`);
      }
    }

    console.log();

    if (isValid) {
      console.log('✅ Test environment is valid\n');
    } else {
      console.log('❌ Test environment validation failed\n');
    }

    return isValid;
  }
}

// CLI interface
async function main() {
  const runner = new SyncIntegrationTestRunner();
  
  const args = process.argv.slice(2);
  const command = args[0];

  // Validate environment first
  if (!runner.validateEnvironment()) {
    console.log('❌ Environment validation failed. Please fix the issues above.');
    process.exit(1);
  }

  switch (command) {
    case 'critical':
      await runner.runCriticalTestsOnly();
      break;
    case 'performance':
      await runner.runPerformanceTestsOnly();
      break;
    case 'e2e':
      await runner.runE2ETestsOnly();
      break;
    case 'all':
    default:
      await runner.runAllTests();
      break;
  }
}

// Export for programmatic use
export { SyncIntegrationTestRunner };

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}