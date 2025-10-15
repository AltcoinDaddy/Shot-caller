import { PlayerStats, NBAStats, NFLStats, NBA_SCORING_RULES, NFL_SCORING_RULES, ScoringRule } from '@/lib/types/player-stats';

export interface LineupScore {
  lineupId: string;
  totalPoints: number;
  playerScores: PlayerScore[];
  calculatedAt: Date;
}

export interface PlayerScore {
  playerId: string;
  playerName: string;
  sport: 'NBA' | 'NFL';
  fantasyPoints: number;
  stats: NBAStats | NFLStats;
  breakdown: ScoreBreakdown[];
}

export interface ScoreBreakdown {
  statName: string;
  statValue: number;
  pointsPerUnit: number;
  totalPoints: number;
  description: string;
}

export class FantasyScoringEngine {
  
  /**
   * Calculate fantasy points for a single player's stats
   */
  calculatePlayerScore(playerStats: PlayerStats): PlayerScore {
    const rules = playerStats.sport === 'NBA' ? NBA_SCORING_RULES : NFL_SCORING_RULES;
    const breakdown = this.calculateScoreBreakdown(playerStats.stats, rules);
    const totalPoints = breakdown.reduce((sum, item) => sum + item.totalPoints, 0);

    return {
      playerId: playerStats.id,
      playerName: playerStats.playerName,
      sport: playerStats.sport,
      fantasyPoints: Math.round(totalPoints * 10) / 10,
      stats: playerStats.stats,
      breakdown
    };
  }

  /**
   * Calculate total lineup score from multiple player stats
   */
  calculateLineupScore(lineupId: string, playerStats: PlayerStats[]): LineupScore {
    const playerScores = playerStats.map(stats => this.calculatePlayerScore(stats));
    const totalPoints = playerScores.reduce((sum, player) => sum + player.fantasyPoints, 0);

    return {
      lineupId,
      totalPoints: Math.round(totalPoints * 10) / 10,
      playerScores,
      calculatedAt: new Date()
    };
  }

  /**
   * Calculate weekly scores for multiple lineups
   */
  calculateWeeklyScores(lineups: Array<{ id: string; playerStats: PlayerStats[] }>): LineupScore[] {
    return lineups.map(lineup => 
      this.calculateLineupScore(lineup.id, lineup.playerStats)
    );
  }

  /**
   * Get detailed score breakdown for a player
   */
  private calculateScoreBreakdown(stats: NBAStats | NFLStats, rules: ScoringRule[]): ScoreBreakdown[] {
    return rules.map(rule => {
      const statValue = (stats as any)[rule.statName] || 0;
      const totalPoints = statValue * rule.pointsPerUnit;

      return {
        statName: rule.statName,
        statValue,
        pointsPerUnit: rule.pointsPerUnit,
        totalPoints: Math.round(totalPoints * 10) / 10,
        description: rule.description
      };
    }).filter(breakdown => breakdown.statValue > 0 || breakdown.totalPoints !== 0);
  }

  /**
   * Apply booster effects to a lineup score
   */
  applyBoosterEffects(lineupScore: LineupScore, boosters: BoosterEffect[]): LineupScore {
    let modifiedScore = { ...lineupScore };
    let appliedEffects: string[] = [];
    
    boosters.forEach(booster => {
      switch (booster.type) {
        case 'score_multiplier':
          const originalPoints = modifiedScore.totalPoints;
          modifiedScore.totalPoints *= booster.value;
          const bonusPoints = modifiedScore.totalPoints - originalPoints;
          appliedEffects.push(`${booster.description}: +${bonusPoints.toFixed(1)} points`);
          break;
          
        case 'random_bonus':
          // Random bonus between 5 and the specified value
          const minBonus = 5;
          const randomBonus = minBonus + Math.random() * (booster.value - minBonus);
          modifiedScore.totalPoints += randomBonus;
          appliedEffects.push(`${booster.description}: +${randomBonus.toFixed(1)} points`);
          break;
          
        case 'extra_points':
          modifiedScore.totalPoints += booster.value;
          appliedEffects.push(`${booster.description}: +${booster.value} points`);
          break;
          
        case 'lineup_protection':
          // Lineup protection prevents negative scores from affecting total
          if (modifiedScore.totalPoints < 0) {
            modifiedScore.totalPoints = Math.max(0, modifiedScore.totalPoints);
            appliedEffects.push(`${booster.description}: Protected from negative score`);
          }
          break;
      }
    });

    modifiedScore.totalPoints = Math.round(modifiedScore.totalPoints * 10) / 10;
    
    // Add booster effects to the score object for display
    (modifiedScore as any).boosterEffects = appliedEffects;
    
    return modifiedScore;
  }

  /**
   * Calculate lineup score with booster effects
   */
  async calculateLineupScoreWithBoosters(
    lineupId: string, 
    playerStats: PlayerStats[], 
    userAddress: string
  ): Promise<LineupScore> {
    // Calculate base score
    const baseScore = this.calculateLineupScore(lineupId, playerStats);
    
    try {
      // Import booster service dynamically to avoid circular dependencies
      const { boosterService } = await import('./booster-service');
      
      // Get active booster effects
      const boosterEffects = await boosterService.getBoosterEffectsForLineup(userAddress, lineupId);
      
      if (boosterEffects.length === 0) {
        return baseScore;
      }
      
      // Apply booster effects
      return this.applyBoosterEffects(baseScore, boosterEffects);
    } catch (error) {
      console.warn('Failed to apply booster effects:', error);
      return baseScore;
    }
  }

  /**
   * Validate scoring rules and stats compatibility
   */
  validateScoringRules(sport: 'NBA' | 'NFL'): boolean {
    const rules = sport === 'NBA' ? NBA_SCORING_RULES : NFL_SCORING_RULES;
    
    // Check for duplicate stat names
    const statNames = rules.map(rule => rule.statName);
    const uniqueStatNames = new Set(statNames);
    
    if (statNames.length !== uniqueStatNames.size) {
      console.error(`Duplicate scoring rules found for ${sport}`);
      return false;
    }

    // Validate point values are numbers
    const invalidRules = rules.filter(rule => 
      typeof rule.pointsPerUnit !== 'number' || isNaN(rule.pointsPerUnit)
    );

    if (invalidRules.length > 0) {
      console.error(`Invalid point values in ${sport} scoring rules:`, invalidRules);
      return false;
    }

    return true;
  }
}

export interface BoosterEffect {
  type: 'score_multiplier' | 'random_bonus' | 'extra_points';
  value: number;
  description: string;
}