import ShotCaller from 0x8af82e4a2496860b

transaction() {
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Get a reference to the Admin resource
        let adminRef = signer.storage.borrow<&ShotCaller.Admin>(from: ShotCaller.AdminStoragePath)
            ?? panic("Could not borrow reference to the Admin resource!")

        // Setup the booster marketplace
        adminRef.setupBoosterMarketplace()
        
        log("Booster marketplace setup complete")
    }
}