/**
 * End-to-End Integration Tests for Wallet-Profile Sync System
 * 
 * This test suite validates the complete integration of all sync components
 * across different browsers, network conditions, and user scenarios.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const TEST_WALLET_ADDRESS = '0x1234567890abcdef';
const MOCK_NFT_DATA = [
  {
    momentId: 'nba_1',
    playerName: 'LeBron James',
    team: 'Lakers',
    sport: 'NBA',
    imageUrl: '/placeholder.svg'
  },
  {
    momentId: 'nfl_1', 
    playerName: 'Tom Brady',
    team: 'Buccaneers',
    sport: 'NFL',
    imageUrl: '/placeholder.svg'
  }
];

// Helper function to mock wallet connection
async function mockWalletConnection(page: Page, options: {
  address?: string;
  success?: boolean;
  nftData?: any[];
  delay?: number;
} = {}) {
  const {
    address = TEST_WALLET_ADDRESS,
    success = true,
    nftData = MOCK_NFT_DATA,
    delay = 100
  } = options;

  await page.addInitScript(({ address, success, nftData, delay }) => {
    let isConnected = false;
    let currentUser = { addr: null, loggedIn: false, services: [] };

    // Mock FCL
    window.fcl = {
      authenticate: async () => {
        if (!success) {
          throw new Error('Wallet connection failed');
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        isConnected = true;
        currentUser = {
          addr: address,
          loggedIn: true,
          services: [{ id: '0x82ec283f88a62e65', name: 'Dapper Wallet' }]
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
          // Immediately call with current state
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

    // Mock NFT ownership service
    window.mockNFTService = {
      getOwnership: async (addr) => {
        if (addr !== address) {
          return { success: false, error: 'Invalid address' };
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        return {
          success: true,
          data: {
            address: addr,
            moments: nftData,
            collections: nftData.map(nft => ({ collectionName: `${nft.sport} Collection`, sport: nft.sport })),
            totalCount: nftData.length,
            lastVerified: new Date(),
            isEligible: nftData.length > 0
          }
        };
      }
    };

    // Mock network resilience
    window.mockNetworkManager = {
      isOnline: () => true,
      executeWithRetry: async (operation) => operation()
    };
  }, { address, success, nftData, delay });
}

// Helper function to simulate network conditions
async function simulateNetworkCondition(page: Page, condition: 'offline' | 'slow' | 'unstable' | 'normal') {
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
        if (requestCount % 3 === 0) {
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

test.describe('Wallet-Profile Sync End-to-End Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Complete Sync Flow Integration', () => {
    test('should complete full wallet connection to profile sync flow', async ({ page }) => {
      // Mock successful wallet connection with NFT data
      await mockWalletConnection(page, {
        address: TEST_WALLET_ADDRESS,
        success: true,
        nftData: MOCK_NFT_DATA
      });

      // Step 1: Connect wallet
      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();

      // Step 2: Verify wallet connection in navigation
      await expect(page.getByText('0x1234')).toBeVisible({ timeout: 5000 });

      // Step 3: Navigate to profile page
      await page.goto('/profile');

      // Step 4: Verify profile data is synced
      await expect(page.getByText(TEST_WALLET_ADDRESS)).toBeVisible();
      await expect(page.getByText('Wallet Connected')).toBeVisible();

      // Step 5: Verify NFT collection is displayed
      await expect(page.getByText('LeBron James')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Tom Brady')).toBeVisible();

      // Step 6: Verify sync status indicators
      await expect(page.locator('[data-testid="sync-status-indicator"]')).toBeVisible();

      // Step 7: Test manual sync
      await page.getByText('Refresh Profile').click();
      await expect(page.getByText('Syncing...')).toBeVisible();
      await expect(page.getByText('Refresh Profile')).toBeVisible({ timeout: 10000 });
    });

    test('should handle wallet disconnection and cleanup', async ({ page }) => {
      // Connect wallet first
      await mockWalletConnection(page);
      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await expect(page.getByText('0x1234')).toBeVisible({ timeout: 5000 });

      // Navigate to profile
      await page.goto('/profile');
      await expect(page.getByText('Wallet Connected')).toBeVisible();

      // Disconnect wallet
      await page.getByText('0x1234').click();
      await page.getByText('Disconnect').click();

      // Verify cleanup
      await expect(page.getByText('Connect Wallet')).toBeVisible({ timeout: 5000 });
      
      // Navigate back to profile - should show connection prompt
      await page.goto('/profile');
      await expect(page.getByText('Connect Your Wallet')).toBeVisible();
    });
  });

  test.describe('Real-time Profile Updates', () => {
    test('should update profile when NFT collection changes', async ({ page }) => {
      // Initial connection with 2 NFTs
      await mockWalletConnection(page, {
        nftData: MOCK_NFT_DATA
      });

      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await page.goto('/profile');

      // Verify initial NFT count
      await expect(page.getByText('2')).toBeVisible(); // Total NFTs counter

      // Simulate NFT collection change (add new NFT)
      await page.evaluate(() => {
        const newNFT = {
          momentId: 'nba_2',
          playerName: 'Stephen Curry',
          team: 'Warriors',
          sport: 'NBA',
          imageUrl: '/placeholder.svg'
        };
        
        // Update mock service to return new collection
        window.mockNFTService.getOwnership = async (addr) => {
          return {
            success: true,
            data: {
              address: addr,
              moments: [...window.originalNFTData || [], newNFT],
              totalCount: 3,
              isEligible: true
            }
          };
        };
      });

      // Trigger manual refresh
      await page.getByText('Refresh NFTs').click();

      // Verify updated count and new NFT
      await expect(page.getByText('3')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Stephen Curry')).toBeVisible();
    });

    test('should show sync progress indicators during updates', async ({ page }) => {
      await mockWalletConnection(page, { delay: 2000 }); // Slower sync for testing

      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await page.goto('/profile');

      // Trigger manual sync
      await page.getByText('Refresh Profile').click();

      // Verify loading states
      await expect(page.getByText('Syncing...')).toBeVisible();
      await expect(page.locator('.animate-spin')).toBeVisible();

      // Wait for completion
      await expect(page.getByText('Refresh Profile')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Network Resilience Testing', () => {
    test('should handle offline mode gracefully', async ({ page }) => {
      // Connect wallet while online
      await mockWalletConnection(page);
      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await page.goto('/profile');

      // Go offline
      await simulateNetworkCondition(page, 'offline');

      // Try to refresh - should show cached data with offline indicator
      await page.getByText('Refresh Profile').click();
      
      // Should show error or offline indicator
      await expect(page.getByText(/offline|network|error/i)).toBeVisible({ timeout: 5000 });

      // Go back online
      await simulateNetworkCondition(page, 'normal');
      
      // Should be able to sync again
      await page.getByText('Refresh Profile').click();
      await expect(page.getByText('Syncing...')).toBeVisible();
    });

    test('should retry failed sync operations', async ({ page }) => {
      // Mock unstable network
      await mockWalletConnection(page);
      await simulateNetworkCondition(page, 'unstable');

      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await page.goto('/profile');

      // Trigger sync - may fail initially but should retry
      await page.getByText('Refresh Profile').click();

      // Should eventually succeed or show retry option
      await expect(page.locator('text=/retry|error|success/i')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Multi-Wallet Support', () => {
    test('should handle different wallet types consistently', async ({ page }) => {
      // Test Dapper Wallet
      await mockWalletConnection(page, {
        address: TEST_WALLET_ADDRESS
      });

      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await expect(page.getByText('Dapper Wallet')).toBeVisible();

      // Disconnect and test Flow Wallet
      await page.getByText('0x1234').click();
      await page.getByText('Disconnect').click();

      // Mock Flow Wallet connection
      await page.evaluate(() => {
        window.fcl.authenticate = async () => {
          window.fclSubscribers.forEach(callback => callback({
            addr: '0x1234567890abcdef',
            loggedIn: true,
            services: [{ id: '0xead892083b3e2c6c', name: 'Flow Wallet' }]
          }));
        };
      });

      await page.getByText('Connect Wallet').click();
      await page.getByText('Flow Wallet').click();
      await expect(page.getByText('Flow Wallet')).toBeVisible();
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should display clear error messages for sync failures', async ({ page }) => {
      // Mock failed wallet connection
      await mockWalletConnection(page, { success: false });

      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();

      // Should show error message
      await expect(page.getByText(/failed|error/i)).toBeVisible({ timeout: 5000 });
    });

    test('should provide retry options for failed operations', async ({ page }) => {
      await mockWalletConnection(page);
      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await page.goto('/profile');

      // Mock sync failure
      await page.evaluate(() => {
        window.mockNFTService.getOwnership = async () => {
          throw new Error('Sync failed');
        };
      });

      await page.getByText('Refresh NFTs').click();
      
      // Should show error and retry option
      await expect(page.locator('text=/error|retry/i')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Performance Under Load', () => {
    test('should handle multiple concurrent sync operations', async ({ page }) => {
      await mockWalletConnection(page, { delay: 1000 });
      
      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await page.goto('/profile');

      // Trigger multiple sync operations quickly
      await Promise.all([
        page.getByText('Refresh Profile').click(),
        page.getByText('Refresh NFTs').click()
      ]);

      // Should handle gracefully without breaking
      await expect(page.getByText(/syncing|loading/i)).toBeVisible();
      await expect(page.getByText('Refresh Profile')).toBeVisible({ timeout: 15000 });
    });

    test('should maintain responsive UI during sync operations', async ({ page }) => {
      await mockWalletConnection(page, { delay: 3000 });
      
      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await page.goto('/profile');

      // Start sync operation
      await page.getByText('Refresh Profile').click();

      // UI should remain responsive
      await expect(page.getByText('MY NFT COLLECTION')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      
      // Should be able to navigate during sync
      await page.getByText('DASHBOARD').click();
      await expect(page).toHaveURL('/dashboard');
    });
  });
});

test.describe('Cross-Browser Compatibility', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`should work correctly in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
      test.skip(currentBrowser !== browserName, `Skipping ${browserName} test in ${currentBrowser}`);
      
      await mockWalletConnection(page);
      
      // Basic sync flow
      await page.getByText('Connect Wallet').click();
      await page.getByText('Dapper Wallet').click();
      await expect(page.getByText('0x1234')).toBeVisible({ timeout: 10000 });
      
      await page.goto('/profile');
      await expect(page.getByText('Wallet Connected')).toBeVisible();
      
      // Test sync functionality
      await page.getByText('Refresh Profile').click();
      await expect(page.getByText('Syncing...')).toBeVisible();
      await expect(page.getByText('Refresh Profile')).toBeVisible({ timeout: 15000 });
    });
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should work correctly on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await mockWalletConnection(page);
    
    // Test mobile navigation
    await page.getByRole('button', { name: /menu/i }).click();
    await expect(page.getByText('DASHBOARD')).toBeVisible();
    
    // Connect wallet on mobile
    await page.getByText('Connect Wallet').click();
    await page.getByText('Dapper Wallet').click();
    await expect(page.getByText('0x1234')).toBeVisible({ timeout: 5000 });
    
    // Navigate to profile
    await page.goto('/profile');
    await expect(page.getByText('Wallet Connected')).toBeVisible();
    
    // Test mobile sync controls
    await page.getByText('Refresh Profile').click();
    await expect(page.getByText('Syncing...')).toBeVisible();
  });
});