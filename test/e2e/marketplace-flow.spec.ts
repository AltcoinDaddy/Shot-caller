import { test, expect } from '@playwright/test'

test.describe('Marketplace User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock wallet connection
    await page.addInitScript(() => {
      window.fcl = {
        authenticate: () => Promise.resolve(),
        unauthenticate: () => Promise.resolve(),
        currentUser: {
          subscribe: (callback: any) => {
            callback({ addr: '0x1234567890abcdef', loggedIn: true })
            return () => {}
          }
        },
        query: () => Promise.resolve([
          {
            id: 12345,
            playerName: 'LeBron James',
            team: 'Lakers',
            position: 'SF',
            sport: 'NBA',
            rarity: 'Legendary',
            imageUrl: 'https://example.com/lebron.jpg'
          }
        ]),
        mutate: () => Promise.resolve({ transactionId: '0x123456789' })
      }
    })

    await page.goto('/')
    
    // Connect wallet
    await page.getByText('Connect Wallet').click()
    await page.getByText('Dapper Wallet').click()
    await page.waitForTimeout(1000)
  })

  test('should complete full marketplace listing flow', async ({ page }) => {
    // Navigate to marketplace
    await page.getByText('Marketplace').click()
    await expect(page).toHaveURL('/marketplace')

    // Click on "List NFT" button
    await page.getByText('List NFT').click()

    // Fill out listing form
    await page.getByLabel('Select NFT').click()
    await page.getByText('LeBron James - Lakers').click()
    
    await page.getByLabel('Price (FLOW)').fill('15.5')
    
    // Submit listing
    await page.getByText('Create Listing').click()
    
    // Wait for success message
    await expect(page.getByText('NFT listed successfully')).toBeVisible({ timeout: 10000 })
    
    // Verify listing appears in marketplace
    await expect(page.getByText('LeBron James')).toBeVisible()
    await expect(page.getByText('15.5 FLOW')).toBeVisible()
  })

  test('should complete full marketplace purchase flow', async ({ page }) => {
    // Mock existing listings
    await page.addInitScript(() => {
      window.mockListings = [
        {
          id: '1',
          sellerAddress: '0xabcdef1234567890',
          momentId: 12345,
          price: 10.5,
          status: 'active',
          nft: {
            playerName: 'Stephen Curry',
            team: 'Warriors',
            position: 'PG',
            sport: 'NBA',
            rarity: 'Epic',
            imageUrl: 'https://example.com/curry.jpg'
          }
        }
      ]
    })

    // Navigate to marketplace
    await page.getByText('Marketplace').click()
    await expect(page).toHaveURL('/marketplace')

    // Find and click on a listing
    await expect(page.getByText('Stephen Curry')).toBeVisible()
    await expect(page.getByText('10.5 FLOW')).toBeVisible()
    
    // Click purchase button
    await page.getByText('Purchase').click()
    
    // Confirm purchase in modal
    await expect(page.getByText('Confirm Purchase')).toBeVisible()
    await expect(page.getByText('10.5 FLOW')).toBeVisible()
    
    await page.getByText('Confirm Purchase', { exact: true }).click()
    
    // Wait for transaction completion
    await expect(page.getByText('Purchase successful')).toBeVisible({ timeout: 15000 })
    
    // Verify NFT is now owned
    await page.getByText('Team').click()
    await expect(page.getByText('Stephen Curry')).toBeVisible()
  })

  test('should handle marketplace errors gracefully', async ({ page }) => {
    // Mock insufficient balance
    await page.addInitScript(() => {
      window.fcl.mutate = () => Promise.reject(new Error('Insufficient FLOW balance'))
    })

    await page.getByText('Marketplace').click()
    
    // Try to purchase with insufficient balance
    await page.getByText('Purchase').first().click()
    await page.getByText('Confirm Purchase', { exact: true }).click()
    
    // Verify error message
    await expect(page.getByText('Insufficient FLOW balance')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Retry Payment')).toBeVisible()
  })

  test('should allow canceling own listings', async ({ page }) => {
    // Mock own listing
    await page.addInitScript(() => {
      window.mockListings = [
        {
          id: '1',
          sellerAddress: '0x1234567890abcdef', // Same as connected wallet
          momentId: 12345,
          price: 8.0,
          status: 'active',
          nft: {
            playerName: 'Giannis Antetokounmpo',
            team: 'Bucks',
            position: 'PF',
            sport: 'NBA',
            rarity: 'Rare',
            imageUrl: 'https://example.com/giannis.jpg'
          }
        }
      ]
    })

    await page.getByText('Marketplace').click()
    
    // Should see cancel button instead of purchase
    await expect(page.getByText('Cancel Listing')).toBeVisible()
    
    // Cancel the listing
    await page.getByText('Cancel Listing').click()
    await page.getByText('Confirm Cancellation').click()
    
    // Verify cancellation success
    await expect(page.getByText('Listing cancelled successfully')).toBeVisible({ timeout: 10000 })
  })

  test('should filter and search marketplace listings', async ({ page }) => {
    await page.getByText('Marketplace').click()
    
    // Test sport filter
    await page.getByLabel('Sport').click()
    await page.getByText('NBA').click()
    
    // Test rarity filter
    await page.getByLabel('Rarity').click()
    await page.getByText('Legendary').click()
    
    // Test price range
    await page.getByLabel('Min Price').fill('5')
    await page.getByLabel('Max Price').fill('20')
    
    // Test search
    await page.getByPlaceholder('Search players...').fill('LeBron')
    
    // Apply filters
    await page.getByText('Apply Filters').click()
    
    // Verify filtered results
    await expect(page.getByText('LeBron James')).toBeVisible()
  })

  test('should show marketplace statistics', async ({ page }) => {
    await page.getByText('Marketplace').click()
    
    // Check for marketplace stats
    await expect(page.getByText('Total Volume')).toBeVisible()
    await expect(page.getByText('Active Listings')).toBeVisible()
    await expect(page.getByText('Average Price')).toBeVisible()
    
    // Check for recent sales
    await expect(page.getByText('Recent Sales')).toBeVisible()
  })

  test('should handle marketplace pagination', async ({ page }) => {
    await page.getByText('Marketplace').click()
    
    // Check if pagination exists (assuming more than 20 listings)
    const nextButton = page.getByText('Next')
    if (await nextButton.isVisible()) {
      await nextButton.click()
      
      // Verify page changed
      await expect(page.getByText('Page 2')).toBeVisible()
      
      // Go back to first page
      await page.getByText('Previous').click()
      await expect(page.getByText('Page 1')).toBeVisible()
    }
  })
})