import ShotCaller from "ShotCaller"

transaction(weekId: UInt64, entryFee: UFix64, maxParticipants: UInt64) {
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Get a reference to the Admin resource
        let adminRef = signer.storage.borrow<&ShotCaller.Admin>(from: ShotCaller.AdminStoragePath)
            ?? panic("Could not borrow reference to the Admin resource!")

        // Create tournament with start time 1 hour from now and end time 1 week from now
        let currentTime = getCurrentBlock().timestamp
        let startTime = currentTime + 3600.0 // 1 hour from now
        let endTime = startTime + 604800.0   // 1 week later

        let tournamentId = adminRef.createTournament(
            weekId: weekId,
            entryFee: entryFee,
            maxParticipants: maxParticipants,
            startTime: startTime,
            endTime: endTime
        )
        
        log("Created tournament with ID: ".concat(tournamentId.toString()))
    }
}