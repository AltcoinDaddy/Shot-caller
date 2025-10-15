// Transaction to cancel marketplace listing

import ShotCaller from "../contracts/ShotCaller.cdc"

transaction(listingId: UInt64) {
    
    let sellerAddress: Address
    
    prepare(signer: auth(Storage) &Account) {
        // Capture the signer's address for use in execute phase
        self.sellerAddress = signer.address
    }
    
    execute {
        ShotCaller.cancelListing(
            listingId: listingId,
            seller: self.sellerAddress
        )
        
        log("Listing cancelled successfully!")
    }
}