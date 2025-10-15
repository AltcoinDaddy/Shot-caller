// Transaction to list NFT for sale in marketplace

import ShotCaller from "../contracts/ShotCaller.cdc"

transaction(momentId: UInt64, price: UFix64) {
    
    let sellerAddress: Address
    
    prepare(signer: auth(Storage) &Account) {
        // Capture the signer's address for use in execute phase
        self.sellerAddress = signer.address
        
        // In production, verify NFT ownership here
        // This would check the signer's NBA Top Shot or NFL All Day collection
    }
    
    execute {
        let listingId = ShotCaller.listNFTForSale(
            seller: self.sellerAddress,
            momentId: momentId,
            price: price
        )
        
        log("NFT listed for sale with listing ID: ".concat(listingId.toString()))
    }
}