import ShotCaller from "ShotCaller"
import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import NonFungibleToken from "NonFungibleToken"
transaction(amount: UFix64) {
    let paymentVault: @FlowToken.Vault
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Get a reference to the signer's stored vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to the owner's Vault!")

        // Withdraw tokens from the signer's stored vault
        self.paymentVault <- vaultRef.withdraw(amount: amount) as! @FlowToken.Vault
    }

    execute {
        // Test fee collection (this would normally be called internally)
        let remainingVault <- ShotCaller.collectFee(from: <-self.paymentVault)
        
        // Return any remaining tokens to the treasury (should be empty)
        destroy remainingVault
    }
}