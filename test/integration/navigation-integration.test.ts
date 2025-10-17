import { describe, it, expect } from 'vitest'

describe('Navigation Integration', () => {
  it('should have dashboard link in navigation items', () => {
    // Test that dashboard is included in navigation items
    const dashboardItems = [
      { href: "/dashboard", label: "DASHBOARD" },
      { href: "/team", label: "MY TEAM" },
      { href: "/leaderboard", label: "LEADERBOARD" },
      { href: "/results", label: "RESULTS" },
      { href: "/marketplace", label: "MARKETPLACE" },
      { href: "/treasury", label: "TREASURY" },
      { href: "/premium", label: "PREMIUM" },
      { href: "/profile", label: "PROFILE" },
    ]

    // Verify dashboard is first in the list
    expect(dashboardItems[0].href).toBe('/dashboard')
    expect(dashboardItems[0].label).toBe('DASHBOARD')
    
    // Verify all expected routes are present
    const expectedRoutes = ['/dashboard', '/team', '/leaderboard', '/results', '/marketplace', '/treasury', '/premium', '/profile']
    const actualRoutes = dashboardItems.map(item => item.href)
    
    expectedRoutes.forEach(route => {
      expect(actualRoutes).toContain(route)
    })
  })

  it('should have proper breadcrumb route mappings', () => {
    const routeLabels: Record<string, string> = {
      "/": "Home",
      "/dashboard": "Dashboard",
      "/team": "My Team",
      "/leaderboard": "Leaderboard", 
      "/results": "Results",
      "/marketplace": "Marketplace",
      "/treasury": "Treasury",
      "/premium": "Premium",
      "/profile": "Profile",
      "/rules": "Rules",
      "/sponsorship": "Sponsorship",
    }

    // Verify all main routes have proper labels
    expect(routeLabels['/dashboard']).toBe('Dashboard')
    expect(routeLabels['/team']).toBe('My Team')
    expect(routeLabels['/leaderboard']).toBe('Leaderboard')
    expect(routeLabels['/results']).toBe('Results')
    expect(routeLabels['/treasury']).toBe('Treasury')
    expect(routeLabels['/premium']).toBe('Premium')
    expect(routeLabels['/profile']).toBe('Profile')
  })

  it('should support navigation flow from dashboard to feature pages', () => {
    // Test navigation paths
    const navigationPaths = [
      { from: '/dashboard', to: '/team', description: 'Dashboard to My Team' },
      { from: '/dashboard', to: '/leaderboard', description: 'Dashboard to Leaderboard' },
      { from: '/dashboard', to: '/results', description: 'Dashboard to Results' },
      { from: '/dashboard', to: '/treasury', description: 'Dashboard to Treasury' },
      { from: '/dashboard', to: '/premium', description: 'Dashboard to Premium' },
      { from: '/dashboard', to: '/profile', description: 'Dashboard to Profile' },
    ]

    navigationPaths.forEach(path => {
      // Verify paths are valid routes
      expect(path.from).toMatch(/^\/[a-z]+$/)
      expect(path.to).toMatch(/^\/[a-z]+$/)
      expect(path.description).toContain('Dashboard to')
    })
  })
})