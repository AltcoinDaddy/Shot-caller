// Transaction to purchase NFT from marketplace

import ShotCaller from "../contracts/ShotCaller.cdc"
import FlowToken from "FlowToken"
import FungibleToken from "FungibleToken"

transaction(listingId: UInt64, amount: UFix64) {
    
    let paymentVault: @FlowToken.Vault
    let buyerAddress: Address
    
    prepare(signer: auth(Storage) &Account) {
        // Capture the signer's address for use in execute phase
        self.buyerAddress = signer.address
        
        // Get the signer's Flow token vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to the owner's Vault!")
        
        // Withdraw the payment amount
        self.paymentVault <- vaultRef.withdraw(amount: amount) as! @FlowToken.Vault
    }
    
    execute {
        ShotCaller.purchaseNFT(
            listingId: listingId,
            payment: <-self.paymentVault,
            buyer: self.buyerAddress
        )
        
        log("NFT purchased successfully!")
    }
}