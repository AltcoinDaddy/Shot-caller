import ShotCaller from "../contracts/ShotCaller.cdc"

transaction(nftId: UInt64) {
    let shotCallerRef: &ShotCaller

    prepare(signer: auth(BorrowValue) &Account) {
        // Get reference to ShotCaller contract
        self.shotCallerRef = getAccount(0xf8d6e0586b0a20c7).contracts.borrow<&ShotCaller>(name: "ShotCaller")
            ?? panic("Could not borrow reference to ShotCaller contract")
    }

    execute {
        // Detect Disney booster for the NFT
        let boosterId = self.shotCallerRef.detectDisneyBooster(
            nftId: nftId,
            owner: signer.address
        )

        if let id = boosterId {
            log("Disney booster detected and created with ID: ".concat(id.toString()))
        } else {
            log("No booster mapping found for NFT ID: ".concat(nftId.toString()))
        }
    }
}