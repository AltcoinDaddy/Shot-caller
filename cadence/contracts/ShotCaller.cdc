// For Emulator (Local Development) - recommended for testing
import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import NonFungibleToken from "NonFungibleToken"

// For Testnet - uncomment these when deploying to testnet:
// import FungibleToken from 0x9a0766d93b6608b7
// import FlowToken from 0x7e60df042a9c0868
// import NonFungibleToken from 0x631e88ae7f1d7c20

// For Mainnet - uncomment these when deploying to mainnet:
// import FungibleToken from 0xf233dcee88fe0abe
// import FlowToken from 0x1654653399040a61
// import NonFungibleToken from 0x1d7e57aa55817448

access(all) contract ShotCaller {
    
    // Events
    access(all) event ContestCreated(contestId: UInt64, weekId: UInt64, startTime: UFix64, endTime: UFix64)
    access(all) event LineupSubmitted(contestId: UInt64, player: Address, nftIds: [UInt64])
    access(all) event ContestFinalized(contestId: UInt64, totalParticipants: UInt64)
    access(all) event RewardDistributed(contestId: UInt64, winner: Address, amount: UFix64, rank: UInt64)
    access(all) event RewardClaimed(contestId: UInt64, winner: Address, amount: UFix64)
    access(all) event TournamentCreated(tournamentId: UInt64, entryFee: UFix64, maxParticipants: UInt64)
    access(all) event TournamentJoined(tournamentId: UInt64, player: Address, entryFee: UFix64)
    access(all) event FeeCollected(amount: UFix64, rewardPoolAmount: UFix64, treasuryAmount: UFix64)
    access(all) event TreasuryWithdrawal(amount: UFix64, recipient: Address)
    
    // Marketplace Events
    access(all) event NFTListed(listingId: UInt64, seller: Address, momentId: UInt64, price: UFix64)
    access(all) event NFTPurchased(listingId: UInt64, seller: Address, buyer: Address, momentId: UInt64, price: UFix64, marketplaceFee: UFix64)
    access(all) event ListingCancelled(listingId: UInt64, seller: Address, momentId: UInt64)
    access(all) event MarketplaceFeeCollected(amount: UFix64, treasuryAmount: UFix64, rewardPoolAmount: UFix64)
    
    // Booster Events
    access(all) event BoosterPurchased(buyer: Address, boosterType: String, price: UFix64, boosterId: UInt64)
    access(all) event BoosterActivated(player: Address, boosterId: UInt64, lineupId: UInt64, expiresAt: UFix64)
    access(all) event BoosterExpired(player: Address, boosterId: UInt64)
    access(all) event DisneyBoosterDetected(player: Address, nftId: UInt64, boosterType: String)
    
    // Paths
    access(all) let AdminStoragePath: StoragePath
    access(all) let PlayerStoragePath: StoragePath
    access(all) let PlayerPublicPath: PublicPath
    access(all) let TreasuryStoragePath: StoragePath
    
    // Contest status enum
    access(all) enum ContestStatus: UInt8 {
        access(all) case Upcoming
        access(all) case Active
        access(all) case Scoring
        access(all) case Completed
        access(all) case Cancelled
    }
    
    // Reward tier structure
    access(all) struct RewardTier {
        access(all) let rank: UInt64
        access(all) let flowAmount: UFix64
        access(all) let nftReward: String? // NFT collection identifier
        
        init(rank: UInt64, flowAmount: UFix64, nftReward: String?) {
            self.rank = rank
            self.flowAmount = flowAmount
            self.nftReward = nftReward
        }
    }
    
    // Contest structure
    access(all) struct Contest {
        access(all) let id: UInt64
        access(all) let weekId: UInt64
        access(all) let startTime: UFix64
        access(all) let endTime: UFix64
        access(all) var status: ContestStatus
        access(all) var totalParticipants: UInt64
        access(all) let rewardTiers: [RewardTier]
        access(all) let rewardPool: UFix64
        
        init(
            id: UInt64,
            weekId: UInt64,
            startTime: UFix64,
            endTime: UFix64,
            rewardTiers: [RewardTier],
            rewardPool: UFix64
        ) {
            self.id = id
            self.weekId = weekId
            self.startTime = startTime
            self.endTime = endTime
            self.status = ContestStatus.Upcoming
            self.totalParticipants = 0
            self.rewardTiers = rewardTiers
            self.rewardPool = rewardPool
        }
        
        access(contract) fun updateStatus(_ newStatus: ContestStatus) {
            self.status = newStatus
        }
        
        access(contract) fun incrementParticipants() {
            self.totalParticipants = self.totalParticipants + 1
        }
    }
    
    // Player lineup structure
    access(all) struct Lineup {
        access(all) let player: Address
        access(all) let nftIds: [UInt64]
        access(all) let submittedAt: UFix64
        access(all) var totalPoints: UFix64
        access(all) var finalRank: UInt64?
        
        init(player: Address, nftIds: [UInt64]) {
            pre {
                nftIds.length <= 5: "Maximum 5 NFTs allowed in lineup"
                nftIds.length > 0: "At least 1 NFT required in lineup"
            }
            self.player = player
            self.nftIds = nftIds
            self.submittedAt = getCurrentBlock().timestamp
            self.totalPoints = 0.0
            self.finalRank = nil
        }
        
        access(contract) fun updatePoints(_ points: UFix64) {
            self.totalPoints = points
        }
        
        access(contract) fun setRank(_ rank: UInt64) {
            self.finalRank = rank
        }
    }
    
    // Reward claim structure
    access(all) struct RewardClaim {
        access(all) let contestId: UInt64
        access(all) let amount: UFix64
        access(all) let rank: UInt64
        access(all) let claimedAt: UFix64
        
        init(contestId: UInt64, amount: UFix64, rank: UInt64) {
            self.contestId = contestId
            self.amount = amount
            self.rank = rank
            self.claimedAt = getCurrentBlock().timestamp
        }
    }

    // Tournament structure for paid entry tournaments
    access(all) struct Tournament {
        access(all) let id: UInt64
        access(all) let weekId: UInt64
        access(all) let entryFee: UFix64
        access(all) let maxParticipants: UInt64
        access(all) var currentParticipants: UInt64
        access(all) let startTime: UFix64
        access(all) let endTime: UFix64
        access(all) var status: ContestStatus
        access(all) let participants: [Address]
        
        init(
            id: UInt64,
            weekId: UInt64,
            entryFee: UFix64,
            maxParticipants: UInt64,
            startTime: UFix64,
            endTime: UFix64
        ) {
            self.id = id
            self.weekId = weekId
            self.entryFee = entryFee
            self.maxParticipants = maxParticipants
            self.currentParticipants = 0
            self.startTime = startTime
            self.endTime = endTime
            self.status = ContestStatus.Upcoming
            self.participants = []
        }
        
        access(contract) fun addParticipant(_ participant: Address) {
            self.participants.append(participant)
            self.currentParticipants = self.currentParticipants + 1
        }
        
        access(contract) fun updateStatus(_ newStatus: ContestStatus) {
            self.status = newStatus
        }
    }
    
    // Player resource to track participation and rewards
    access(all) resource Player {
        access(all) let address: Address
        access(all) var totalEarnings: UFix64
        access(all) var contestsWon: UInt64
        access(all) var contestsParticipated: UInt64
        access(all) let rewardHistory: [RewardClaim]
        
        init(address: Address) {
            self.address = address
            self.totalEarnings = 0.0
            self.contestsWon = 0
            self.contestsParticipated = 0
            self.rewardHistory = []
        }
        
        access(contract) fun addRewardClaim(_ claim: RewardClaim) {
            self.rewardHistory.append(claim)
            self.totalEarnings = self.totalEarnings + claim.amount
            if claim.rank == 1 {
                self.contestsWon = self.contestsWon + 1
            }
        }
        
        access(contract) fun incrementParticipation() {
            self.contestsParticipated = self.contestsParticipated + 1
        }
        
        access(all) fun getRewardHistory(): [RewardClaim] {
            return self.rewardHistory
        }
    }
    
    // Public interface for players
    access(all) resource interface PlayerPublic {
        access(all) fun getAddress(): Address
        access(all) fun getTotalEarnings(): UFix64
        access(all) fun getContestsWon(): UInt64
        access(all) fun getContestsParticipated(): UInt64
        access(all) fun getRewardHistory(): [RewardClaim]
    }
    
    // Treasury resource for managing FLOW token vaults and fee distribution
    access(all) resource Treasury {
        access(all) var rewardPoolVault: @FlowToken.Vault
        access(all) var platformTreasuryVault: @FlowToken.Vault
        
        init() {
            self.rewardPoolVault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
            self.platformTreasuryVault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
        }
        
        // Collect fee and route 70% to reward pool, 30% to platform treasury
        access(all) fun collectFee(from: @FlowToken.Vault): @FlowToken.Vault {
            let totalAmount = from.balance
            let rewardPoolAmount = totalAmount * 0.7
            let treasuryAmount = totalAmount * 0.3
            
            // Split the vault
            let rewardPoolDeposit <- from.withdraw(amount: rewardPoolAmount)
            let treasuryDeposit <- from.withdraw(amount: treasuryAmount)
            
            // Deposit into respective vaults
            self.rewardPoolVault.deposit(from: <-rewardPoolDeposit)
            self.platformTreasuryVault.deposit(from: <-treasuryDeposit)
            
            emit FeeCollected(
                amount: totalAmount,
                rewardPoolAmount: rewardPoolAmount,
                treasuryAmount: treasuryAmount
            )
            
            return <-from
        }
        
        // Withdraw from reward pool for prize distribution
        access(all) fun withdrawFromRewardPool(amount: UFix64): @FlowToken.Vault {
            pre {
                self.rewardPoolVault.balance >= amount: "Insufficient reward pool balance"
            }
            return <-self.rewardPoolVault.withdraw(amount: amount) as! @FlowToken.Vault
        }
        
        // Withdraw from platform treasury (admin only)
        access(all) fun withdrawFromTreasury(amount: UFix64, recipient: Address): @FlowToken.Vault {
            pre {
                self.platformTreasuryVault.balance >= amount: "Insufficient treasury balance"
            }
            
            let withdrawal <- self.platformTreasuryVault.withdraw(amount: amount) as! @FlowToken.Vault
            
            emit TreasuryWithdrawal(amount: amount, recipient: recipient)
            
            return <-withdrawal
        }
        
        // Get treasury balances
        access(all) fun getTreasuryBalances(): {String: UFix64} {
            return {
                "rewardPool": self.rewardPoolVault.balance,
                "platformTreasury": self.platformTreasuryVault.balance
            }
        }
    }

    // Admin resource for contest management
    access(all) resource Admin {
        
        // Create a new contest
        access(all) fun createContest(
            weekId: UInt64,
            startTime: UFix64,
            endTime: UFix64,
            rewardTiers: [RewardTier],
            rewardPool: UFix64
        ): UInt64 {
            let contestId = ShotCaller.nextContestId
            ShotCaller.nextContestId = ShotCaller.nextContestId + 1
            
            let contest = Contest(
                id: contestId,
                weekId: weekId,
                startTime: startTime,
                endTime: endTime,
                rewardTiers: rewardTiers,
                rewardPool: rewardPool
            )
            
            ShotCaller.contests[contestId] = contest
            
            emit ContestCreated(
                contestId: contestId,
                weekId: weekId,
                startTime: startTime,
                endTime: endTime
            )
            
            return contestId
        }
        
        // Create a new tournament with entry fee
        access(all) fun createTournament(
            weekId: UInt64,
            entryFee: UFix64,
            maxParticipants: UInt64,
            startTime: UFix64,
            endTime: UFix64
        ): UInt64 {
            pre {
                entryFee > 0.0: "Entry fee must be greater than 0"
                maxParticipants > 0: "Max participants must be greater than 0"
                startTime < endTime: "Start time must be before end time"
                startTime > getCurrentBlock().timestamp: "Start time must be in the future"
            }
            
            let tournamentId = ShotCaller.nextTournamentId
            ShotCaller.nextTournamentId = ShotCaller.nextTournamentId + 1
            
            let tournament = Tournament(
                id: tournamentId,
                weekId: weekId,
                entryFee: entryFee,
                maxParticipants: maxParticipants,
                startTime: startTime,
                endTime: endTime
            )
            
            ShotCaller.tournaments[tournamentId] = tournament
            
            emit TournamentCreated(
                tournamentId: tournamentId,
                entryFee: entryFee,
                maxParticipants: maxParticipants
            )
            
            return tournamentId
        }
        
        // Close tournament registration
        access(all) fun closeTournamentRegistration(tournamentId: UInt64) {
            pre {
                ShotCaller.tournaments.containsKey(tournamentId): "Tournament does not exist"
            }
            
            let tournament = ShotCaller.tournaments[tournamentId]!
            tournament.updateStatus(ContestStatus.Active)
            ShotCaller.tournaments[tournamentId] = tournament
        }
        
        // Cancel tournament and refund participants
        access(all) fun cancelTournament(tournamentId: UInt64) {
            pre {
                ShotCaller.tournaments.containsKey(tournamentId): "Tournament does not exist"
            }
            
            let tournament = ShotCaller.tournaments[tournamentId]!
            
            // Only allow cancellation before tournament starts
            assert(
                getCurrentBlock().timestamp < tournament.startTime,
                message: "Cannot cancel tournament after it has started"
            )
            
            // Get treasury reference for refunds
            let treasuryRef = ShotCaller.account.storage.borrow<&Treasury>(from: ShotCaller.TreasuryStoragePath)
                ?? panic("Could not borrow treasury reference")
            
            // Refund all participants
            for participant in tournament.participants {
                let refundVault <- treasuryRef.withdrawFromRewardPool(amount: tournament.entryFee)
                
                let receiverCap = getAccount(participant).capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                if let receiverRef = receiverCap.borrow() {
                    receiverRef.deposit(from: <-refundVault)
                } else {
                    // Return to treasury if receiver not found
                    treasuryRef.rewardPoolVault.deposit(from: <-refundVault)
                }
            }
            
            // Update tournament status
            tournament.updateStatus(ContestStatus.Cancelled)
            ShotCaller.tournaments[tournamentId] = tournament
        }

        // Finalize contest and calculate rankings
        access(all) fun finalizeContest(contestId: UInt64, finalRankings: {Address: UInt64}) {
            pre {
                ShotCaller.contests.containsKey(contestId): "Contest does not exist"
            }
            
            let contest = ShotCaller.contests[contestId]!
            contest.updateStatus(ContestStatus.Completed)
            
            // Update player rankings
            if let lineups = ShotCaller.contestLineups[contestId] {
                for lineup in lineups {
                    if let rank = finalRankings[lineup.player] {
                        lineup.setRank(rank)
                    }
                }
            }
            
            ShotCaller.contests[contestId] = contest
            
            emit ContestFinalized(
                contestId: contestId,
                totalParticipants: contest.totalParticipants
            )
        }
        
        // Distribute structured rewards to winners
        access(all) fun distributeStructuredRewards(
            contestId: UInt64,
            rankings: {Address: UInt64}
        ) {
            pre {
                ShotCaller.contests.containsKey(contestId): "Contest does not exist"
            }
            
            let contest = ShotCaller.contests[contestId]!
            let totalPrizePool = contest.rewardPool
            
            // Calculate structured reward distribution
            let firstPlaceAmount = totalPrizePool * 0.25    // 25%
            let secondPlaceAmount = totalPrizePool * 0.15   // 15%
            let thirdPlaceAmount = totalPrizePool * 0.10    // 10%
            let top10PercentAmount = totalPrizePool * 0.30  // 30% shared among top 10%
            let sustainabilityAmount = totalPrizePool * 0.20 // 20% for platform sustainability
            
            // Get treasury reference
            let treasuryRef = ShotCaller.account.storage.borrow<&Treasury>(from: ShotCaller.TreasuryStoragePath)
                ?? panic("Could not borrow treasury reference")
            
            // Distribute rewards based on rankings
            for address in rankings.keys {
                let rank = rankings[address]!
                var rewardAmount: UFix64 = 0.0
                
                if rank == 1 {
                    rewardAmount = firstPlaceAmount
                } else if rank == 2 {
                    rewardAmount = secondPlaceAmount
                } else if rank == 3 {
                    rewardAmount = thirdPlaceAmount
                } else if rank <= (UInt64(rankings.length) / 10) { // Top 10%
                    let top10Count = UInt64(rankings.length) / 10
                    rewardAmount = top10PercentAmount / UFix64(top10Count)
                }
                
                if rewardAmount > 0.0 {
                    // Withdraw from reward pool
                    let rewardVault <- treasuryRef.withdrawFromRewardPool(amount: rewardAmount)
                    
                    // Get player's Flow token receiver
                    let receiverCap = getAccount(address).capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                    if let receiverRef = receiverCap.borrow() {
                        receiverRef.deposit(from: <-rewardVault)
                        
                        // Record reward claim
                        let claim = RewardClaim(
                            contestId: contestId,
                            amount: rewardAmount,
                            rank: rank
                        )
                        
                        emit RewardDistributed(
                            contestId: contestId,
                            winner: address,
                            amount: rewardAmount,
                            rank: rank
                        )
                    } else {
                        // Return reward to pool if receiver not found
                        treasuryRef.rewardPoolVault.deposit(from: <-rewardVault)
                    }
                }
            }
            
            // Keep sustainability amount in treasury (already allocated)
        }
        
        // Distribute tournament rewards with structured percentages
        access(all) fun distributeTournamentRewards(
            tournamentId: UInt64,
            rankings: {Address: UInt64}
        ) {
            pre {
                ShotCaller.tournaments.containsKey(tournamentId): "Tournament does not exist"
            }
            
            let tournament = ShotCaller.tournaments[tournamentId]!
            let totalPrizePool = ShotCaller.getTournamentPrizePool(tournamentId: tournamentId)
            
            // Calculate structured reward distribution
            let firstPlaceAmount = totalPrizePool * 0.25    // 25%
            let secondPlaceAmount = totalPrizePool * 0.15   // 15%
            let thirdPlaceAmount = totalPrizePool * 0.10    // 10%
            let top10PercentAmount = totalPrizePool * 0.30  // 30% shared among top 10%
            let sustainabilityAmount = totalPrizePool * 0.20 // 20% for platform sustainability
            
            // Get treasury reference
            let treasuryRef = ShotCaller.account.storage.borrow<&Treasury>(from: ShotCaller.TreasuryStoragePath)
                ?? panic("Could not borrow treasury reference")
            
            // Distribute rewards based on rankings
            for address in rankings.keys {
                let rank = rankings[address]!
                var rewardAmount: UFix64 = 0.0
                var nftReward: String? = nil
                
                if rank == 1 {
                    rewardAmount = firstPlaceAmount
                    nftReward = "Legendary Winner NFT" // First place gets special NFT
                } else if rank == 2 {
                    rewardAmount = secondPlaceAmount
                } else if rank == 3 {
                    rewardAmount = thirdPlaceAmount
                } else if rank <= (UInt64(rankings.length) / 10) { // Top 10%
                    let top10Count = UInt64(rankings.length) / 10
                    rewardAmount = top10PercentAmount / UFix64(top10Count)
                }
                
                if rewardAmount > 0.0 {
                    // Withdraw from reward pool
                    let rewardVault <- treasuryRef.withdrawFromRewardPool(amount: rewardAmount)
                    
                    // Get player's Flow token receiver
                    let receiverCap = getAccount(address).capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                    if let receiverRef = receiverCap.borrow() {
                        receiverRef.deposit(from: <-rewardVault)
                        
                        // Record reward claim
                        let claim = RewardClaim(
                            contestId: tournamentId,
                            amount: rewardAmount,
                            rank: rank
                        )
                        
                        emit RewardDistributed(
                            contestId: tournamentId,
                            winner: address,
                            amount: rewardAmount,
                            rank: rank
                        )
                        
                        // TODO: Implement NFT reward distribution for first place
                        // This would integrate with a reward NFT 
                        
                        
                    } else {
                        // Return reward to pool if receiver not found
                        treasuryRef.rewardPoolVault.deposit(from: <-rewardVault)
                    }
                }
            }
            
            // Update tournament status to completed
            tournament.updateStatus(ContestStatus.Completed)
            ShotCaller.tournaments[tournamentId] = tournament
        }
        
        // Get reward distribution breakdown for a prize pool
        access(all) fun getRewardDistributionBreakdown(prizePool: UFix64, participantCount: UInt64): {String: UFix64} {
            let firstPlace = prizePool * 0.25
            let secondPlace = prizePool * 0.15
            let thirdPlace = prizePool * 0.10
            let top10Percent = prizePool * 0.30
            let sustainability = prizePool * 0.20
            let top10Count = participantCount / 10
            let top10Individual = top10Count > 0 ? top10Percent / UFix64(top10Count) : 0.0
            
            return {
                "firstPlace": firstPlace,
                "secondPlace": secondPlace,
                "thirdPlace": thirdPlace,
                "top10PercentTotal": top10Percent,
                "top10PercentIndividual": top10Individual,
                "sustainability": sustainability,
                "top10Count": UFix64(top10Count)
            }
        }

        // Add Disney Pinnacle NFT booster mapping
        access(all) fun addDisneyBoosterMapping(
            nftId: UInt64,
            boosterType: String,
            effectType: String,
            effectValue: UFix64,
            durationHours: UInt64
        ) {
            let boosterMapping = DisneyBoosterMapping(
                nftId: nftId,
                boosterType: boosterType,
                effectType: effectType,
                effectValue: effectValue,
                durationHours: durationHours
            )
            
            ShotCaller.disneyBoosterMappings[nftId] = boosterMapping
        }

        // Setup marketplace booster configurations
        access(all) fun setupBoosterMarketplace() {
            // Energy Boost
            ShotCaller.boosterMarketplace["energy_boost"] = {
                "name": "Energy Boost",
                "description": "+5% score multiplier for one week",
                "boosterType": "energy",
                "effectType": "score_multiplier",
                "effectValue": 1.05,
                "durationHours": 168 as UInt64,
                "flowPrice": 2.5,
                "maxPurchases": 3 as UInt64
            }
            
            // Luck Charm
            ShotCaller.boosterMarketplace["luck_charm"] = {
                "name": "Luck Charm",
                "description": "Random bonus points (5-25) for one lineup",
                "boosterType": "luck",
                "effectType": "random_bonus",
                "effectValue": 25.0,
                "durationHours": 24 as UInt64,
                "flowPrice": 1.8,
                "maxPurchases": 5 as UInt64
            }
            
            // Power Surge
            ShotCaller.boosterMarketplace["power_surge"] = {
                "name": "Power Surge",
                "description": "+10% score multiplier for premium users",
                "boosterType": "power",
                "effectType": "score_multiplier",
                "effectValue": 1.10,
                "durationHours": 168 as UInt64,
                "flowPrice": 4.0,
                "maxPurchases": 2 as UInt64
            }
        }
    }
    
    // Marketplace Listing structure
    access(all) struct MarketplaceListing {
        access(all) let id: UInt64
        access(all) let seller: Address
        access(all) let momentId: UInt64
        access(all) let price: UFix64
        access(all) let createdAt: UFix64
        access(all) var status: String // "active", "sold", "cancelled"
        access(all) var buyer: Address?
        access(all) var soldAt: UFix64?

        init(id: UInt64, seller: Address, momentId: UInt64, price: UFix64) {
            self.id = id
            self.seller = seller
            self.momentId = momentId
            self.price = price
            self.createdAt = getCurrentBlock().timestamp
            self.status = "active"
            self.buyer = nil
            self.soldAt = nil
        }

        access(contract) fun markAsSold(buyer: Address) {
            self.status = "sold"
            self.buyer = buyer
            self.soldAt = getCurrentBlock().timestamp
        }

        access(contract) fun markAsCancelled() {
            self.status = "cancelled"
        }
    }

    // Booster structure
    access(all) struct Booster {
        access(all) let id: UInt64
        access(all) let owner: Address
        access(all) let boosterType: String // "energy", "luck", "power", "multiplier"
        access(all) let effectType: String // "score_multiplier", "random_bonus", "extra_points"
        access(all) let effectValue: UFix64
        access(all) let durationHours: UInt64
        access(all) let purchasedAt: UFix64
        access(all) var activatedAt: UFix64?
        access(all) var expiresAt: UFix64?
        access(all) var status: String // "available", "active", "expired", "used"
        access(all) let sourceType: String // "marketplace", "disney_nft", "premium_reward"
        access(all) let sourceId: String? // NFT ID for Disney boosters
        access(all) let flowCost: UFix64?

        init(
            id: UInt64,
            owner: Address,
            boosterType: String,
            effectType: String,
            effectValue: UFix64,
            durationHours: UInt64,
            sourceType: String,
            sourceId: String?,
            flowCost: UFix64?
        ) {
            self.id = id
            self.owner = owner
            self.boosterType = boosterType
            self.effectType = effectType
            self.effectValue = effectValue
            self.durationHours = durationHours
            self.purchasedAt = getCurrentBlock().timestamp
            self.activatedAt = nil
            self.expiresAt = nil
            self.status = "available"
            self.sourceType = sourceType
            self.sourceId = sourceId
            self.flowCost = flowCost
        }

        access(contract) fun activate(lineupId: UInt64) {
            pre {
                self.status == "available": "Booster is not available for activation"
            }
            
            let currentTime = getCurrentBlock().timestamp
            self.activatedAt = currentTime
            self.expiresAt = currentTime + UFix64(self.durationHours * 3600) // Convert hours to seconds
            self.status = "active"
        }

        access(contract) fun expire() {
            self.status = "expired"
        }

        access(all) fun isActive(): Bool {
            if self.status != "active" || self.expiresAt == nil {
                return false
            }
            return getCurrentBlock().timestamp < self.expiresAt!
        }

        access(all) fun getRemainingTime(): UFix64 {
            if self.expiresAt == nil {
                return 0.0
            }
            let currentTime = getCurrentBlock().timestamp
            return self.expiresAt! > currentTime ? self.expiresAt! - currentTime : 0.0
        }
    }

    // Disney Pinnacle NFT booster mapping
    access(all) struct DisneyBoosterMapping {
        access(all) let nftId: UInt64
        access(all) let boosterType: String
        access(all) let effectType: String
        access(all) let effectValue: UFix64
        access(all) let durationHours: UInt64

        init(nftId: UInt64, boosterType: String, effectType: String, effectValue: UFix64, durationHours: UInt64) {
            self.nftId = nftId
            self.boosterType = boosterType
            self.effectType = effectType
            self.effectValue = effectValue
            self.durationHours = durationHours
        }
    }

    // Contract state
    access(all) var nextContestId: UInt64
    access(all) var nextTournamentId: UInt64
    access(all) var nextListingId: UInt64
    access(all) var nextBoosterId: UInt64
    access(all) let contests: {UInt64: Contest}
    access(all) let tournaments: {UInt64: Tournament}
    access(all) let contestLineups: {UInt64: [Lineup]}
    access(all) let tournamentLineups: {UInt64: [Lineup]}
    access(all) let players: {Address: Address} // Changed to store addresses instead of references
    access(contract) let rewardVaults: @{UInt64: FlowToken.Vault}
    
    // Marketplace state
    access(all) let marketplaceListings: {UInt64: MarketplaceListing}
    access(all) let activeListingsByMoment: {UInt64: UInt64} // momentId -> listingId
    access(all) let userListings: {Address: [UInt64]} // user -> [listingIds]
    access(all) let marketplaceFeePercentage: UFix64 // 3% = 0.03
    
    // Booster state
    access(all) let boosters: {UInt64: Booster}
    access(all) let userBoosters: {Address: [UInt64]} // user -> [boosterIds]
    access(all) let activeBoosters: {Address: [UInt64]} // user -> [active boosterIds]
    access(all) let disneyBoosterMappings: {UInt64: DisneyBoosterMapping} // nftId -> booster config
    access(all) let boosterMarketplace: {String: {String: AnyStruct}} // boosterType -> config
    
    // Public functions
    
    // Join tournament with entry fee payment
    access(all) fun joinTournament(tournamentId: UInt64, entryFeePayment: @FlowToken.Vault) {
        pre {
            self.tournaments.containsKey(tournamentId): "Tournament does not exist"
        }
        
        let tournament = self.tournaments[tournamentId]!
        let currentTime = getCurrentBlock().timestamp
        let player = self.account.address
        
        // Check tournament constraints
        assert(
            tournament.status == ContestStatus.Upcoming,
            message: "Tournament registration is closed"
        )
        assert(
            currentTime < tournament.endTime,
            message: "Tournament registration deadline has passed"
        )
        assert(
            tournament.currentParticipants < tournament.maxParticipants,
            message: "Tournament is full"
        )
        assert(
            !tournament.participants.contains(player),
            message: "Player already registered for tournament"
        )
        assert(
            entryFeePayment.balance == tournament.entryFee,
            message: "Incorrect entry fee amount"
        )
        
        // Process entry fee through treasury
        let treasuryRef = self.account.storage.borrow<&Treasury>(from: self.TreasuryStoragePath)
            ?? panic("Could not borrow treasury reference")
        
        let remainingVault <- treasuryRef.collectFee(from: <-entryFeePayment)
        destroy remainingVault
        
        // Add participant to tournament
        tournament.addParticipant(player)
        self.tournaments[tournamentId] = tournament
        
        emit TournamentJoined(
            tournamentId: tournamentId,
            player: player,
            entryFee: tournament.entryFee
        )
    }
    
    // Check if player is registered for tournament
    access(all) fun isPlayerRegisteredForTournament(tournamentId: UInt64, player: Address): Bool {
        if let tournament = self.tournaments[tournamentId] {
            return tournament.participants.contains(player)
        }
        return false
    }
    
    // Get tournament participants count
    access(all) fun getTournamentParticipantsCount(tournamentId: UInt64): UInt64 {
        if let tournament = self.tournaments[tournamentId] {
            return tournament.currentParticipants
        }
        return 0
    }
    
    // Get tournament prize pool (calculated from entry fees)
    access(all) fun getTournamentPrizePool(tournamentId: UInt64): UFix64 {
        if let tournament = self.tournaments[tournamentId] {
            // 70% of total entry fees go to prize pool
            let totalEntryFees = tournament.entryFee * UFix64(tournament.currentParticipants)
            return totalEntryFees * 0.7
        }
        return 0.0
    }

    // Purchase booster from marketplace
    access(all) fun purchaseBooster(boosterType: String, payment: @FlowToken.Vault): UInt64 {
        pre {
            self.boosterMarketplace.containsKey(boosterType): "Booster type not available"
        }
        
        let config = self.boosterMarketplace[boosterType]!
        let flowPrice = config["flowPrice"]! as! UFix64
        let buyer = self.account.address
        
        assert(
            payment.balance == flowPrice,
            message: "Incorrect payment amount"
        )
        
        // Process payment through treasury
        let treasuryRef = self.account.storage.borrow<&Treasury>(from: self.TreasuryStoragePath)
            ?? panic("Could not borrow treasury reference")
        
        let remainingVault <- treasuryRef.collectFee(from: <-payment)
        destroy remainingVault
        
        // Create new booster
        let boosterId = self.nextBoosterId
        self.nextBoosterId = self.nextBoosterId + 1
        
        let booster = Booster(
            id: boosterId,
            owner: buyer,
            boosterType: config["boosterType"]! as! String,
            effectType: config["effectType"]! as! String,
            effectValue: config["effectValue"]! as! UFix64,
            durationHours: config["durationHours"]! as! UInt64,
            sourceType: "marketplace",
            sourceId: nil,
            flowCost: flowPrice
        )
        
        // Store booster
        self.boosters[boosterId] = booster
        
        // Add to user's booster list
        if self.userBoosters[buyer] == nil {
            self.userBoosters[buyer] = []
        }
        self.userBoosters[buyer]!.append(boosterId)
        
        emit BoosterPurchased(
            buyer: buyer,
            boosterType: booster.boosterType,
            price: flowPrice,
            boosterId: boosterId
        )
        
        return boosterId
    }

    // Activate booster for lineup
    access(all) fun activateBooster(boosterId: UInt64, lineupId: UInt64) {
        pre {
            self.boosters.containsKey(boosterId): "Booster does not exist"
        }
        
        let player = self.account.address
        let booster = self.boosters[boosterId]!
        
        assert(
            booster.owner == player,
            message: "Not the owner of this booster"
        )
        assert(
            booster.status == "available",
            message: "Booster is not available for activation"
        )
        
        // Check if user already has an active booster of the same effect type
        let userActiveBoosters = self.activeBoosters[player] ?? []
        for activeBoosterId in userActiveBoosters {
            if let activeBooster = self.boosters[activeBoosterId] {
                if activeBooster.effectType == booster.effectType && activeBooster.isActive() {
                    panic("Already have an active booster of this type")
                }
            }
        }
        
        // Activate the booster
        booster.activate(lineupId: lineupId)
        self.boosters[boosterId] = booster
        
        // Add to active boosters
        if self.activeBoosters[player] == nil {
            self.activeBoosters[player] = []
        }
        self.activeBoosters[player]!.append(boosterId)
        
        emit BoosterActivated(
            player: player,
            boosterId: boosterId,
            lineupId: lineupId,
            expiresAt: booster.expiresAt!
        )
    }

    // Get user's boosters
    access(all) fun getUserBoosters(user: Address): [UInt64] {
        return self.userBoosters[user] ?? []
    }

    // Get user's active boosters
    access(all) fun getUserActiveBoosters(user: Address): [UInt64] {
        let activeBoosters = self.activeBoosters[user] ?? []
        let currentlyActive: [UInt64] = []
        
        for boosterId in activeBoosters {
            if let booster = self.boosters[boosterId] {
                if booster.isActive() {
                    currentlyActive.append(boosterId)
                }
            }
        }
        
        return currentlyActive
    }

    // Get booster details
    access(all) fun getBooster(boosterId: UInt64): Booster? {
        return self.boosters[boosterId]
    }

    // Check if user owns Disney Pinnacle NFT and create booster
    access(all) fun detectDisneyBooster(nftId: UInt64, owner: Address): UInt64? {
        if let boosterMapping = self.disneyBoosterMappings[nftId] {
            // Create Disney booster
            let boosterId = self.nextBoosterId
            self.nextBoosterId = self.nextBoosterId + 1
            
            let booster = Booster(
                id: boosterId,
                owner: owner,
                boosterType: boosterMapping.boosterType,
                effectType: boosterMapping.effectType,
                effectValue: boosterMapping.effectValue,
                durationHours: boosterMapping.durationHours,
                sourceType: "disney_nft",
                sourceId: nftId.toString(),
                flowCost: nil
            )
            
            self.boosters[boosterId] = booster
            
            // Add to user's booster list
            if self.userBoosters[owner] == nil {
                self.userBoosters[owner] = []
            }
            self.userBoosters[owner]!.append(boosterId)
            
            emit DisneyBoosterDetected(
                player: owner,
                nftId: nftId,
                boosterType: boosterMapping.boosterType
            )
            
            return boosterId
        }
        
        return nil
    }

    // Get marketplace booster configurations
    access(all) fun getBoosterMarketplace(): {String: {String: AnyStruct}} {
        return self.boosterMarketplace
    }

    // Clean up expired boosters
    access(all) fun cleanupExpiredBoosters(user: Address) {
        let userActiveBoosters = self.activeBoosters[user] ?? []
        let stillActive: [UInt64] = []
        
        for boosterId in userActiveBoosters {
            if let booster = self.boosters[boosterId] {
                if booster.isActive() {
                    stillActive.append(boosterId)
                } else {
                    // Mark as expired
                    booster.expire()
                    self.boosters[boosterId] = booster
                    
                    emit BoosterExpired(player: user, boosterId: boosterId)
                }
            }
        }
        
        self.activeBoosters[user] = stillActive
    }
    
    // Submit lineup for a contest
    access(all) fun submitLineup(contestId: UInt64, nftIds: [UInt64]) {
        pre {
            self.contests.containsKey(contestId): "Contest does not exist"
        }
        
        let contest = self.contests[contestId]!
        let currentTime = getCurrentBlock().timestamp
        
        // Check if contest is active
        assert(
            currentTime >= contest.startTime && currentTime <= contest.endTime,
            message: "Contest is not active"
        )
        
        let player = self.account.address
        
        // Verify NFT ownership (simplified - in production would check actual NFT ownership)
        // This would integrate with NBA Top Shot and NFL All Day contracts
        
        let lineup = Lineup(player: player, nftIds: nftIds)
        
        // Add to contest lineups
        if self.contestLineups.containsKey(contestId) {
            self.contestLineups[contestId]!.append(lineup)
        } else {
            self.contestLineups[contestId] = [lineup]
        }
        
        // Update contest participant count
        contest.incrementParticipants()
        self.contests[contestId] = contest
        
        // Track player participation
        self.players[player] = player
        
        emit LineupSubmitted(contestId: contestId, player: player, nftIds: nftIds)
    }
    
    // Submit lineup for a tournament
    access(all) fun submitTournamentLineup(tournamentId: UInt64, nftIds: [UInt64]) {
        pre {
            self.tournaments.containsKey(tournamentId): "Tournament does not exist"
        }
        
        let tournament = self.tournaments[tournamentId]!
        let currentTime = getCurrentBlock().timestamp
        let player = self.account.address
        
        // Check if tournament is active and player is registered
        assert(
            currentTime >= tournament.startTime && currentTime <= tournament.endTime,
            message: "Tournament is not active"
        )
        assert(
            tournament.participants.contains(player),
            message: "Player not registered for tournament"
        )
        
        let lineup = Lineup(player: player, nftIds: nftIds)
        
        // Add to tournament lineups
        if self.tournamentLineups.containsKey(tournamentId) {
            self.tournamentLineups[tournamentId]!.append(lineup)
        } else {
            self.tournamentLineups[tournamentId] = [lineup]
        }
        
        emit LineupSubmitted(contestId: tournamentId, player: player, nftIds: nftIds)
    }
    
    // Get contest information
    access(all) fun getContest(contestId: UInt64): Contest? {
        return self.contests[contestId]
    }
    
    // Get tournament information
    access(all) fun getTournament(tournamentId: UInt64): Tournament? {
        return self.tournaments[tournamentId]
    }
    
    // Get all active contests
    access(all) fun getActiveContests(): [Contest] {
        let activeContests: [Contest] = []
        let currentTime = getCurrentBlock().timestamp
        
        for contest in self.contests.values {
            if contest.status == ContestStatus.Active || 
               (contest.status == ContestStatus.Upcoming && currentTime >= contest.startTime) {
                activeContests.append(contest)
            }
        }
        
        return activeContests
    }
    
    // Get all active tournaments
    access(all) fun getActiveTournaments(): [Tournament] {
        let activeTournaments: [Tournament] = []
        let currentTime = getCurrentBlock().timestamp
        
        for tournament in self.tournaments.values {
            if tournament.status == ContestStatus.Active || 
               (tournament.status == ContestStatus.Upcoming && currentTime >= tournament.startTime) {
                activeTournaments.append(tournament)
            }
        }
        
        return activeTournaments
    }
    
    // Get player lineup for contest
    access(all) fun getPlayerLineup(contestId: UInt64, player: Address): Lineup? {
        if let lineups = self.contestLineups[contestId] {
            for lineup in lineups {
                if lineup.player == player {
                    return lineup
                }
            }
        }
        return nil
    }
    
    // Get player lineup for tournament
    access(all) fun getPlayerTournamentLineup(tournamentId: UInt64, player: Address): Lineup? {
        if let lineups = self.tournamentLineups[tournamentId] {
            for lineup in lineups {
                if lineup.player == player {
                    return lineup
                }
            }
        }
        return nil
    }
    
    // Create player resource
    access(all) fun createPlayer(): @Player {
        return <-create Player(address: self.account.address)
    }
    
    // Get treasury balances (public view)
    access(all) fun getTreasuryBalances(): {String: UFix64} {
        let treasuryRef = self.account.storage.borrow<&Treasury>(from: self.TreasuryStoragePath)
            ?? panic("Could not borrow treasury reference")
        return treasuryRef.getTreasuryBalances()
    }
    
    // Get player reward history
    access(all) fun getPlayerRewardHistory(player: Address): [RewardClaim] {
        // This would be stored in a player resource or separate mapping
        // For now, return empty array as placeholder
        return []
    }
    
    // Get total rewards distributed for a contest/tournament
    access(all) fun getTotalRewardsDistributed(contestId: UInt64): UFix64 {
        // This would track total rewards distributed
        // For now, return 0 as placeholder
        return 0.0
    }
    
    // Calculate potential rewards for a given rank and prize pool
    access(all) fun calculatePotentialReward(rank: UInt64, prizePool: UFix64, totalParticipants: UInt64): UFix64 {
        if rank == 1 {
            return prizePool * 0.25
        } else if rank == 2 {
            return prizePool * 0.15
        } else if rank == 3 {
            return prizePool * 0.10
        } else if rank <= (totalParticipants / 10) {
            let top10Count = totalParticipants / 10
            let top10Total = prizePool * 0.30
            return top10Count > 0 ? top10Total / UFix64(top10Count) : 0.0
        }
        return 0.0
    }
    
    // Verify NFT ownership (placeholder - would integrate with actual NFT contracts)
    access(all) fun verifyNFTOwnership(owner: Address, nftIds: [UInt64]): Bool {
        // This would integrate with NBA Top Shot and NFL All Day contracts
        // For now, return true as placeholder
        return true
    }

    // Marketplace Functions

    // List NFT for sale in marketplace
    access(all) fun listNFTForSale(seller: Address, momentId: UInt64, price: UFix64): UInt64 {
        pre {
            price > 0.0: "Price must be greater than 0"
            !self.activeListingsByMoment.containsKey(momentId): "NFT is already listed for sale"
        }

        // In production, verify NFT ownership here
        // This would check NBA Top Shot or NFL All Day contracts

        let listingId = self.nextListingId
        self.nextListingId = self.nextListingId + 1

        let listing = MarketplaceListing(
            id: listingId,
            seller: seller,
            momentId: momentId,
            price: price
        )

        self.marketplaceListings[listingId] = listing
        self.activeListingsByMoment[momentId] = listingId

        // Track user listings
        if self.userListings.containsKey(seller) {
            self.userListings[seller]!.append(listingId)
        } else {
            self.userListings[seller] = [listingId]
        }

        emit NFTListed(
            listingId: listingId,
            seller: seller,
            momentId: momentId,
            price: price
        )

        return listingId
    }

    // Purchase NFT from marketplace
    access(all) fun purchaseNFT(listingId: UInt64, payment: @FlowToken.Vault, buyer: Address) {
        pre {
            self.marketplaceListings.containsKey(listingId): "Listing does not exist"
        }

        let listing = self.marketplaceListings[listingId]!

        // Validate purchase
        assert(listing.status == "active", message: "Listing is not active")
        assert(payment.balance == listing.price, message: "Incorrect payment amount")
        assert(buyer != listing.seller, message: "Cannot purchase your own NFT")

        // Calculate marketplace fee (3%)
        let marketplaceFee = listing.price * self.marketplaceFeePercentage
        let sellerAmount = listing.price - marketplaceFee

        // Get treasury reference for fee collection
        let treasuryRef = self.account.storage.borrow<&Treasury>(from: self.TreasuryStoragePath)
            ?? panic("Could not borrow treasury reference")

        // Split payment
        let feeVault <- payment.withdraw(amount: marketplaceFee) as! @FlowToken.Vault
        let sellerVault <- payment

        // Process marketplace fee through treasury (70% to reward pool, 30% to treasury)
        let remainingFeeVault <- treasuryRef.collectFee(from: <-feeVault)
        destroy remainingFeeVault

        // Send payment to seller
        let sellerReceiverCap = getAccount(listing.seller).capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
        if let sellerReceiver = sellerReceiverCap.borrow() {
            sellerReceiver.deposit(from: <-sellerVault)
        } else {
            // If seller receiver not found, return to treasury
            treasuryRef.rewardPoolVault.deposit(from: <-sellerVault)
        }

        // Update listing status
        listing.markAsSold(buyer: buyer)
        self.marketplaceListings[listingId] = listing

        // Remove from active listings
        let _ = self.activeListingsByMoment.remove(key: listing.momentId)

        // In production, transfer NFT ownership here
        // This would call NBA Top Shot or NFL All Day transfer functions

        emit NFTPurchased(
            listingId: listingId,
            seller: listing.seller,
            buyer: buyer,
            momentId: listing.momentId,
            price: listing.price,
            marketplaceFee: marketplaceFee
        )

        emit MarketplaceFeeCollected(
            amount: marketplaceFee,
            treasuryAmount: marketplaceFee * 0.3,
            rewardPoolAmount: marketplaceFee * 0.7
        )
    }

    // Cancel marketplace listing
    access(all) fun cancelListing(listingId: UInt64, seller: Address) {
        pre {
            self.marketplaceListings.containsKey(listingId): "Listing does not exist"
        }

        let listing = self.marketplaceListings[listingId]!

        // Validate cancellation
        assert(listing.seller == seller, message: "Only seller can cancel listing")
        assert(listing.status == "active", message: "Listing is not active")

        // Update listing status
        listing.markAsCancelled()
        self.marketplaceListings[listingId] = listing

        // Remove from active listings
        let _ = self.activeListingsByMoment.remove(key: listing.momentId)

        emit ListingCancelled(
            listingId: listingId,
            seller: seller,
            momentId: listing.momentId
        )
    }

    // Get marketplace listing by ID
    access(all) fun getMarketplaceListing(listingId: UInt64): MarketplaceListing? {
        return self.marketplaceListings[listingId]
    }

    // Get active listings (paginated)
    access(all) fun getActiveListings(limit: UInt64, offset: UInt64): [MarketplaceListing] {
        let listings: [MarketplaceListing] = []
        var count: UInt64 = 0
        var skipped: UInt64 = 0

        for listingId in self.marketplaceListings.keys {
            if let listing = self.marketplaceListings[listingId] {
                if listing.status == "active" {
                    if skipped < offset {
                        skipped = skipped + 1
                        continue
                    }
                    
                    if count < limit {
                        listings.append(listing)
                        count = count + 1
                    } else {
                        break
                    }
                }
            }
        }

        return listings
    }

    // Get user's listings
    access(all) fun getUserListings(user: Address): [MarketplaceListing] {
        let listings: [MarketplaceListing] = []
        
        if let userListingIds = self.userListings[user] {
            for listingId in userListingIds {
                if let listing = self.marketplaceListings[listingId] {
                    listings.append(listing)
                }
            }
        }

        return listings
    }

    // Get marketplace statistics
    access(all) fun getMarketplaceStats(): {String: UFix64} {
        var totalListings: UFix64 = 0.0
        var activeListings: UFix64 = 0.0
        var totalVolume: UFix64 = 0.0
        var totalFees: UFix64 = 0.0

        for listingId in self.marketplaceListings.keys {
            if let listing = self.marketplaceListings[listingId] {
                totalListings = totalListings + 1.0
                
                if listing.status == "active" {
                    activeListings = activeListings + 1.0
                } else if listing.status == "sold" {
                    totalVolume = totalVolume + listing.price
                    totalFees = totalFees + (listing.price * self.marketplaceFeePercentage)
                }
            }
        }

        return {
            "totalListings": totalListings,
            "activeListings": activeListings,
            "totalVolume": totalVolume,
            "totalFees": totalFees,
            "averagePrice": activeListings > 0.0 ? totalVolume / activeListings : 0.0
        }
    }

    // Check if NFT is listed for sale
    access(all) fun isNFTListed(momentId: UInt64): Bool {
        return self.activeListingsByMoment.containsKey(momentId)
    }

    // Get listing ID for a moment
    access(all) fun getListingIdForMoment(momentId: UInt64): UInt64? {
        return self.activeListingsByMoment[momentId]
    }
    
    init() {
        // Initialize paths
        self.AdminStoragePath = /storage/ShotCallerAdmin
        self.PlayerStoragePath = /storage/ShotCallerPlayer
        self.PlayerPublicPath = /public/ShotCallerPlayer
        self.TreasuryStoragePath = /storage/ShotCallerTreasury
        
        // Initialize state
        self.nextContestId = 1
        self.nextTournamentId = 1
        self.nextListingId = 1
        self.nextBoosterId = 1
        self.contests = {}
        self.tournaments = {}
        self.contestLineups = {}
        self.tournamentLineups = {}
        self.players = {}
        self.rewardVaults <- {}
        
        // Initialize marketplace state
        self.marketplaceListings = {}
        self.activeListingsByMoment = {}
        self.userListings = {}
        self.marketplaceFeePercentage = 0.03 // 3%
        
        // Initialize booster state
        self.boosters = {}
        self.userBoosters = {}
        self.activeBoosters = {}
        self.disneyBoosterMappings = {}
        self.boosterMarketplace = {}
        
        // Create and store admin resource
        let admin <- create Admin()
        self.account.storage.save(<-admin, to: self.AdminStoragePath)
        
        // Create and store treasury resource
        let treasury <- create Treasury()
        self.account.storage.save(<-treasury, to: self.TreasuryStoragePath)
    }
}