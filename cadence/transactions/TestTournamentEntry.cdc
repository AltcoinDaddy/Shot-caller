import ShotCaller from "ShotCaller"
import FlowToken from 0x7e60df042a9c0868
import FungibleToken from 0x9a0766d93b6608b7

transaction(tournamentId: UInt64, entryFee: UFix64) {
    let paymentVault: @FlowToken.Vault
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Get a reference to the signer's stored vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to the owner's Vault!")

        // Withdraw tokens from the signer's stored vault
        self.paymentVault <- vaultRef.withdraw(amount: entryFee) as! @FlowToken.Vault
    }

    execute {
        // Join tournament with entry fee
        ShotCaller.joinTournament(tournamentId: tournamentId, entryFeePayment: <-self.paymentVault)
    }
}