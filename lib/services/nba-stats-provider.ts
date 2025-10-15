import { SportsDataProvider } from './sports-data-service';
import { PlayerStats, NBAStats, NBA_SCORING_RULES } from '@/lib/types/player-stats';

export class NBAStatsProvider implements SportsDataProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.NBA_API_KEY || '';
    this.baseUrl = process.env.NBA_API_BASE_URL || 'https://api.balldontlie.io/v1';
  }

  async validateApiConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/players?per_page=1`, {
        headers: {
          'Authorization': this.apiKey
        }
      });
      return response.ok;
    } catch (error) {
      console.error('NBA API connection validation failed:', error);
      return false;
    }
  }

  async fetchPlayerStats(playerId: string, date: Date): Promise<PlayerStats | null> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(
        `${this.baseUrl}/stats?player_ids[]=${playerId}&dates[]=${dateStr}`,
        {
          headers: {
            'Authorization': this.apiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`NBA API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        return null;
      }

      const gameStats = data.data[0];
      return this.transformToPlayerStats(gameStats, date);
    } catch (error) {
      console.error('Error fetching NBA player stats:', error);
      return null;
    }
  }

  async fetchDailyStats(date: Date): Promise<PlayerStats[]> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(
        `${this.baseUrl}/stats?dates[]=${dateStr}&per_page=100`,
        {
          headers: {
            'Authorization': this.apiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`NBA API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.data.map((gameStats: any) => 
        this.transformToPlayerStats(gameStats, date)
      );
    } catch (error) {
      console.error('Error fetching NBA daily stats:', error);
      return [];
    }
  }

  private transformToPlayerStats(apiData: any, gameDate: Date): PlayerStats {
    const nbaStats: NBAStats = {
      minutes: apiData.min ? this.parseMinutes(apiData.min) : 0,
      points: apiData.pts || 0,
      rebounds: (apiData.reb || 0),
      assists: apiData.ast || 0,
      steals: apiData.stl || 0,
      blocks: apiData.blk || 0,
      turnovers: apiData.turnover || 0,
      fieldGoalsMade: apiData.fgm || 0,
      fieldGoalsAttempted: apiData.fga || 0,
      threePointersMade: apiData.fg3m || 0,
      threePointersAttempted: apiData.fg3a || 0,
      freeThrowsMade: apiData.ftm || 0,
      freeThrowsAttempted: apiData.fta || 0,
      personalFouls: apiData.pf || 0,
      plusMinus: apiData.plus_minus || 0
    };

    const fantasyPoints = this.calculateFantasyPoints(nbaStats);

    return {
      id: `nba_${apiData.player.id}_${gameDate.toISOString().split('T')[0]}`,
      playerName: `${apiData.player.first_name} ${apiData.player.last_name}`,
      gameDate,
      sport: 'NBA',
      team: apiData.team.abbreviation,
      opponent: apiData.game.home_team_id === apiData.team.id 
        ? apiData.game.visitor_team.abbreviation 
        : apiData.game.home_team.abbreviation,
      gameStatus: this.mapGameStatus(apiData.game.status),
      stats: nbaStats,
      fantasyPoints,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private calculateFantasyPoints(stats: NBAStats): number {
    let points = 0;
    
    NBA_SCORING_RULES.forEach(rule => {
      const statValue = (stats as any)[rule.statName] || 0;
      points += statValue * rule.pointsPerUnit;
    });

    return Math.round(points * 10) / 10; // Round to 1 decimal place
  }

  private parseMinutes(minutesStr: string): number {
    if (!minutesStr) return 0;
    const parts = minutesStr.split(':');
    return parseInt(parts[0]) + (parseInt(parts[1]) / 60);
  }

  private mapGameStatus(status: string): 'scheduled' | 'in_progress' | 'completed' | 'postponed' {
    switch (status?.toLowerCase()) {
      case 'final':
        return 'completed';
      case 'in progress':
      case 'halftime':
        return 'in_progress';
      case 'postponed':
        return 'postponed';
      default:
        return 'scheduled';
    }
  }
}