// Lineup Management and Smart Contract Integration Service

import { fcl } from '@/lib/flow-config';
import { NFTMoment } from '@/lib/types/nft';
import { nftOwnershipService } from './nft-ownership-service';
import { databaseService } from './database-service';

export interface LineupSubmission {
  contestId: number;
  nftIds: number[];
  playerAddress: string;
  submittedAt: Date;
}

export interface LineupValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ContestInfo {
  id: number;
  weekId: number;
  startTime: Date;
  endTime: Date;
  status: 'Upcoming' | 'Active' | 'Scoring' | 'Completed' | 'Cancelled';
  totalParticipants: number;
  rewardPool: number;
  isActive: boolean;
}

export class LineupService {
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  /**
   * Validate lineup before submission
   */
  async validateLineup(
    playerAddress: string,
    nftIds: number[],
    contestId?: number
  ): Promise<LineupValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (nftIds.length === 0) {
      errors.push('At least 1 NFT is required in the lineup');
    }

    if (nftIds.length > 5) {
      errors.push('Maximum 5 NFTs allowed in lineup');
    }

    // Check for duplicates
    const uniqueIds = new Set(nftIds);
    if (uniqueIds.size !== nftIds.length) {
      errors.push('Duplicate NFTs are not allowed in lineup');
    }

    // Verify NFT ownership with enhanced validation
    try {
      // Use Dapper Wallet specific verification for better accuracy
      const ownership = await nftOwnershipService.verifyDapperWalletOwnership(playerAddress);
      if (!ownership.success || !ownership.data) {
        errors.push('Unable to verify NFT ownership - please ensure your Dapper Wallet is connected');
        return { isValid: false, errors, warnings };
      }

      const ownedMomentIds = new Set(
        ownership.data.moments.map(moment => moment.momentId)
      );

      // Verify each NFT individually
      const verificationPromises = nftIds.map(async (nftId) => {
        if (!ownedMomentIds.has(nftId)) {
          return { nftId, owned: false, error: 'Not found in collection' };
        }

        // Find the moment to determine collection type
        const moment = ownership.data!.moments.find(m => m.momentId === nftId);
        if (!moment) {
          return { nftId, owned: false, error: 'Moment not found' };
        }

        // Double-check ownership via blockchain
        const collection = moment.sport === 'NBA' ? 'TopShot' : 'AllDay';
        const verification = await nftOwnershipService.verifyMomentOwnership(
          playerAddress,
          collection,
          nftId
        );

        return { 
          nftId, 
          owned: verification.isValid, 
          error: verification.error,
          moment 
        };
      });

      const verificationResults = await Promise.all(verificationPromises);
      const eligibleMoments: any[] = [];

      for (const result of verificationResults) {
        if (!result.owned) {
          errors.push(`NFT #${result.nftId} is not owned by this address: ${result.error || 'Ownership verification failed'}`);
        } else if (result.moment && (result.moment.sport === 'NBA' || result.moment.sport === 'NFL')) {
          eligibleMoments.push(result.moment);
        } else {
          errors.push(`NFT #${result.nftId} is not eligible for gameplay (must be NBA Top Shot or NFL All Day)`);
        }
      }

      // Sport balance analysis
      const nbaCount = eligibleMoments.filter(m => m.sport === 'NBA').length;
      const nflCount = eligibleMoments.filter(m => m.sport === 'NFL').length;
      
      if (nbaCount === 0 && nflCount > 0) {
        warnings.push('Consider adding NBA players for better scoring opportunities during basketball season');
      } else if (nflCount === 0 && nbaCount > 0) {
        warnings.push('Consider adding NFL players for better scoring opportunities during football season');
      }

      // Rarity analysis
      const rarityCount = eligibleMoments.reduce((acc, moment) => {
        acc[moment.rarity] = (acc[moment.rarity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      if (rarityCount['Legendary'] || rarityCount['Epic']) {
        warnings.push('You have rare moments in your lineup - they may provide bonus scoring opportunities!');
      }

    } catch (error) {
      errors.push(`Failed to verify NFT ownership: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Contest-specific validation
    if (contestId) {
      try {
        const contest = await this.getContestInfo(contestId);
        if (!contest) {
          errors.push('Contest not found');
        } else if (!contest.isActive) {
          errors.push('Contest is not currently active');
        } else {
          const now = new Date();
          if (now > contest.endTime) {
            errors.push('Contest submission deadline has passed');
          }
        }
      } catch (error) {
        warnings.push('Unable to verify contest status');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Submit lineup to smart contract
   */
  async submitLineup(
    contestId: number,
    nftIds: number[]
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Validate lineup first
      const currentUser = await fcl.currentUser.snapshot();
      if (!currentUser.loggedIn || !currentUser.addr) {
        return { success: false, error: 'User not authenticated' };
      }

      const validation = await this.validateLineup(currentUser.addr, nftIds, contestId);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: `Lineup validation failed: ${validation.errors.join(', ')}` 
        };
      }

      // Save lineup to local database first
      const lineupId = await databaseService.saveLineup({
        contestId,
        playerAddress: currentUser.addr,
        nftIds,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      });

      try {
        // Submit to smart contract with enhanced error handling
        const transactionId = await fcl.mutate({
          cadence: this.getSubmitLineupTransaction(),
          args: (arg: any, t: any) => [
            arg(contestId, t.UInt64),
            arg(nftIds, t.Array(t.UInt64))
          ],
          proposer: fcl.currentUser,
          payer: fcl.currentUser,
          authorizations: [fcl.currentUser],
          limit: 1000
        });

        // Wait for transaction to be sealed with timeout
        const transaction = await Promise.race([
          fcl.tx(transactionId).onceSealed(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transaction timeout')), 30000)
          )
        ]) as any;
        
        if (transaction.status === 4) { // SEALED
          // Verify the lineup was actually submitted to the contract
          const verificationResult = await this.verifyLineupSubmission(contestId, currentUser.addr, nftIds);
          
          if (verificationResult.success) {
            await databaseService.updateLineupStatus(lineupId, 'confirmed', transactionId);
            return { success: true, transactionId };
          } else {
            await databaseService.updateLineupStatus(lineupId, 'failed');
            return { 
              success: false, 
              error: 'Lineup submission could not be verified on blockchain' 
            };
          }
        } else {
          await databaseService.updateLineupStatus(lineupId, 'failed');
          return { 
            success: false, 
            error: `Transaction failed with status: ${transaction.status}` 
          };
        }
      } catch (contractError) {
        console.warn('Smart contract submission failed:', contractError);
        
        // In development mode, allow local-only storage
        if (process.env.NODE_ENV === 'development') {
          await databaseService.updateLineupStatus(lineupId, 'confirmed', 'local_only');
          return { 
            success: true, 
            transactionId: 'local_only',
          };
        } else {
          // In production, this is a failure
          await databaseService.updateLineupStatus(lineupId, 'failed');
          return { 
            success: false, 
            error: contractError instanceof Error ? contractError.message : 'Smart contract submission failed' 
          };
        }
      }

    } catch (error) {
      console.error('Lineup submission failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Verify that a lineup was successfully submitted to the smart contract
   */
  private async verifyLineupSubmission(
    contestId: number,
    playerAddress: string,
    expectedNftIds: number[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const lineup = await this.getCurrentLineup(contestId, playerAddress);
      
      if (!lineup) {
        return { success: false, error: 'No lineup found after submission' };
      }

      // Verify the NFT IDs match what was submitted
      const submittedIds = lineup.nftIds.sort();
      const expectedIds = expectedNftIds.sort();
      
      if (submittedIds.length !== expectedIds.length) {
        return { success: false, error: 'Lineup length mismatch' };
      }

      for (let i = 0; i < submittedIds.length; i++) {
        if (submittedIds[i] !== expectedIds[i]) {
          return { success: false, error: 'Lineup NFT IDs do not match' };
        }
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Verification failed' 
      };
    }
  }

  /**
   * Get current lineup for a contest
   */
  async getCurrentLineup(
    contestId: number,
    playerAddress: string
  ): Promise<{ nftIds: number[]; submittedAt?: Date } | null> {
    try {
      // First check local database
      const localLineup = await databaseService.getLineup(contestId, playerAddress);
      if (localLineup && localLineup.status === 'confirmed') {
        return {
          nftIds: localLineup.nftIds,
          submittedAt: new Date(localLineup.submittedAt)
        };
      }

      // Fallback to smart contract query
      try {
        const result = await fcl.query({
          cadence: this.getPlayerLineupScript(),
          args: (arg: any, t: any) => [
            arg(contestId, t.UInt64),
            arg(playerAddress, t.Address)
          ]
        });

        if (result && result.nftIds) {
          return {
            nftIds: result.nftIds,
            submittedAt: result.submittedAt ? new Date(result.submittedAt * 1000) : undefined
          };
        }
      } catch (contractError) {
        console.warn('Smart contract query failed, using local data:', contractError);
      }

      return localLineup ? {
        nftIds: localLineup.nftIds,
        submittedAt: new Date(localLineup.submittedAt)
      } : null;
    } catch (error) {
      console.error('Failed to get current lineup:', error);
      return null;
    }
  }

  /**
   * Get contest information
   */
  async getContestInfo(contestId: number): Promise<ContestInfo | null> {
    try {
      // First try local database
      const localContest = await databaseService.getContest(contestId);
      if (localContest) {
        const now = new Date();
        const startTime = new Date(localContest.startTime);
        const endTime = new Date(localContest.endTime);
        
        return {
          id: localContest.id,
          weekId: localContest.weekId,
          startTime,
          endTime,
          status: localContest.status as any,
          totalParticipants: localContest.totalParticipants,
          rewardPool: localContest.rewardPool,
          isActive: now >= startTime && now <= endTime && localContest.status === 'Active'
        };
      }

      // Fallback to smart contract
      try {
        const result = await fcl.query({
          cadence: this.getContestInfoScript(),
          args: (arg: any, t: any) => [
            arg(contestId, t.UInt64)
          ]
        });

        if (result) {
          const now = new Date();
          const startTime = new Date(result.startTime * 1000);
          const endTime = new Date(result.endTime * 1000);
          
          return {
            id: result.id,
            weekId: result.weekId,
            startTime,
            endTime,
            status: result.status,
            totalParticipants: result.totalParticipants,
            rewardPool: result.rewardPool,
            isActive: now >= startTime && now <= endTime && result.status === 'Active'
          };
        }
      } catch (contractError) {
        console.warn('Smart contract query failed:', contractError);
      }

      return null;
    } catch (error) {
      console.error('Failed to get contest info:', error);
      return null;
    }
  }

  /**
   * Get active contests
   */
  async getActiveContests(): Promise<ContestInfo[]> {
    try {
      // First try local database
      const localContests = await databaseService.getActiveContests();
      if (localContests.length > 0) {
        return localContests.map(contest => ({
          id: contest.id,
          weekId: contest.weekId,
          startTime: new Date(contest.startTime),
          endTime: new Date(contest.endTime),
          status: contest.status as any,
          totalParticipants: contest.totalParticipants,
          rewardPool: contest.rewardPool,
          isActive: contest.status === 'Active'
        }));
      }

      // Fallback to smart contract
      try {
        const result = await fcl.query({
          cadence: this.getActiveContestsScript()
        });

        if (result && Array.isArray(result)) {
          return result.map(contest => ({
            id: contest.id,
            weekId: contest.weekId,
            startTime: new Date(contest.startTime * 1000),
            endTime: new Date(contest.endTime * 1000),
            status: contest.status,
            totalParticipants: contest.totalParticipants,
            rewardPool: contest.rewardPool,
            isActive: contest.status === 'Active'
          }));
        }
      } catch (contractError) {
        console.warn('Smart contract query failed, using local data:', contractError);
      }

      return [];
    } catch (error) {
      console.error('Failed to get active contests:', error);
      return [];
    }
  }

  /**
   * Check if player has already submitted lineup for contest
   */
  async hasSubmittedLineup(contestId: number, playerAddress: string): Promise<boolean> {
    const lineup = await this.getCurrentLineup(contestId, playerAddress);
    return lineup !== null;
  }

  /**
   * Get lineup with NFT metadata
   */
  async getLineupWithMetadata(
    contestId: number,
    playerAddress: string
  ): Promise<{ moments: NFTMoment[]; submittedAt?: Date } | null> {
    try {
      const lineup = await this.getCurrentLineup(contestId, playerAddress);
      if (!lineup) return null;

      const ownership = await nftOwnershipService.getOwnership(playerAddress);
      if (!ownership.success || !ownership.data) return null;

      const moments = ownership.data.moments.filter(moment =>
        lineup.nftIds.includes(moment.momentId)
      );

      return {
        moments,
        submittedAt: lineup.submittedAt
      };
    } catch (error) {
      console.error('Failed to get lineup with metadata:', error);
      return null;
    }
  }

  // Cadence Scripts and Transactions

  private getSubmitLineupTransaction(): string {
    return `
      import ShotCaller from 0x877931736ee77cff

      transaction(contestId: UInt64, nftIds: [UInt64]) {
        prepare(signer: AuthAccount) {
          // Validate contest exists and is active
          let contest = ShotCaller.getContest(contestId: contestId)
            ?? panic("Contest does not exist")
          
          // Validate lineup constraints
          assert(nftIds.length > 0, message: "At least 1 NFT required in lineup")
          assert(nftIds.length <= 5, message: "Maximum 5 NFTs allowed in lineup")
          
          // Check for duplicates
          var seen: {UInt64: Bool} = {}
          for nftId in nftIds {
            assert(!seen.containsKey(nftId), message: "Duplicate NFTs not allowed")
            seen[nftId] = true
          }
          
          // Submit lineup to the contest
          ShotCaller.submitLineup(contestId: contestId, nftIds: nftIds)
        }
        
        execute {
          log("Lineup submitted successfully")
        }
      }
    `;
  }

  private getPlayerLineupScript(): string {
    return `
      import ShotCaller from 0x877931736ee77cff

      pub fun main(contestId: UInt64, player: Address): ShotCaller.Lineup? {
        return ShotCaller.getPlayerLineup(contestId: contestId, player: player)
      }
    `;
  }

  private getContestInfoScript(): string {
    return `
      import ShotCaller from 0x877931736ee77cff

      pub fun main(contestId: UInt64): ShotCaller.Contest? {
        return ShotCaller.getContest(contestId: contestId)
      }
    `;
  }

  private getActiveContestsScript(): string {
    return `
      import ShotCaller from 0x877931736ee77cff

      pub fun main(): [ShotCaller.Contest] {
        return ShotCaller.getActiveContests()
      }
    `;
  }
}

// Default service instance
export const lineupService = new LineupService();

// Utility functions
export const formatContestTime = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
};

export const getContestStatus = (contest: ContestInfo): {
  status: string;
  color: string;
  canSubmit: boolean;
} => {
  const now = new Date();
  
  if (contest.status === 'Completed') {
    return { status: 'Completed', color: 'text-gray-500', canSubmit: false };
  }
  
  if (contest.status === 'Cancelled') {
    return { status: 'Cancelled', color: 'text-red-500', canSubmit: false };
  }
  
  if (now < contest.startTime) {
    return { status: 'Upcoming', color: 'text-blue-500', canSubmit: false };
  }
  
  if (now > contest.endTime) {
    return { status: 'Ended', color: 'text-gray-500', canSubmit: false };
  }
  
  return { status: 'Active', color: 'text-green-500', canSubmit: true };
};