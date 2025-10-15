import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import ShotCaller from "../contracts/ShotCaller.cdc"

transaction(boosterType: String, flowAmount: UFix64) {
    let paymentVault: @FlowToken.Vault
    let shotCallerRef: &ShotCaller

    prepare(signer: auth(BorrowValue) &Account) {
        // Get reference to the signer's Flow Token Vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow reference to the owner's Vault!")

        // Withdraw tokens from the signer's stored vault
        self.paymentVault <- vaultRef.withdraw(amount: flowAmount) as! @FlowToken.Vault

        // Get reference to ShotCaller contract
        self.shotCallerRef = getAccount(0xf8d6e0586b0a20c7).contracts.borrow<&ShotCaller>(name: "ShotCaller")
            ?? panic("Could not borrow reference to ShotCaller contract")
    }

    execute {
        // Purchase the booster
        let boosterId = self.shotCallerRef.purchaseBooster(
            boosterType: boosterType,
            payment: <-self.paymentVault
        )

        log("Booster purchased successfully with ID: ".concat(boosterId.toString()))
    }
}