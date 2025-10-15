import { FantasyScoringEngine } from '../fantasy-scoring-engine';
import { PlayerStats, NBAStats, NFLStats } from '@/lib/types/player-stats';

describe('FantasyScoringEngine', () => {
  let scoringEngine: FantasyScoringEngine;

  beforeEach(() => {
    scoringEngine = new FantasyScoringEngine();
  });

  describe('NBA Scoring', () => {
    it('should calculate NBA player score correctly', () => {
      const nbaStats: NBAStats = {
        minutes: 32,
        points: 25,
        rebounds: 8,
        assists: 6,
        steals: 2,
        blocks: 1,
        turnovers: 3,
        fieldGoalsMade: 10,
        fieldGoalsAttempted: 18,
        threePointersMade: 3,
        threePointersAttempted: 7,
        freeThrowsMade: 2,
        freeThrowsAttempted: 2,
        personalFouls: 2,
        plusMinus: 12
      };

      const playerStats: PlayerStats = {
        id: 'test_player_1',
        playerName: 'Test Player',
        gameDate: new Date(),
        sport: 'NBA',
        team: 'TEST',
        opponent: 'OPP',
        gameStatus: 'completed',
        stats: nbaStats,
        fantasyPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const playerScore = scoringEngine.calculatePlayerScore(playerStats);

      // Expected calculation:
      // Points: 25 * 1 = 25
      // Rebounds: 8 * 1.2 = 9.6
      // Assists: 6 * 1.5 = 9
      // Steals: 2 * 3 = 6
      // Blocks: 1 * 3 = 3
      // Turnovers: 3 * -1 = -3
      // 3PM: 3 * 0.5 = 1.5
      // Total: 25 + 9.6 + 9 + 6 + 3 - 3 + 1.5 = 51.1

      expect(playerScore.fantasyPoints).toBe(51.1);
      expect(playerScore.sport).toBe('NBA');
      expect(playerScore.breakdown).toHaveLength(7);
    });

    it('should handle zero stats correctly', () => {
      const nbaStats: NBAStats = {
        minutes: 0,
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        threePointersMade: 0,
        threePointersAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        personalFouls: 0,
        plusMinus: 0
      };

      const playerStats: PlayerStats = {
        id: 'test_player_2',
        playerName: 'Bench Player',
        gameDate: new Date(),
        sport: 'NBA',
        team: 'TEST',
        opponent: 'OPP',
        gameStatus: 'completed',
        stats: nbaStats,
        fantasyPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const playerScore = scoringEngine.calculatePlayerScore(playerStats);
      expect(playerScore.fantasyPoints).toBe(0);
    });
  });

  describe('NFL Scoring', () => {
    it('should calculate NFL player score correctly', () => {
      const nflStats: NFLStats = {
        passingYards: 300,
        passingTouchdowns: 2,
        interceptions: 1,
        completions: 22,
        attempts: 35,
        rushingYards: 50,
        rushingTouchdowns: 1,
        rushingAttempts: 8,
        receivingYards: 0,
        receivingTouchdowns: 0,
        receptions: 0,
        targets: 0,
        tackles: 0,
        sacks: 0,
        forcedFumbles: 0,
        interceptionsCaught: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        extraPointsMade: 0,
        extraPointsAttempted: 0
      };

      const playerStats: PlayerStats = {
        id: 'test_player_3',
        playerName: 'Test QB',
        gameDate: new Date(),
        sport: 'NFL',
        team: 'TEST',
        opponent: 'OPP',
        gameStatus: 'completed',
        stats: nflStats,
        fantasyPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const playerScore = scoringEngine.calculatePlayerScore(playerStats);

      // Expected calculation:
      // Passing Yards: 300 * 0.04 = 12
      // Passing TDs: 2 * 4 = 8
      // Interceptions: 1 * -2 = -2
      // Rushing Yards: 50 * 0.1 = 5
      // Rushing TDs: 1 * 6 = 6
      // Total: 12 + 8 - 2 + 5 + 6 = 29

      expect(playerScore.fantasyPoints).toBe(29);
      expect(playerScore.sport).toBe('NFL');
    });
  });

  describe('Lineup Scoring', () => {
    it('should calculate lineup score from multiple players', () => {
      const nbaPlayer: PlayerStats = {
        id: 'nba_1',
        playerName: 'NBA Player',
        gameDate: new Date(),
        sport: 'NBA',
        team: 'NBA',
        opponent: 'OPP',
        gameStatus: 'completed',
        stats: {
          minutes: 30,
          points: 20,
          rebounds: 5,
          assists: 5,
          steals: 1,
          blocks: 1,
          turnovers: 2,
          fieldGoalsMade: 8,
          fieldGoalsAttempted: 15,
          threePointersMade: 2,
          threePointersAttempted: 5,
          freeThrowsMade: 2,
          freeThrowsAttempted: 2,
          personalFouls: 2,
          plusMinus: 8
        } as NBAStats,
        fantasyPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const nflPlayer: PlayerStats = {
        id: 'nfl_1',
        playerName: 'NFL Player',
        gameDate: new Date(),
        sport: 'NFL',
        team: 'NFL',
        opponent: 'OPP',
        gameStatus: 'completed',
        stats: {
          passingYards: 250,
          passingTouchdowns: 2,
          interceptions: 0,
          completions: 20,
          attempts: 30,
          rushingYards: 25,
          rushingTouchdowns: 0,
          rushingAttempts: 5,
          receivingYards: 0,
          receivingTouchdowns: 0,
          receptions: 0,
          targets: 0,
          tackles: 0,
          sacks: 0,
          forcedFumbles: 0,
          interceptionsCaught: 0,
          fieldGoalsMade: 0,
          fieldGoalsAttempted: 0,
          extraPointsMade: 0,
          extraPointsAttempted: 0
        } as NFLStats,
        fantasyPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const lineupScore = scoringEngine.calculateLineupScore('test_lineup', [nbaPlayer, nflPlayer]);

      expect(lineupScore.lineupId).toBe('test_lineup');
      expect(lineupScore.playerScores).toHaveLength(2);
      expect(lineupScore.totalPoints).toBeGreaterThan(0);
      expect(lineupScore.calculatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Booster Effects', () => {
    it('should apply score multiplier booster correctly', () => {
      const baseLineupScore = {
        lineupId: 'test',
        totalPoints: 100,
        playerScores: [],
        calculatedAt: new Date()
      };

      const boosters = [{
        type: 'score_multiplier' as const,
        value: 1.1,
        description: '10% score boost'
      }];

      const boostedScore = scoringEngine.applyBoosterEffects(baseLineupScore, boosters);
      expect(boostedScore.totalPoints).toBe(110);
    });

    it('should apply extra points booster correctly', () => {
      const baseLineupScore = {
        lineupId: 'test',
        totalPoints: 100,
        playerScores: [],
        calculatedAt: new Date()
      };

      const boosters = [{
        type: 'extra_points' as const,
        value: 25,
        description: '25 bonus points'
      }];

      const boostedScore = scoringEngine.applyBoosterEffects(baseLineupScore, boosters);
      expect(boostedScore.totalPoints).toBe(125);
    });
  });

  describe('Scoring Rules Validation', () => {
    it('should validate NBA scoring rules', () => {
      const isValid = scoringEngine.validateScoringRules('NBA');
      expect(isValid).toBe(true);
    });

    it('should validate NFL scoring rules', () => {
      const isValid = scoringEngine.validateScoringRules('NFL');
      expect(isValid).toBe(true);
    });
  });
});