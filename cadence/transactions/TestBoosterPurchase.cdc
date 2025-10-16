import ShotCaller from "ShotCaller"
import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import NonFungibleToken from "NonFungibleToken"

transaction(boosterType: String, flowAmount: UFix64) {
    let paymentVault: @FlowToken.Vault
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Get reference to the signer's Flow Token Vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow reference to the owner's Vault!")

        // Withdraw tokens from the signer's stored vault
        self.paymentVault <- vaultRef.withdraw(amount: flowAmount) as! @FlowToken.Vault
    }

    execute {
        // Purchase the booster
        let boosterId = ShotCaller.purchaseBooster(
            boosterType: boosterType,
            payment: <-self.paymentVault
        )

        log("Booster purchased successfully with ID: ".concat(boosterId.toString()))
    }
}