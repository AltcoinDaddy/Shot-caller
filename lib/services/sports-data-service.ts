import { PlayerStats } from '@/lib/types/player-stats';

export interface SportsDataProvider {
  fetchPlayerStats(playerId: string, date: Date): Promise<PlayerStats | null>;
  fetchDailyStats(date: Date): Promise<PlayerStats[]>;
  validateApiConnection(): Promise<boolean>;
}

export class SportsDataService {
  private nbaProvider: SportsDataProvider;
  private nflProvider: SportsDataProvider;

  constructor(nbaProvider: SportsDataProvider, nflProvider: SportsDataProvider) {
    this.nbaProvider = nbaProvider;
    this.nflProvider = nflProvider;
  }

  async fetchPlayerStats(playerId: string, sport: 'NBA' | 'NFL', date: Date): Promise<PlayerStats | null> {
    const provider = sport === 'NBA' ? this.nbaProvider : this.nflProvider;
    return provider.fetchPlayerStats(playerId, date);
  }

  async fetchDailyStats(sport: 'NBA' | 'NFL', date: Date): Promise<PlayerStats[]> {
    const provider = sport === 'NBA' ? this.nbaProvider : this.nflProvider;
    return provider.fetchDailyStats(date);
  }

  async validateConnections(): Promise<{ nba: boolean; nfl: boolean }> {
    const [nbaValid, nflValid] = await Promise.all([
      this.nbaProvider.validateApiConnection(),
      this.nflProvider.validateApiConnection()
    ]);

    return { nba: nbaValid, nfl: nflValid };
  }
}