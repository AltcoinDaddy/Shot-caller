# Design Document

## Overview

The unified dashboard will serve as the central hub for ShotCaller users, consolidating all main navigation sections (MYTEAM, LEADERBOARD, RESULTS, TREASURY, PREMIUM, PROFILE) into a single, organized interface. The dashboard will provide quick access to key features while displaying relevant preview information and metrics for each section.

## Architecture

### Component Structure
```
/app/dashboard/
├── page.tsx                    # Main dashboard page
├── components/
│   ├── dashboard-card.tsx      # Reusable card component for each section
│   ├── dashboard-header.tsx    # Dashboard header with user info
│   ├── quick-actions.tsx       # Quick action buttons component
│   └── dashboard-stats.tsx     # Stats overview component
```

### Data Flow
- Dashboard page fetches data from existing hooks and services
- Each dashboard card component receives section-specific data as props
- Real-time updates through existing data refresh mechanisms
- Loading states handled at the card level for better UX

## Components and Interfaces

### DashboardCard Interface
```typescript
interface DashboardCardProps {
  title: string
  description: string
  href: string
  icon: React.ComponentType
  stats?: {
    primary: string | number
    secondary?: string | number
    label: string
  }
  quickActions?: QuickAction[]
  loading?: boolean
  error?: string
}

interface QuickAction {
  label: string
  onClick: () => void
  icon?: React.ComponentType
  variant?: 'default' | 'outline' | 'secondary'
}
```

### Dashboard Layout
- **Grid System**: Responsive CSS Grid layout
  - Mobile: 1 column
  - Tablet: 2 columns  
  - Desktop: 3 columns
- **Card Design**: Consistent with existing ShotCaller card styling
  - Holographic effects and animations
  - Hover states with scale transforms
  - Loading skeletons for data fetching

### Section-Specific Components

#### 1. MYTEAM Dashboard Card
- **Preview Data**: Current lineup count (X/5), active contest info
- **Quick Actions**: "Set Lineup", "View Team"
- **Visual Elements**: Mini lineup preview with NFT thumbnails
- **Data Source**: `useNFTOwnership`, `lineupService`

#### 2. LEADERBOARD Dashboard Card  
- **Preview Data**: Current rank, weekly points, total points
- **Quick Actions**: "View Full Rankings", "Check Position"
- **Visual Elements**: Rank badge, trending indicators
- **Data Source**: `useLeaderboard`

#### 3. RESULTS Dashboard Card
- **Preview Data**: Latest contest results, upcoming contests
- **Quick Actions**: "View Details", "See All Results"
- **Visual Elements**: Win/loss indicators, score highlights
- **Data Source**: Contest and scoring services

#### 4. TREASURY Dashboard Card
- **Preview Data**: FLOW balance, recent transactions
- **Quick Actions**: "View Transactions", "Check Balance"
- **Visual Elements**: Balance display, transaction history preview
- **Data Source**: Wallet and treasury services

#### 5. PREMIUM Dashboard Card
- **Preview Data**: Subscription status, days remaining, active features
- **Quick Actions**: "Upgrade", "Manage Subscription", "View Benefits"
- **Visual Elements**: Premium badge, feature highlights
- **Data Source**: `usePremium`

#### 6. PROFILE Dashboard Card
- **Preview Data**: Username, avatar, key stats, achievements
- **Quick Actions**: "Edit Profile", "View Collection"
- **Visual Elements**: Avatar, achievement badges, stats summary
- **Data Source**: User profile and NFT ownership data

## Data Models

### Dashboard Data Structure
```typescript
interface DashboardData {
  user: {
    username: string
    avatar: string
    walletAddress: string
  }
  myTeam: {
    lineupCount: number
    activeContest: Contest | null
    nftCount: number
  }
  leaderboard: {
    currentRank: number
    weeklyPoints: number
    totalPoints: number
    rankChange: number
  }
  results: {
    latestResults: ContestResult[]
    upcomingContests: Contest[]
  }
  treasury: {
    flowBalance: number
    recentTransactions: Transaction[]
  }
  premium: {
    isActive: boolean
    daysRemaining?: number
    activeFeatures: string[]
  }
  profile: {
    totalNFTs: number
    achievements: Achievement[]
    joinDate: string
  }
}
```

## Error Handling

### Error States
- **Network Errors**: Show retry buttons with error messages
- **Data Loading Failures**: Display fallback content with refresh options
- **Authentication Issues**: Redirect to wallet connection
- **Service Unavailable**: Show maintenance messages

### Loading States
- **Skeleton Loading**: Individual card skeletons during data fetch
- **Progressive Loading**: Load critical data first, then secondary data
- **Refresh Indicators**: Show loading spinners during data refresh

## Testing Strategy

### Unit Tests
- Dashboard card component rendering
- Data transformation and formatting
- Quick action button functionality
- Error state handling

### Integration Tests
- Dashboard page data fetching
- Navigation between dashboard and feature pages
- Responsive layout behavior
- Real-time data updates

### E2E Tests
- Complete dashboard user flow
- Quick action navigation
- Mobile responsiveness
- Performance under load

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Load non-critical data after initial render
- **Memoization**: Cache expensive calculations and API responses
- **Code Splitting**: Separate dashboard components for better loading
- **Image Optimization**: Optimize NFT thumbnails and avatars

### Caching Strategy
- **Client-side Caching**: Use existing cache mechanisms for API data
- **Stale-while-revalidate**: Show cached data while fetching updates
- **Selective Refresh**: Only update changed sections

## Accessibility

### WCAG Compliance
- **Keyboard Navigation**: Full keyboard accessibility for all interactive elements
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Meet WCAG AA standards for text and backgrounds
- **Focus Management**: Clear focus indicators and logical tab order

### Mobile Accessibility
- **Touch Targets**: Minimum 44px touch targets for mobile
- **Gesture Support**: Support for swipe and pinch gestures
- **Voice Control**: Compatible with voice navigation tools

## Visual Design

### Design System Integration
- **Consistent Styling**: Use existing ShotCaller design tokens
- **Animation Library**: Leverage current animation patterns
- **Responsive Breakpoints**: Follow established mobile-first approach
- **Theme Support**: Full dark/light mode compatibility

### Card Design Specifications
```css
.dashboard-card {
  /* Base styling */
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--card);
  padding: 24px;
  
  /* Hover effects */
  transition: all 0.3s ease;
  &:hover {
    transform: scale(1.02);
    border-color: var(--foreground);
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  }
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    padding: 16px;
  }
}
```

### Grid Layout
```css
.dashboard-grid {
  display: grid;
  gap: 24px;
  
  /* Mobile: 1 column */
  grid-template-columns: 1fr;
  
  /* Tablet: 2 columns */
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  /* Desktop: 3 columns */
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## Navigation Integration

### Route Structure
- **Dashboard Route**: `/dashboard` - Main dashboard page
- **Existing Routes**: Keep all existing feature routes unchanged
- **Navigation Updates**: Update main navigation to include dashboard link

### Navigation Behavior
- **Dashboard as Home**: Consider making dashboard the default authenticated landing page
- **Breadcrumb Support**: Add breadcrumb navigation for better UX
- **Back Navigation**: Ensure proper back button behavior from feature pages