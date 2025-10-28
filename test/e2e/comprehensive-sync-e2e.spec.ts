/**
 * Comprehensive End-to-End Sync Tests
 * 
 * Tests sync behavior across different browsers, network conditions, and user scenarios.
 * Validates the complete integration of all sync components in realistic conditions.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const TEST_WALLET_ADDRESS = '0x1234567890abcdef';
const ALTERNATIVE_WALLET_ADDRESS = '0xabcdef1234567890';

const MOCK_NFT_COLLECTION = [
  {
    momentId: 'nba_lebron_dunk_2023',
    playerName: 'LeBron James',
    team: 'Lakers',
    sport: 'NBA',
    imageUrl: '/lebron-james-nba-action.jpg',
    eligible: true
  },
  {
    momentId: 'nfl_brady_touchdown_2023',
    playerName: 'Tom Brady',
    team: 'Buccaneers', 
    sport: 'NFL',
    imageUrl: '/placeholder.svg',
    eligible: true
  },
  {
    momentId: 'nba_curry_three_2023',
    playerName: 'Stephen Curry',
    team: 'Warriors',
    sport: 'NBA',
    imageUrl: '/stephen-curry-nba-shooting.jpg',
    eligible: true
  }
];

// Helper to setup comprehensive wallet mocking
async function setupWalletMocks(page: Page, options: {
  address?: string;
  walletType?: 'dapper' | 'flow' | 'other';
  nftData?: any[];
  syncDelay?: number;
  networkCondition?: 'normal' | 'slow' | 'unstable' | 'offline';
  shouldFail?: boolean;
} = {}) {
  const {
    address = TEST_WALLET_ADDRESS,
    walletType = 'dapper',
    nftData = MOCK_NFT_COLLECTION,
    syncDelay = 100,
    networkCondition = 'normal',
    shouldFail = false
  } = options;

  await page.addInitScript(({ 
    address, 
    walletType, 
    nftData, 
    syncDelay, 
    networkCondition, 
    shouldFail 
  }) => {
    let isConnected = false;
    let currentUser = { addr: null, loggedIn: false, services: [] };
    let networkOnline = networkCondition !== 'offline';
    let requestCount = 0;

    // Mock FCL with realistic wallet behavior
    window.fcl = {
      authenticate: async () => {
        if (shouldFail) {
          throw new Error('Wallet connection failed');
        }
        
        await new Promise(resolve => setTimeout(resolve, syncDelay));
        
        isConnected = true;
        const walletServices = {
          dapper: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }],
          flow: [{ id: '0xead892083b3e2c6c', name: 'Flow Wallet' }],
          other: [{ id: '0x123456789', name: 'Other Wallet' }]
        };
        
        currentUser = {
          addr: address,
          loggedIn: true,
          services: walletServices[walletType]
        };
        
        // Trigger subscriber callbacks
        if (window.fclSubscribers) {
          window.fclSubscribers.forEach(callback => callback(currentUser));
        }
      },
      
      unauthenticate: async () => {
        isConnected = false;
        currentUser = { addr: null, loggedIn: false, services: [] };
        if (window.fclSubscribers) {
          window.fclSubscribers.forEach(callback => callback(currentUser));
        }
      },
      
      currentUser: {
        subscribe: (callback) => {
          if (!window.fclSubscribers) {
            window.fclSubscribers = [];
          }
          window.fclSubscribers.push(callback);
          setTimeout(() => callback(currentUser), 10);
          return () => {
            const index = window.fclSubscribers.indexOf(callback);
            if (index > -1) {
              window.fclSubscribers.splice(index, 1);
            }
          };
        },
        snapshot: async () => currentUser
      }
    };

    // Mock network-aware NFT service
    window.mockNFTService = {
      getOwnership: async (addr) => {
        requestCount++;
        
        // Simulate network conditions
        if (networkCondition === 'offline') {
          throw new Error('Network offline');
        }
        
        if (networkCondition === 'unstable' && requestCount % 3 === 0) {
          throw new Error('Network timeout');
        }
        
        const delay = networkCondition === 'slow' ? syncDelay * 10 : syncDelay;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (addr !== address) {
          return { success: false, error: 'Invalid address' };
        }
        
        return {
          success: true,
          data: {
            address: addr,
            moments: nftData,
            collections: nftData.map(nft => ({ 
              collectionName: `${nft.sport} Collection`, 
              sport: nft.sport 
            })),
            totalCount: nftData.length,
            lastVerified: new Date(),
            isEligible: nftData.length > 0
          }
        };
      }
    };

    // Mock network resilience manager
    window.mockNetworkManager = {
      isOnline: () => networkOnline,
      executeWithRetry: async (operation, retries = 3) => {
        let lastError;
        for (let i = 0; i < retries; i++) {
          try {
            return await operation();
          } catch (error) {
            lastError = error;
            if (i < retries - 1) {
              await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
            }
          }
        }
        throw lastError;
      }
    };

    // Mock session storage
    window.mockSessionStorage = {
      data: {},
      setItem: (key, value) => { window.mockSessionStorage.data[key] = value; },
      getItem: (key) => window.mockSessionStorage.data[key] || null,
      removeItem: (key) => { delete window.mockSessionStorage.data[key]; },
      clear: () => { window.mockSessionStorage.data = {}; }
    };

    // Expose network control for tests
    window.setNetworkCondition = (condition) => {
      networkCondition = condition;
      networkOnline = condition !== 'offline';
    };
    
    window.getCurrentUser = () => currentUser;
    window.getRequestCount = () => requestCount;
  }, { address, walletType, nftData, syncDelay, networkCondition, shouldFail });
}

// Helper to simulate network conditions
async function setNetworkCondition(page: Page, condition: 'normal' | 'slow' | 'unstable' | 'offline') {
  await page.evaluate((condition) => {
    if (window.setNetworkCondition) {
      window.setNetworkCondition(condition);
    }
  }, condition);
  
  // Also set Playwright network conditions
  switch (condition) {
    case 'offline':
      await page.setOfflineMode(true);
      break;
    case 'slow':
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 2000);
      });
      break;
    case 'unstable':
      let requestCount = 0;
      await page.route('**/*', route => {
        requestCount++;
        if (requestCount % 4 === 0) {
          route.abort();
        } else {
          setTimeout(() => route.continue(), Math.random() * 1000);
        }
      });
      break;
    case 'normal':
      await page.setOfflineMode(false);
      await page.unroute('**/*');
      break;
  }
}

test.describe('Comprehensive Sync End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Complete Sync Flow Validation', () => {
    test('should complete full wallet-to-profile sync with all components', async ({ page }) => {
      await setupWalletMocks(page, {
        address: TEST_WALLET_ADDRESS,
        walletType: 'dapper',
        nftData: MOCK_NFT_COLLECTION,
        syncDelay: 200
      });

      // Step 1: Connect wallet
      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();

      // Step 2: Verify wallet connection in navigation
      await expect(page.getByText('0x1234')).toBeVisible({ timeout: 10000 });

      // Step 3: Navigate to profile and verify sync
      await page.goto('/profile');
      
      // Step 4: Verify profile data is synced
      await expect(page.getByText(TEST_WALLET_ADDRESS)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Wallet Connected')).toBeVisible();

      // Step 5: Verify NFT collection display
      await expect(page.getByText('LeBron James')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Tom Brady')).toBeVisible();
      await expect(page.getByText('Stephen Curry')).toBeVisible();

      // Step 6: Verify sync status indicators
      await expect(page.locator('[data-testid="sync-status-indicator"]')).toBeVisible();

      // Step 7: Test manual sync functionality
      await page.getByText('Refresh Profile').click();
      await expect(page.getByText('Syncing...')).toBeVisible();
      await expect(page.getByText('Refresh Profile')).toBeVisible({ timeout: 15000 });

      // Step 8: Verify NFT count is correct
      await expect(page.getByText('3')).toBeVisible(); // Total NFT count
    });

    test('should handle wallet switching between different types', async ({ page }) => {
      // Start with Dapper Wallet
      await setupWalletMocks(page, {
        address: TEST_WALLET_ADDRESS,
        walletType: 'dapper',
        nftData: MOCK_NFT_COLLECTION.slice(0, 2) // 2 NFTs
      });

      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await expect(page.getByText('0x1234')).toBeVisible({ timeout: 10000 });

      await page.goto('/profile');
      await expect(page.getByText('2')).toBeVisible(); // 2 NFTs

      // Disconnect and switch to Flow Wallet
      await page.getByText('0x1234').click();
      await page.getByText('Disconnect').click();
      await expect(page.getByText('Connect Wallet')).toBeVisible({ timeout: 5000 });

      // Setup Flow Wallet with different data
      await page.evaluate(() => {
        window.fcl.authenticate = async () => {
          const currentUser = {
            addr: '0xabcdef1234567890',
            loggedIn: true,
            services: [{ id: '0xead892083b3e2c6c', name: 'Flow Wallet' }]
          };
          window.fclSubscribers.forEach(callback => callback(currentUser));
        };
        
        window.mockNFTService.getOwnership = async (addr) => {
          return {
            success: true,
            data: {
              address: addr,
              moments: [window.mockNFTData[0]], // Only 1 NFT
              collections: [{ collectionName: 'NBA Top Shot', sport: 'NBA' }],
              totalCount: 1,
              lastVerified: new Date(),
              isEligible: true
            }
          };
        };
      });

      await page.getByText('Connect Wallet').click();
      await page.getByText('Flow Wallet').click();
      await expect(page.getByText('0xabcd')).toBeVisible({ timeout: 10000 });

      await page.goto('/profile');
      await expect(page.getByText('1')).toBeVisible({ timeout: 15000 }); // 1 NFT
    });
  });

  test.describe('Network Resilience Testing', () => {
    test('should handle offline mode gracefully', async ({ page }) => {
      await setupWalletMocks(page, {
        networkCondition: 'normal'
      });

      // Connect while online
      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await expect(page.getByText('0x1234')).toBeVisible({ timeout: 10000 });

      await page.goto('/profile');
      await expect(page.getByText('Wallet Connected')).toBeVisible();

      // Go offline
      await setNetworkCondition(page, 'offline');

      // Try to refresh - should show cached data with offline indicator
      await page.getByText('Refresh Profile').click();
      
      // Should show offline indicator or error message
      await expect(page.locator('text=/offline|network|error/i')).toBeVisible({ timeout: 10000 });

      // Go back online
      await setNetworkCondition(page, 'normal');
      
      // Should be able to sync again
      await page.getByText('Refresh Profile').click();
      await expect(page.getByText('Syncing...')).toBeVisible();
      await expect(page.getByText('Refresh Profile')).toBeVisible({ timeout: 15000 });
    });

    test('should retry failed operations with exponential backoff', async ({ page }) => {
      await setupWalletMocks(page, {
        networkCondition: 'unstable'
      });

      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await page.goto('/profile');

      // Trigger sync that may fail initially
      await page.getByText('Refresh Profile').click();

      // Should eventually succeed or show retry option
      await expect(page.locator('text=/retry|success|syncing/i')).toBeVisible({ timeout: 20000 });

      // Verify request count shows retries happened
      const requestCount = await page.evaluate(() => window.getRequestCount());
      expect(requestCount).toBeGreaterThan(1);
    });

    test('should handle slow network conditions', async ({ page }) => {
      await setupWalletMocks(page, {
        networkCondition: 'slow',
        syncDelay: 1000
      });

      const startTime = Date.now();

      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await expect(page.getByText('0x1234')).toBeVisible({ timeout: 15000 });

      await page.goto('/profile');
      
      // Should show loading states during slow sync
      await expect(page.locator('.animate-spin')).toBeVisible({ timeout: 5000 });
      
      // Eventually should complete
      await expect(page.getByText('Wallet Connected')).toBeVisible({ timeout: 30000 });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should take longer due to slow network
      expect(duration).toBeGreaterThan(2000);
    });
  });

  test.describe('Real-time Updates and Event Handling', () => {
    test('should update profile when NFT collection changes', async ({ page }) => {
      await setupWalletMocks(page, {
        nftData: MOCK_NFT_COLLECTION.slice(0, 2) // Start with 2 NFTs
      });

      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await page.goto('/profile');

      // Verify initial NFT count
      await expect(page.getByText('2')).toBeVisible({ timeout: 15000 });

      // Simulate NFT collection change
      await page.evaluate(() => {
        window.mockNFTService.getOwnership = async (addr) => {
          return {
            success: true,
            data: {
              address: addr,
              moments: [
                ...window.mockNFTData.slice(0, 2),
                {
                  momentId: 'nba_new_moment_2023',
                  playerName: 'Giannis Antetokounmpo',
                  team: 'Bucks',
                  sport: 'NBA',
                  imageUrl: '/giannis-antetokounmpo-nba-dunk.jpg',
                  eligible: true
                }
              ],
              collections: [
                { collectionName: 'NBA Top Shot', sport: 'NBA' },
                { collectionName: 'NFL All Day', sport: 'NFL' }
              ],
              totalCount: 3,
              lastVerified: new Date(),
              isEligible: true
            }
          };
        };
      });

      // Trigger refresh
      await page.getByText('Refresh NFTs').click();

      // Verify updated count and new NFT
      await expect(page.getByText('3')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Giannis Antetokounmpo')).toBeVisible();
    });

    test('should show real-time sync progress indicators', async ({ page }) => {
      await setupWalletMocks(page, {
        syncDelay: 2000 // Slower sync for testing indicators
      });

      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await page.goto('/profile');

      // Trigger manual sync
      await page.getByText('Refresh Profile').click();

      // Verify loading states appear
      await expect(page.getByText('Syncing...')).toBeVisible();
      await expect(page.locator('.animate-spin')).toBeVisible();

      // Verify progress indicators
      await expect(page.locator('[data-testid="sync-progress"]')).toBeVisible();

      // Wait for completion
      await expect(page.getByText('Refresh Profile')).toBeVisible({ timeout: 20000 });
      await expect(page.getByText('Syncing...')).not.toBeVisible();
    });
  });

  test.describe('Error Handling and User Experience', () => {
    test('should display clear error messages for sync failures', async ({ page }) => {
      await setupWalletMocks(page, {
        shouldFail: true
      });

      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();

      // Should show error message
      await expect(page.locator('text=/failed|error|unable/i')).toBeVisible({ timeout: 10000 });
    });

    test('should provide retry options for failed operations', async ({ page }) => {
      await setupWalletMocks(page);

      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await page.goto('/profile');

      // Mock sync failure
      await page.evaluate(() => {
        window.mockNFTService.getOwnership = async () => {
          throw new Error('Sync operation failed');
        };
      });

      await page.getByText('Refresh NFTs').click();
      
      // Should show error and retry option
      await expect(page.locator('text=/error|retry|try again/i')).toBeVisible({ timeout: 15000 });
      
      // Test retry functionality
      await page.evaluate(() => {
        window.mockNFTService.getOwnership = async (addr) => {
          return {
            success: true,
            data: {
              address: addr,
              moments: window.mockNFTData,
              collections: [{ collectionName: 'NBA Top Shot', sport: 'NBA' }],
              totalCount: window.mockNFTData.length,
              lastVerified: new Date(),
              isEligible: true
            }
          };
        };
      });

      await page.getByText(/retry|try again/i).click();
      await expect(page.getByText('Syncing...')).toBeVisible();
      await expect(page.getByText('Refresh NFTs')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Performance Under Load', () => {
    test('should handle multiple concurrent users and operations', async ({ page }) => {
      await setupWalletMocks(page);

      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await page.goto('/profile');

      // Trigger multiple operations simultaneously
      const operations = [
        page.getByText('Refresh Profile').click(),
        page.getByText('Refresh NFTs').click(),
        page.goto('/dashboard'),
        page.goto('/profile')
      ];

      await Promise.all(operations);

      // Should handle gracefully without breaking
      await expect(page.getByText(/profile|dashboard/i)).toBeVisible({ timeout: 15000 });
    });

    test('should maintain responsive UI during heavy sync operations', async ({ page }) => {
      await setupWalletMocks(page, {
        syncDelay: 3000, // Heavy operation
        nftData: Array(50).fill(null).map((_, i) => ({ // Large NFT collection
          momentId: `nft_${i}`,
          playerName: `Player ${i}`,
          team: `Team ${i}`,
          sport: i % 2 === 0 ? 'NBA' : 'NFL',
          imageUrl: '/placeholder.svg',
          eligible: true
        }))
      });

      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await page.goto('/profile');

      // Start heavy sync operation
      await page.getByText('Refresh Profile').click();

      // UI should remain responsive
      await expect(page.getByText('MY NFT COLLECTION')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      
      // Should be able to navigate during sync
      await page.getByText('DASHBOARD').click();
      await expect(page).toHaveURL('/dashboard');
      
      // Navigation should work
      await page.getByText('PROFILE').click();
      await expect(page).toHaveURL('/profile');
    });
  });
});

test.describe('Cross-Browser Compatibility', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`should work correctly in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
      test.skip(currentBrowser !== browserName, `Skipping ${browserName} test in ${currentBrowser}`);
      
      await setupWalletMocks(page);
      
      // Basic sync flow
      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await expect(page.getByText('0x1234')).toBeVisible({ timeout: 15000 });
      
      await page.goto('/profile');
      await expect(page.getByText('Wallet Connected')).toBeVisible({ timeout: 15000 });
      
      // Test sync functionality
      await page.getByText('Refresh Profile').click();
      await expect(page.getByText('Syncing...')).toBeVisible();
      await expect(page.getByText('Refresh Profile')).toBeVisible({ timeout: 20000 });
    });
  });
});

test.describe('Mobile Device Testing', () => {
  test('should work correctly on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await setupWalletMocks(page);
    
    // Test mobile navigation
    await page.getByRole('button', { name: /menu/i }).click();
    await expect(page.getByText('DASHBOARD')).toBeVisible();
    
    // Connect wallet on mobile
    await page.getByText('Connect Wallet').click();
    await page.getByText('Dapper Wallet').click();
    await expect(page.getByText('0x1234')).toBeVisible({ timeout: 15000 });
    
    // Navigate to profile
    await page.goto('/profile');
    await expect(page.getByText('Wallet Connected')).toBeVisible({ timeout: 15000 });
    
    // Test mobile sync controls
    await page.getByText('Refresh Profile').click();
    await expect(page.getByText('Syncing...')).toBeVisible();
    await expect(page.getByText('Refresh Profile')).toBeVisible({ timeout: 20000 });
  });

  test('should handle touch interactions correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupWalletMocks(page);
    
    await page.getByText('Connect Wallet').click();
    await page.getByText('Dapper Wallet').click();
    await page.goto('/profile');
    
    // Test touch-based sync controls
    await page.locator('[data-testid="refresh-button"]').tap();
    await expect(page.getByText('Syncing...')).toBeVisible();
  });
});