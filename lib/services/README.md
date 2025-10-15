# Sports Data Integration System

This system provides real-world sports data integration for the ShotCaller fantasy game, including NBA and NFL player statistics, fantasy scoring calculations, and data caching mechanisms.

## Architecture Overview

The sports data integration consists of several key components:

1. **Data Providers** - Interface with external sports APIs
2. **Scoring Engine** - Calculate fantasy points based on real stats
3. **Caching System** - Optimize performance and reduce API calls
4. **Sync Service** - Manage data synchronization jobs
5. **Integration Service** - Coordinate all components

## Components

### Data Providers

#### NBAStatsProvider
- Integrates with Ball Don't Lie API for NBA statistics
- Fetches player stats, game data, and team information
- Transforms API data into standardized format

#### NFLStatsProvider  
- Integrates with SportsData.io API for NFL statistics
- Handles passing, rushing, receiving, and defensive stats
- Supports various player positions and stat categories

### Fantasy Scoring Engine

Calculates fantasy points based on configurable scoring rules:

**NBA Scoring Rules:**
- Points: 1 point per point scored
- Rebounds: 1.2 points per rebound
- Assists: 1.5 points per assist
- Steals: 3 points per steal
- Blocks: 3 points per block
- Turnovers: -1 point per turnover
- 3-Pointers Made: 0.5 bonus points

**NFL Scoring Rules:**
- Passing Yards: 1 point per 25 yards
- Passing TDs: 4 points each
- Interceptions: -2 points each
- Rushing Yards: 1 point per 10 yards
- Rushing TDs: 6 points each
- Receiving Yards: 1 point per 10 yards
- Receiving TDs: 6 points each
- Receptions: 0.5 points each (PPR)

### Caching System

- In-memory cache with configurable TTL
- Automatic cleanup of expired entries
- Cache statistics and hit/miss tracking
- Support for individual player stats and daily aggregates

### Data Sync Service

- Scheduled daily synchronization jobs
- Manual sync capabilities with force refresh
- Error handling and retry logic
- Job status tracking and monitoring

## API Endpoints

### GET /api/sports-data/daily-stats
Fetch daily statistics for all players in a sport.

**Parameters:**
- `sport`: 'NBA' or 'NFL'
- `date`: YYYY-MM-DD format (optional, defaults to today)

### GET /api/sports-data/player-stats
Fetch statistics for a specific player.

**Parameters:**
- `playerId`: Player identifier
- `sport`: 'NBA' or 'NFL'
- `date`: YYYY-MM-DD format (optional, defaults to today)

### POST /api/sports-data/lineup-scores
Calculate fantasy scores for lineups.

**Body:**
```json
{
  "lineups": [
    {
      "id": "lineup1",
      "playerIds": ["player1", "player2", "player3"]
    }
  ],
  "date": "2024-01-15"
}
```

### GET /api/sports-data/sync-status
Get current sync job status and cache statistics.

### DELETE /api/sports-data/sync-status?clearCache=true
Clear all cached data.

## React Hooks

### useSportsData()
Main hook for sports data operations:
- `fetchDailyStats(sport, date)`
- `fetchPlayerStats(playerId, sport, date)`
- `calculateLineupScores(lineups, date)`
- `syncDailyStats(sport, date, force)`
- `getSyncStatus()`
- `clearCache()`

### usePlayerStats(playerId, sport, date)
Hook for individual player statistics with automatic loading.

### useDailyStats(sport, date)
Hook for daily statistics with automatic loading.

## Configuration

### Environment Variables

```env
# NBA API Configuration
NBA_API_KEY=your_nba_api_key_here
NBA_API_BASE_URL=https://api.balldontlie.io/v1

# NFL API Configuration  
NFL_API_KEY=your_nfl_api_key_here
NFL_API_BASE_URL=https://api.sportsdata.io/v3/nfl

# Cache Configuration
CACHE_TTL_MS=3600000  # 1 hour default
```

### API Key Setup

1. **NBA Stats**: Register at [Ball Don't Lie API](https://www.balldontlie.io/)
2. **NFL Stats**: Register at [SportsData.io](https://sportsdata.io/)

## Usage Examples

### Initialize the System

```typescript
import { sportsDataIntegration } from '@/lib/services/sports-data-integration';

// Initialize the system
await sportsDataIntegration.initialize();
```

### Fetch Player Stats

```typescript
const playerStats = await sportsDataIntegration.getPlayerStats(
  'player123', 
  'NBA', 
  new Date('2024-01-15')
);
```

### Calculate Lineup Scores

```typescript
const lineups = [
  { id: 'lineup1', playerIds: ['player1', 'player2', 'player3'] }
];

const scores = await sportsDataIntegration.calculateLineupScores(
  lineups, 
  new Date('2024-01-15')
);
```

### Using React Hooks

```typescript
function PlayerStatsComponent({ playerId }: { playerId: string }) {
  const { stats, loading, error } = usePlayerStats(playerId, 'NBA');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return <div>No stats found</div>;
  
  return (
    <div>
      <h3>{stats.playerName}</h3>
      <p>Fantasy Points: {stats.fantasyPoints}</p>
    </div>
  );
}
```

## Error Handling

The system includes comprehensive error handling:

- API connection failures with fallback mechanisms
- Invalid data validation and sanitization
- Cache corruption recovery
- Network timeout handling
- Rate limiting compliance

## Performance Considerations

- Caching reduces API calls and improves response times
- Batch operations for multiple player queries
- Automatic cleanup of expired cache entries
- Configurable TTL based on data freshness requirements
- Background sync jobs to pre-populate cache

## Testing

The system includes a test component (`SportsDataTest`) that allows you to:
- Test API connections
- Sync daily stats for different sports and dates
- View cached data and statistics
- Clear cache and force refresh data
- Monitor sync job status

## Future Enhancements

- Database integration for persistent storage
- Real-time data streaming for live games
- Advanced analytics and projections
- Machine learning for performance predictions
- Multi-sport lineup optimization
- Historical data analysis and trends