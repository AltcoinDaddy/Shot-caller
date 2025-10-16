import { test, expect } from '@playwright/test'

test.describe('Complete Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock comprehensive wallet and game data
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
          },
          {
            id: 67890,
            playerName: 'Stephen Curry',
            team: 'Warriors',
            position: 'PG',
            sport: 'NBA',
            rarity: 'Epic',
            imageUrl: 'https://example.com/curry.jpg'
          },
          {
            id: 11111,
            playerName: 'Patrick Mahomes',
            team: 'Chiefs',
            position: 'QB',
            sport: 'NFL',
            rarity: 'Rare',
            imageUrl: 'https://example.com/mahomes.jpg'
          }
        ]),
        mutate: () => Promise.resolve({ transactionId: '0x123456789' })
      }

      // Mock user data
      window.mockUser = {
        id: '1',
        walletAddress: '0x1234567890abcdef',
        totalPoints: 1250,
        seasonRank: 15,
        wins: 8,
        losses: 3
      }

      // Mock current contest
      window.mockContest = {
        id: '1',
        weekId: 5,
        status: 'active',
        entryFee: 5.0,
        prizePool: 500.0,
        totalParticipants: 100,
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    })

    await page.goto('/')
  })

  test('should complete full game participation flow', async ({ page }) => {
    // Step 1: Connect wallet
    await page.getByText('Connect Wallet').click()
    await page.getByText('Dapper Wallet').click()
    await page.waitForTimeout(1000)
    
    // Verify wallet connected
    await expect(page.getByText('0x1234')).toBeVisible()

    // Step 2: Enter tournament
    await page.getByText('Treasury').click()
    await expect(page).toHaveURL('/treasury')
    
    // Find and join weekly contest
    await expect(page.getByText('Weekly Contest')).toBeVisible()
    await expect(page.getByText('Entry Fee: 5.0 FLOW')).toBeVisible()
    await expect(page.getByText('Prize Pool: 500.0 FLOW')).toBeVisible()
    
    await page.getByText('Join Contest').click()
    
    // Confirm payment
    await expect(page.getByText('Confirm Entry')).toBeVisible()
    await page.getByText('Pay 5.0 FLOW').click()
    
    // Wait for transaction
    await expect(page.getByText('Successfully joined contest')).toBeVisible({ timeout: 15000 })

    // Step 3: Build team lineup
    await page.getByText('Team').click()
    await expect(page).toHaveURL('/team')
    
    // Select NFTs for lineup
    await expect(page.getByText('Build Your Team')).toBeVisible()
    await expect(page.getByText('Select up to 5 NFTs')).toBeVisible()
    
    // Add players to lineup
    await page.getByText('LeBron James').click()
    await page.getByText('Stephen Curry').click()
    await page.getByText('Patrick Mahomes').click()
    
    // Verify lineup
    await expect(page.getByText('3 / 5 players selected')).toBeVisible()
    
    // Submit lineup
    await page.getByText('Submit Lineup').click()
    await expect(page.getByText('Lineup submitted successfully')).toBeVisible({ timeout: 10000 })

    // Step 4: Purchase and activate booster
    await page.getByText('Treasury').click()
    
    // Navigate to booster section
    await page.getByText('Boosters').click()
    
    // Purchase Disney Energy booster
    await page.getByText('Disney Energy Booster').click()
    await page.getByText('Purchase for 2.5 FLOW').click()
    
    // Confirm purchase
    await page.getByText('Confirm Purchase').click()
    await expect(page.getByText('Booster purchased successfully')).toBeVisible({ timeout: 10000 })
    
    // Activate booster
    await page.getByText('Activate').click()
    await expect(page.getByText('Booster activated')).toBeVisible()

    // Step 5: Check leaderboard
    await page.getByText('Leaderboard').click()
    await expect(page).toHaveURL('/leaderboard')
    
    // Verify user appears in leaderboard
    await expect(page.getByText('Your Rank: 15')).toBeVisible()
    await expect(page.getByText('Total Points: 1,250')).toBeVisible()
    
    // Check prize structure
    await expect(page.getByText('1st Place: 25%')).toBeVisible()
    await expect(page.getByText('2nd Place: 15%')).toBeVisible()
    await expect(page.getByText('3rd Place: 10%')).toBeVisible()

    // Step 6: View results and analytics
    await page.getByText('Results').click()
    await expect(page).toHaveURL('/results')
    
    // Check scoring breakdown
    await expect(page.getByText('This Week\'s Performance')).toBeVisible()
    await expect(page.getByText('Player Contributions')).toBeVisible()
    
    // Verify individual player scores
    await expect(page.getByText('LeBron James')).toBeVisible()
    await expect(page.getByText('Stephen Curry')).toBeVisible()
    await expect(page.getByText('Patrick Mahomes')).toBeVisible()

    // Step 7: Check profile and history
    await page.getByText('Profile').click()
    await expect(page).toHaveURL('/profile')
    
    // Verify profile information
    await expect(page.getByText('Season Rank: 15')).toBeVisible()
    await expect(page.getByText('Wins: 8')).toBeVisible()
    await expect(page.getByText('Losses: 3')).toBeVisible()
    
    // Check NFT collection
    await expect(page.getByText('Your NFT Collection')).toBeVisible()
    await expect(page.getByText('3 NFTs')).toBeVisible()
    
    // Check reward history
    await expect(page.getByText('Reward History')).toBeVisible()
  })

  test('should handle premium features flow', async ({ page }) => {
    // Connect wallet
    await page.getByText('Connect Wallet').click()
    await page.getByText('Dapper Wallet').click()
    await page.waitForTimeout(1000)

    // Navigate to premium page
    await page.getByText('Premium').click()
    await expect(page).toHaveURL('/premium')
    
    // Check premium features
    await expect(page.getByText('Season Pass')).toBeVisible()
    await expect(page.getByText('Advanced Analytics')).toBeVisible()
    await expect(page.getByText('Extra Lineup Slots')).toBeVisible()
    await expect(page.getByText('Bonus Rewards')).toBeVisible()
    
    // Purchase season pass
    await page.getByText('Purchase Season Pass').click()
    await page.getByText('Pay 25.0 FLOW').click()
    
    // Confirm purchase
    await expect(page.getByText('Season Pass activated')).toBeVisible({ timeout: 15000 })
    
    // Verify premium features unlocked
    await expect(page.getByText('Premium Active')).toBeVisible()
    
    // Check advanced analytics
    await page.getByText('Advanced Analytics').click()
    await expect(page.getByText('Player Projections')).toBeVisible()
    await expect(page.getByText('Matchup Analysis')).toBeVisible()
    await expect(page.getByText('Historical Trends')).toBeVisible()
  })

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Mock wallet connection failure
    await page.addInitScript(() => {
      window.fcl.authenticate = () => Promise.reject(new Error('Connection failed'))
    })

    // Try to connect wallet
    await page.getByText('Connect Wallet').click()
    await page.getByText('Dapper Wallet').click()
    
    // Verify error handling
    await expect(page.getByText('Failed to connect wallet')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Retry Connection')).toBeVisible()
    
    // Test retry functionality
    await page.addInitScript(() => {
      window.fcl.authenticate = () => Promise.resolve()
    })
    
    await page.getByText('Retry Connection').click()
    await expect(page.getByText('0x1234')).toBeVisible({ timeout: 10000 })
  })

  test('should handle tournament deadline scenarios', async ({ page }) => {
    // Mock expired contest
    await page.addInitScript(() => {
      window.mockContest.status = 'completed'
      window.mockContest.endTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    })

    await page.getByText('Connect Wallet').click()
    await page.getByText('Dapper Wallet').click()
    await page.waitForTimeout(1000)

    // Try to join expired contest
    await page.getByText('Treasury').click()
    
    // Should show contest as ended
    await expect(page.getByText('Contest Ended')).toBeVisible()
    await expect(page.getByText('Join Contest')).not.toBeVisible()
    
    // Check for next contest information
    await expect(page.getByText('Next Contest')).toBeVisible()
  })

  test('should handle insufficient balance scenarios', async ({ page }) => {
    // Mock insufficient balance
    await page.addInitScript(() => {
      window.fcl.mutate = () => Promise.reject(new Error('Insufficient FLOW balance'))
    })

    await page.getByText('Connect Wallet').click()
    await page.getByText('Dapper Wallet').click()
    await page.waitForTimeout(1000)

    // Try to join contest with insufficient balance
    await page.getByText('Treasury').click()
    await page.getByText('Join Contest').click()
    await page.getByText('Pay 5.0 FLOW').click()
    
    // Verify error handling
    await expect(page.getByText('Insufficient FLOW balance')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Add FLOW to your wallet')).toBeVisible()
  })

  test('should show real-time updates during active contest', async ({ page }) => {
    await page.getByText('Connect Wallet').click()
    await page.getByText('Dapper Wallet').click()
    await page.waitForTimeout(1000)

    // Navigate to leaderboard during active contest
    await page.getByText('Leaderboard').click()
    
    // Check for live updates indicator
    await expect(page.getByText('Live Updates')).toBeVisible()
    await expect(page.getByText('Contest ends in')).toBeVisible()
    
    // Verify countdown timer
    await expect(page.locator('[data-testid="countdown-timer"]')).toBeVisible()
    
    // Check for refresh functionality
    await page.getByText('Refresh Rankings').click()
    await expect(page.getByText('Rankings updated')).toBeVisible({ timeout: 5000 })
  })
})