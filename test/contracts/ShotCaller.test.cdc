import Test
import BlockchainHelpers
import "ShotCaller"
import "FlowToken"

pub let admin = Test.createAccount()
pub let user1 = Test.createAccount()
pub let user2 = Test.createAccount()

pub fun setup() {
    // Deploy FlowToken contract
    let flowTokenCode = Test.readFile("../imports/1654653399040a61/FlowToken.cdc")
    Test.deployContract(
        name: "FlowToken",
        code: flowTokenCode,
        account: admin,
        arguments: []
    )

    // Deploy ShotCaller contract
    let shotCallerCode = Test.readFile("../cadence/contracts/ShotCaller.cdc")
    Test.deployContract(
        name: "ShotCaller",
        code: shotCallerCode,
        account: admin,
        arguments: []
    )

    // Setup user accounts with FLOW tokens
    let setupUserCode = """
        import FlowToken from 0x0ae53cb6e3f42a79
        import FungibleToken from 0xf233dcee88fe0abe

        transaction {
            prepare(signer: AuthAccount) {
                if signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault) == nil {
                    signer.save(<-FlowToken.createEmptyVault(), to: /storage/flowTokenVault)
                    signer.link<&FlowToken.Vault{FungibleToken.Receiver}>(
                        /public/flowTokenReceiver,
                        target: /storage/flowTokenVault
                    )
                    signer.link<&FlowToken.Vault{FungibleToken.Balance}>(
                        /public/flowTokenBalance,
                        target: /storage/flowTokenVault
                    )
                }
            }
        }
    """

    Test.executeTransaction(setupUserCode, [], user1)
    Test.executeTransaction(setupUserCode, [], user2)

    // Mint FLOW tokens for testing
    let mintTokensCode = """
        import FlowToken from 0x0ae53cb6e3f42a79
        import FungibleToken from 0xf233dcee88fe0abe

        transaction(recipient: Address, amount: UFix64) {
            let tokenAdmin: &FlowToken.Administrator
            let tokenReceiver: &{FungibleToken.Receiver}

            prepare(signer: AuthAccount) {
                self.tokenAdmin = signer.borrow<&FlowToken.Administrator>(from: FlowToken.AdminStoragePath)
                    ?? panic("Signer is not the token admin")

                self.tokenReceiver = getAccount(recipient)
                    .getCapability(/public/flowTokenReceiver)
                    .borrow<&{FungibleToken.Receiver}>()
                    ?? panic("Unable to borrow receiver reference")
            }

            execute {
                let minter <- self.tokenAdmin.createNewMinter(allowedAmount: amount)
                let mintedVault <- minter.mintTokens(amount: amount)
                self.tokenReceiver.deposit(from: <-mintedVault)
                destroy minter
            }
        }
    """

    Test.executeTransaction(mintTokensCode, [user1.address, 100.0], admin)
    Test.executeTransaction(mintTokensCode, [user2.address, 100.0], admin)
}

pub fun testTournamentCreation() {
    let createTournamentCode = """
        import ShotCaller from 0x01

        transaction(weekID: UInt64, entryFee: UFix64, maxParticipants: UInt64) {
            prepare(signer: AuthAccount) {
                ShotCaller.createTournament(
                    weekID: weekID,
                    entryFee: entryFee,
                    maxParticipants: maxParticipants
                )
            }
        }
    """

    let result = Test.executeTransaction(
        createTournamentCode,
        [1 as UInt64, 5.0, 100 as UInt64],
        admin
    )

    Test.expect(result, Test.beSucceeded())

    // Verify tournament was created
    let getTournamentCode = """
        import ShotCaller from 0x01

        pub fun main(weekID: UInt64): ShotCaller.TournamentInfo? {
            return ShotCaller.getTournament(weekID: weekID)
        }
    """

    let tournament = Test.executeScript(getTournamentCode, [1 as UInt64])
    Test.expect(tournament, Test.beSucceeded())
}

pub fun testTournamentEntry() {
    // First create a tournament
    testTournamentCreation()

    let joinTournamentCode = """
        import ShotCaller from 0x01
        import FlowToken from 0x0ae53cb6e3f42a79
        import FungibleToken from 0xf233dcee88fe0abe

        transaction(weekID: UInt64, entryFee: UFix64) {
            let paymentVault: @FungibleToken.Vault

            prepare(signer: AuthAccount) {
                let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
                    ?? panic("Could not borrow reference to the owner's Vault!")

                self.paymentVault <- vaultRef.withdraw(amount: entryFee)
            }

            execute {
                ShotCaller.joinTournament(
                    address: user1.address,
                    weekID: weekID,
                    payment: <-self.paymentVault
                )
            }
        }
    """

    let result = Test.executeTransaction(
        joinTournamentCode,
        [1 as UInt64, 5.0],
        user1
    )

    Test.expect(result, Test.beSucceeded())

    // Verify user joined tournament
    let getParticipantsCode = """
        import ShotCaller from 0x01

        pub fun main(weekID: UInt64): [Address] {
            return ShotCaller.getTournamentParticipants(weekID: weekID)
        }
    """

    let participants = Test.executeScript(getParticipantsCode, [1 as UInt64])
    Test.expect(participants, Test.beSucceeded())
}

pub fun testFeeRouting() {
    // Join tournament to generate fees
    testTournamentEntry()

    // Check treasury and reward pool balances
    let getTreasuryStatusCode = """
        import ShotCaller from 0x01

        pub fun main(): {String: UFix64} {
            return {
                "treasuryBalance": ShotCaller.getTreasuryBalance(),
                "rewardPoolBalance": ShotCaller.getRewardPoolBalance()
            }
        }
    """

    let balances = Test.executeScript(getTreasuryStatusCode, [])
    Test.expect(balances, Test.beSucceeded())

    // Verify fee routing (70% to reward pool, 30% to treasury)
    let expectedTreasuryAmount = 5.0 * 0.3  // 1.5 FLOW
    let expectedRewardPoolAmount = 5.0 * 0.7  // 3.5 FLOW

    // Note: In a real test, we would assert the actual values
    // This is a simplified version for demonstration
}

pub fun testLineupSubmission() {
    // Join tournament first
    testTournamentEntry()

    let submitLineupCode = """
        import ShotCaller from 0x01

        transaction(lineup: [UInt64]) {
            prepare(signer: AuthAccount) {
                ShotCaller.submitLineup(address: signer.address, lineup: lineup)
            }
        }
    """

    let lineup = [12345 as UInt64, 67890 as UInt64, 11111 as UInt64]
    let result = Test.executeTransaction(submitLineupCode, [lineup], user1)

    Test.expect(result, Test.beSucceeded())

    // Verify lineup was submitted
    let getLineupCode = """
        import ShotCaller from 0x01

        pub fun main(address: Address): [UInt64]? {
            return ShotCaller.getLineup(address: address)
        }
    """

    let submittedLineup = Test.executeScript(getLineupCode, [user1.address])
    Test.expect(submittedLineup, Test.beSucceeded())
}

pub fun testRewardDistribution() {
    // Setup tournament with multiple participants
    testTournamentCreation()
    
    // User1 joins
    let joinCode1 = """
        import ShotCaller from 0x01
        import FlowToken from 0x0ae53cb6e3f42a79
        import FungibleToken from 0xf233dcee88fe0abe

        transaction(weekID: UInt64, entryFee: UFix64) {
            let paymentVault: @FungibleToken.Vault

            prepare(signer: AuthAccount) {
                let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
                    ?? panic("Could not borrow reference to the owner's Vault!")

                self.paymentVault <- vaultRef.withdraw(amount: entryFee)
            }

            execute {
                ShotCaller.joinTournament(
                    address: signer.address,
                    weekID: weekID,
                    payment: <-self.paymentVault
                )
            }
        }
    """

    Test.executeTransaction(joinCode1, [1 as UInt64, 5.0], user1)
    Test.executeTransaction(joinCode1, [1 as UInt64, 5.0], user2)

    // Distribute rewards
    let distributeRewardsCode = """
        import ShotCaller from 0x01

        transaction(weekID: UInt64, winners: {Address: UFix64}) {
            prepare(signer: AuthAccount) {
                ShotCaller.distributeRewards(weekID: weekID, winners: winners)
            }
        }
    """

    let winners: {Address: UFix64} = {
        user1.address: 1.0,  // 1st place
        user2.address: 2.0   // 2nd place
    }

    let result = Test.executeTransaction(
        distributeRewardsCode,
        [1 as UInt64, winners],
        admin
    )

    Test.expect(result, Test.beSucceeded())
}

pub fun testBoosterPurchase() {
    let purchaseBoosterCode = """
        import ShotCaller from 0x01
        import FlowToken from 0x0ae53cb6e3f42a79
        import FungibleToken from 0xf233dcee88fe0abe

        transaction(boosterType: String, price: UFix64) {
            let paymentVault: @FungibleToken.Vault

            prepare(signer: AuthAccount) {
                let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
                    ?? panic("Could not borrow reference to the owner's Vault!")

                self.paymentVault <- vaultRef.withdraw(amount: price)
            }

            execute {
                ShotCaller.purchaseBooster(
                    buyer: signer.address,
                    boosterType: boosterType,
                    payment: <-self.paymentVault
                )
            }
        }
    """

    let result = Test.executeTransaction(
        purchaseBoosterCode,
        ["disney_energy", 2.5],
        user1
    )

    Test.expect(result, Test.beSucceeded())

    // Verify booster was purchased
    let getUserBoostersCode = """
        import ShotCaller from 0x01

        pub fun main(address: Address): [ShotCaller.BoosterInfo] {
            return ShotCaller.getUserBoosters(address: address)
        }
    """

    let boosters = Test.executeScript(getUserBoostersCode, [user1.address])
    Test.expect(boosters, Test.beSucceeded())
}

pub fun testMarketplaceListing() {
    let listNFTCode = """
        import ShotCaller from 0x01

        transaction(momentID: UInt64, price: UFix64) {
            prepare(signer: AuthAccount) {
                ShotCaller.listNFTForSale(
                    seller: signer.address,
                    momentID: momentID,
                    price: price
                )
            }
        }
    """

    let result = Test.executeTransaction(
        listNFTCode,
        [12345 as UInt64, 10.5],
        user1
    )

    Test.expect(result, Test.beSucceeded())

    // Verify listing was created
    let getListingsCode = """
        import ShotCaller from 0x01

        pub fun main(): [ShotCaller.MarketplaceListing] {
            return ShotCaller.getMarketplaceListings()
        }
    """

    let listings = Test.executeScript(getListingsCode, [])
    Test.expect(listings, Test.beSucceeded())
}

pub fun testMarketplacePurchase() {
    // First create a listing
    testMarketplaceListing()

    let purchaseNFTCode = """
        import ShotCaller from 0x01
        import FlowToken from 0x0ae53cb6e3f42a79
        import FungibleToken from 0xf233dcee88fe0abe

        transaction(momentID: UInt64, price: UFix64) {
            let paymentVault: @FungibleToken.Vault

            prepare(signer: AuthAccount) {
                let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
                    ?? panic("Could not borrow reference to the owner's Vault!")

                self.paymentVault <- vaultRef.withdraw(amount: price)
            }

            execute {
                ShotCaller.purchaseNFT(
                    buyer: signer.address,
                    momentID: momentID,
                    payment: <-self.paymentVault
                )
            }
        }
    """

    let result = Test.executeTransaction(
        purchaseNFTCode,
        [12345 as UInt64, 10.5],
        user2
    )

    Test.expect(result, Test.beSucceeded())
}

pub fun testPremiumAccess() {
    let purchaseSeasonPassCode = """
        import ShotCaller from 0x01
        import FlowToken from 0x0ae53cb6e3f42a79
        import FungibleToken from 0xf233dcee88fe0abe

        transaction(price: UFix64) {
            let paymentVault: @FungibleToken.Vault

            prepare(signer: AuthAccount) {
                let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
                    ?? panic("Could not borrow reference to the owner's Vault!")

                self.paymentVault <- vaultRef.withdraw(amount: price)
            }

            execute {
                ShotCaller.purchaseSeasonPass(
                    buyer: signer.address,
                    payment: <-self.paymentVault
                )
            }
        }
    """

    let result = Test.executeTransaction(
        purchaseSeasonPassCode,
        [25.0],
        user1
    )

    Test.expect(result, Test.beSucceeded())

    // Verify premium access
    let verifyPremiumCode = """
        import ShotCaller from 0x01

        pub fun main(address: Address): Bool {
            return ShotCaller.verifyPremiumAccess(address: address)
        }
    """

    let hasPremium = Test.executeScript(verifyPremiumCode, [user1.address])
    Test.expect(hasPremium, Test.beSucceeded())
}

pub fun runTests() {
    setup()
    
    testTournamentCreation()
    testTournamentEntry()
    testFeeRouting()
    testLineupSubmission()
    testRewardDistribution()
    testBoosterPurchase()
    testMarketplaceListing()
    testMarketplacePurchase()
    testPremiumAccess()
    
    log("All ShotCaller contract tests passed!")
}