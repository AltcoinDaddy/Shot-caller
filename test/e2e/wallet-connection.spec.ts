import { test, expect } from '@playwright/test'

test.describe('Wallet Connection Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display connect wallet button on homepage', async ({ page }) => {
    await expect(page.getByText('Connect Wallet')).toBeVisible()
  })

  test('should open wallet connection modal when connect button is clicked', async ({ page }) => {
    await page.getByText('Connect Wallet').click()
    
    // Check if wallet selection modal appears
    await expect(page.getByText('Connect Your Wallet')).toBeVisible()
    await expect(page.getByText('Dapper Wallet')).toBeVisible()
  })

  test('should show wallet address after successful connection', async ({ page }) => {
    // Mock successful wallet connection
    await page.addInitScript(() => {
      // Mock FCL authentication
      window.fcl = {
        authenticate: () => Promise.resolve(),
        currentUser: {
          subscribe: (callback: any) => {
            setTimeout(() => {
              callback({ addr: '0x1234567890abcdef', loggedIn: true })
            }, 100)
            return () => {}
          }
        }
      }
    })

    await page.getByText('Connect Wallet').click()
    await page.getByText('Dapper Wallet').click()
    
    // Wait for wallet connection to complete
    await expect(page.getByText('0x1234')).toBeVisible({ timeout: 5000 })
  })

  test('should navigate to team page after wallet connection', async ({ page }) => {
    // Mock successful wallet connection
    await page.addInitScript(() => {
      window.fcl = {
        authenticate: () => Promise.resolve(),
        currentUser: {
          subscribe: (callback: any) => {
            setTimeout(() => {
              callback({ addr: '0x1234567890abcdef', loggedIn: true })
            }, 100)
            return () => {}
          }
        }
      }
    })

    await page.getByText('Connect Wallet').click()
    await page.getByText('Dapper Wallet').click()
    
    // Wait for connection and navigate to team page
    await page.waitForTimeout(1000)
    await page.getByText('Team').click()
    
    await expect(page).toHaveURL('/team')
    await expect(page.getByText('Build Your Team')).toBeVisible()
  })

  test('should show error message for failed wallet connection', async ({ page }) => {
    // Mock failed wallet connection
    await page.addInitScript(() => {
      window.fcl = {
        authenticate: () => Promise.reject(new Error('Connection failed')),
        currentUser: {
          subscribe: (callback: any) => {
            callback({ addr: null, loggedIn: false })
            return () => {}
          }
        }
      }
    })

    await page.getByText('Connect Wallet').click()
    await page.getByText('Dapper Wallet').click()
    
    // Check for error message
    await expect(page.getByText('Failed to connect wallet')).toBeVisible({ timeout: 5000 })
  })

  test('should allow wallet disconnection', async ({ page }) => {
    // Mock successful wallet connection first
    await page.addInitScript(() => {
      let connected = false
      window.fcl = {
        authenticate: () => {
          connected = true
          return Promise.resolve()
        },
        unauthenticate: () => {
          connected = false
          return Promise.resolve()
        },
        currentUser: {
          subscribe: (callback: any) => {
            const checkConnection = () => {
              if (connected) {
                callback({ addr: '0x1234567890abcdef', loggedIn: true })
              } else {
                callback({ addr: null, loggedIn: false })
              }
            }
            setTimeout(checkConnection, 100)
            return () => {}
          }
        }
      }
    })

    // Connect wallet
    await page.getByText('Connect Wallet').click()
    await page.getByText('Dapper Wallet').click()
    await expect(page.getByText('0x1234')).toBeVisible({ timeout: 5000 })
    
    // Disconnect wallet
    await page.getByText('0x1234').click()
    await page.getByText('Disconnect').click()
    
    // Verify disconnection
    await expect(page.getByText('Connect Wallet')).toBeVisible({ timeout: 5000 })
  })
})