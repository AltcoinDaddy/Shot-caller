/**
 * Sync Test Runner
 * Orchestrates running all sync-related tests with proper setup and reporting
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface TestSuite {
  name: string;
  pattern: string;
  description: string;
  timeout?: number;
}

const SYNC_TEST_SUITES: TestSuite[] = [
  {
    name: 'Unit Tests',
    pattern: 'test/services/sync-manager-unit.test.ts',
    description: 'Core sync manager functionality and configuration',
    timeout: 30000
  },
  {
    name: 'Error Scenarios',
    pattern: 'test/services/sync-error-scenarios.test.ts',
    description: 'Error handling and recovery mechanisms',
    timeout: 45000
  },
  {
    name: 'Integration Flows',
    pattern: 'test/services/sync-integration-flows.test.ts',
    description: 'End-to-end wallet-to-profile sync flows',
    timeout: 60000
  },
  {
    name: 'Performance Tests',
    pattern: 'test/services/sync-performance.test.ts',
    description: 'Performance under various conditions and loads',
    timeout: 120000
  },
  {
    name: 'Event Bus Tests',
    pattern: 'test/services/sync-event-bus.test.ts',
    description: 'Event subscription and emission functionality',
    timeout: 30000
  },
  {
    name: 'Network Resilience Tests',
    pattern: 'test/services/network-resilience-manager.test.ts',
    description: 'Network monitoring and retry logic',
    timeout: 45000
  },
  {
    name: 'Existing Integration Tests',
    pattern: 'test/integration/wallet-profile-sync-integration.test.ts',
    description: 'Existing wallet-profile sync integration tests',
    timeout: 60000
  },
  {
    name: 'Auth Context Tests',
    pattern: 'test/contexts/enhanced-auth-context.test.tsx',
    description: 'Enhanced auth context with sync capabilities',
    timeout: 30000
  }
];

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  output: string;
  error?: string;
}

class SyncTestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Sync Test Suite\n');
    console.log('=' .repeat(60));
    
    this.startTime = Date.now();
    
    // Verify test files exist
    this.verifyTestFiles();
    
    // Run each test suite
    for (const suite of SYNC_TEST_SUITES) {
      await this.runTestSuite(suite);
    }
    
    // Generate summary report
    this.generateSummaryReport();
  }

  private verifyTestFiles(): void {
    console.log('📋 Verifying test files...\n');
    
    const missingFiles: string[] = [];
    
    for (const suite of SYNC_TEST_SUITES) {
      if (!existsSync(suite.pattern)) {
        missingFiles.push(suite.pattern);
      }
    }
    
    if (missingFiles.length > 0) {
      console.error('❌ Missing test files:');
      missingFiles.forEach(file => console.error(`   - ${file}`));
      console.error('\nPlease ensure all test files are created before running the test suite.\n');
      process.exit(1);
    }
    
    console.log('✅ All test files found\n');
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`🧪 Running ${suite.name}...`);
    console.log(`   ${suite.description}`);
    console.log(`   Pattern: ${suite.pattern}`);
    
    const startTime = Date.now();
    
    try {
      const command = `npx vitest run ${suite.pattern} --reporter=verbose`;
      const output = execSync(command, { 
        encoding: 'utf8',
        timeout: suite.timeout || 60000,
        stdio: 'pipe'
      });
      
      const duration = Date.now() - startTime;
      
      this.results.push({
        suite: suite.name,
        passed: true,
        duration,
        output
      });
      
      console.log(`   ✅ Passed (${duration}ms)\n`);
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        suite: suite.name,
        passed: false,
        duration,
        output: error.stdout || '',
        error: error.stderr || error.message
      });
      
      console.log(`   ❌ Failed (${duration}ms)`);
      console.log(`   Error: ${error.message}\n`);
    }
  }

  private generateSummaryReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;
    
    console.log('=' .repeat(60));
    console.log('📊 SYNC TEST SUITE SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total Test Suites: ${this.results.length}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log('');
    
    // Detailed results
    console.log('📋 Detailed Results:');
    console.log('-' .repeat(60));
    
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.suite} (${result.duration}ms)`);
      
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error.split('\n')[0]}`);
      }
    });
    
    console.log('');
    
    // Performance insights
    this.generatePerformanceInsights();
    
    // Coverage recommendations
    this.generateCoverageRecommendations();
    
    // Exit with appropriate code
    if (failedTests > 0) {
      console.log('❌ Some tests failed. Please review the errors above.');
      process.exit(1);
    } else {
      console.log('🎉 All sync tests passed successfully!');
      process.exit(0);
    }
  }

  private generatePerformanceInsights(): void {
    console.log('⚡ Performance Insights:');
    console.log('-' .repeat(30));
    
    const sortedByDuration = [...this.results].sort((a, b) => b.duration - a.duration);
    
    console.log('Slowest test suites:');
    sortedByDuration.slice(0, 3).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.suite}: ${result.duration}ms`);
    });
    
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    console.log(`Average duration: ${Math.round(avgDuration)}ms`);
    console.log('');
  }

  private generateCoverageRecommendations(): void {
    console.log('📈 Coverage Recommendations:');
    console.log('-' .repeat(30));
    
    const recommendations = [
      'Run with --coverage flag to generate detailed coverage reports',
      'Ensure all sync manager methods have corresponding tests',
      'Add edge case tests for network failure scenarios',
      'Include performance benchmarks in CI/CD pipeline',
      'Test with various NFT collection sizes (1, 100, 1000+ NFTs)',
      'Verify memory usage patterns during extended sync operations'
    ];
    
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    
    console.log('');
  }

  async runWithCoverage(): Promise<void> {
    console.log('📊 Running sync tests with coverage analysis...\n');
    
    try {
      const command = 'npx vitest run test/services/sync-*.test.ts test/integration/wallet-profile-sync-integration.test.ts test/contexts/enhanced-auth-context.test.tsx --coverage --reporter=verbose';
      
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'inherit'
      });
      
      console.log('\n✅ Coverage analysis completed');
      
    } catch (error: any) {
      console.error('❌ Coverage analysis failed:', error.message);
      process.exit(1);
    }
  }

  async runPerformanceOnly(): Promise<void> {
    console.log('⚡ Running performance tests only...\n');
    
    const performanceSuite = SYNC_TEST_SUITES.find(s => s.name === 'Performance Tests');
    if (performanceSuite) {
      await this.runTestSuite(performanceSuite);
    }
  }

  async runQuickTests(): Promise<void> {
    console.log('🏃 Running quick sync tests (unit + event bus)...\n');
    
    const quickSuites = SYNC_TEST_SUITES.filter(s => 
      s.name === 'Unit Tests' || s.name === 'Event Bus Tests'
    );
    
    for (const suite of quickSuites) {
      await this.runTestSuite(suite);
    }
    
    this.generateSummaryReport();
  }
}

// CLI interface
const args = process.argv.slice(2);
const runner = new SyncTestRunner();

async function main() {
  try {
    switch (args[0]) {
      case '--coverage':
        await runner.runWithCoverage();
        break;
      case '--performance':
        await runner.runPerformanceOnly();
        break;
      case '--quick':
        await runner.runQuickTests();
        break;
      case '--help':
        console.log('Sync Test Runner Usage:');
        console.log('  npm run test:sync              # Run all sync tests');
        console.log('  npm run test:sync -- --coverage # Run with coverage');
        console.log('  npm run test:sync -- --performance # Performance tests only');
        console.log('  npm run test:sync -- --quick    # Quick tests only');
        console.log('  npm run test:sync -- --help     # Show this help');
        break;
      default:
        await runner.runAllTests();
    }
  } catch (error: any) {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { SyncTestRunner };