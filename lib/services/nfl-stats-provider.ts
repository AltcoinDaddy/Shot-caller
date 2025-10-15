import { SportsDataProvider } from './sports-data-service';
import { PlayerStats, NFLStats, NFL_SCORING_RULES } from '@/lib/types/player-stats';

export class NFLStatsProvider implements SportsDataProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.NFL_API_KEY || '';
    this.baseUrl = process.env.NFL_API_BASE_URL || 'https://api.sportsdata.io/v3/nfl';
  }

  async validateApiConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/scores/json/CurrentSeason?key=${this.apiKey}`);
      return response.ok;
    } catch (error) {
      console.error('NFL API connection validation failed:', error);
      return false;
    }
  }

  async fetchPlayerStats(playerId: string, date: Date): Promise<PlayerStats | null> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(
        `${this.baseUrl}/stats/json/PlayerGameStatsByDate/${dateStr}?key=${this.apiKey}`,
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error(`NFL API error: ${response.status}`);
      }

      const data = await response.json();
      
      const playerStats = data.find((stats: any) => stats.PlayerID.toString() === playerId);
      
      if (!playerStats) {
        return null;
      }

      return this.transformToPlayerStats(playerStats, date);
    } catch (error) {
      console.error('Error fetching NFL player stats:', error);
      return null;
    }
  }

  async fetchDailyStats(date: Date): Promise<PlayerStats[]> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(
        `${this.baseUrl}/stats/json/PlayerGameStatsByDate/${dateStr}?key=${this.apiKey}`,
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error(`NFL API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((playerStats: any) => 
        this.transformToPlayerStats(playerStats, date)
      );
    } catch (error) {
      console.error('Error fetching NFL daily stats:', error);
      return [];
    }
  }

  private transformToPlayerStats(apiData: any, gameDate: Date): PlayerStats {
    const nflStats: NFLStats = {
      // Passing stats
      passingYards: apiData.PassingYards || 0,
      passingTouchdowns: apiData.PassingTouchdowns || 0,
      interceptions: apiData.PassingInterceptions || 0,
      completions: apiData.PassingCompletions || 0,
      attempts: apiData.PassingAttempts || 0,
      
      // Rushing stats
      rushingYards: apiData.RushingYards || 0,
      rushingTouchdowns: apiData.RushingTouchdowns || 0,
      rushingAttempts: apiData.RushingAttempts || 0,
      
      // Receiving stats
      receivingYards: apiData.ReceivingYards || 0,
      receivingTouchdowns: apiData.ReceivingTouchdowns || 0,
      receptions: apiData.Receptions || 0,
      targets: apiData.ReceivingTargets || 0,
      
      // Defensive stats
      tackles: apiData.Tackles || 0,
      sacks: apiData.Sacks || 0,
      forcedFumbles: apiData.FumblesForced || 0,
      interceptionsCaught: apiData.InterceptionsCaught || 0,
      
      // Special teams
      fieldGoalsMade: apiData.FieldGoalsMade || 0,
      fieldGoalsAttempted: apiData.FieldGoalsAttempted || 0,
      extraPointsMade: apiData.ExtraPointsMade || 0,
      extraPointsAttempted: apiData.ExtraPointsAttempted || 0
    };

    const fantasyPoints = this.calculateFantasyPoints(nflStats);

    return {
      id: `nfl_${apiData.PlayerID}_${gameDate.toISOString().split('T')[0]}`,
      playerName: apiData.Name || `${apiData.FirstName} ${apiData.LastName}`,
      gameDate,
      sport: 'NFL',
      team: apiData.Team,
      opponent: apiData.Opponent,
      gameStatus: this.mapGameStatus(apiData.GameStatus),
      stats: nflStats,
      fantasyPoints,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private calculateFantasyPoints(stats: NFLStats): number {
    let points = 0;
    
    NFL_SCORING_RULES.forEach(rule => {
      const statValue = (stats as any)[rule.statName] || 0;
      points += statValue * rule.pointsPerUnit;
    });

    return Math.round(points * 10) / 10; // Round to 1 decimal place
  }

  private mapGameStatus(status: string): 'scheduled' | 'in_progress' | 'completed' | 'postponed' {
    switch (status?.toLowerCase()) {
      case 'final':
      case 'f':
        return 'completed';
      case 'inprogress':
      case 'in progress':
        return 'in_progress';
      case 'postponed':
      case 'ppd':
        return 'postponed';
      default:
        return 'scheduled';
    }
  }
}