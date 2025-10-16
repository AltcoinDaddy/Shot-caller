import ShotCaller from "ShotCaller"

transaction(tournamentId: UInt64) {
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Get a reference to the Admin resource
        let adminRef = signer.storage.borrow<&ShotCaller.Admin>(from: ShotCaller.AdminStoragePath)
            ?? panic("Could not borrow reference to the Admin resource!")

        // Create mock rankings for testing (in production this would come from actual scoring)
        let rankings: {Address: UInt64} = {
            0x8af82e4a2496860b: 1  // Test account gets 1st place
        }

        // Distribute tournament rewards
        adminRef.distributeTournamentRewards(
            tournamentId: tournamentId,
            rankings: rankings
        )
        
        log("Tournament rewards distributed successfully")
    }
}