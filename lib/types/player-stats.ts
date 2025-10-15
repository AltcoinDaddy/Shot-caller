export interface PlayerStats {
  id: string;
  playerName: string;
  gameDate: Date;
  sport: 'NBA' | 'NFL';
  team: string;
  opponent: string;
  gameStatus: 'scheduled' | 'in_progress' | 'completed' | 'postponed';
  stats: NBAStats | NFLStats;
  fantasyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NBAStats {
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  personalFouls: number;
  plusMinus: number;
}

export interface NFLStats {
  // Passing stats
  passingYards: number;
  passingTouchdowns: number;
  interceptions: number;
  completions: number;
  attempts: number;
  
  // Rushing stats
  rushingYards: number;
  rushingTouchdowns: number;
  rushingAttempts: number;
  
  // Receiving stats
  receivingYards: number;
  receivingTouchdowns: number;
  receptions: number;
  targets: number;
  
  // Defensive stats
  tackles: number;
  sacks: number;
  forcedFumbles: number;
  interceptionsCaught: number;
  
  // Special teams
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  extraPointsMade: number;
  extraPointsAttempted: number;
}

export interface FantasyScoring {
  sport: 'NBA' | 'NFL';
  rules: ScoringRule[];
}

export interface ScoringRule {
  statName: string;
  pointsPerUnit: number;
  description: string;
}

export const NBA_SCORING_RULES: ScoringRule[] = [
  { statName: 'points', pointsPerUnit: 1, description: '1 point per point scored' },
  { statName: 'rebounds', pointsPerUnit: 1.2, description: '1.2 points per rebound' },
  { statName: 'assists', pointsPerUnit: 1.5, description: '1.5 points per assist' },
  { statName: 'steals', pointsPerUnit: 3, description: '3 points per steal' },
  { statName: 'blocks', pointsPerUnit: 3, description: '3 points per block' },
  { statName: 'turnovers', pointsPerUnit: -1, description: '-1 point per turnover' },
  { statName: 'threePointersMade', pointsPerUnit: 0.5, description: '0.5 bonus points per 3PM' }
];

export const NFL_SCORING_RULES: ScoringRule[] = [
  { statName: 'passingYards', pointsPerUnit: 0.04, description: '1 point per 25 passing yards' },
  { statName: 'passingTouchdowns', pointsPerUnit: 4, description: '4 points per passing TD' },
  { statName: 'interceptions', pointsPerUnit: -2, description: '-2 points per interception thrown' },
  { statName: 'rushingYards', pointsPerUnit: 0.1, description: '1 point per 10 rushing yards' },
  { statName: 'rushingTouchdowns', pointsPerUnit: 6, description: '6 points per rushing TD' },
  { statName: 'receivingYards', pointsPerUnit: 0.1, description: '1 point per 10 receiving yards' },
  { statName: 'receivingTouchdowns', pointsPerUnit: 6, description: '6 points per receiving TD' },
  { statName: 'receptions', pointsPerUnit: 0.5, description: '0.5 points per reception (PPR)' },
  { statName: 'fieldGoalsMade', pointsPerUnit: 3, description: '3 points per field goal' },
  { statName: 'extraPointsMade', pointsPerUnit: 1, description: '1 point per extra point' }
];