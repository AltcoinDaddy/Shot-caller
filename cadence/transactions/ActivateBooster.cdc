import ShotCaller from "../contracts/ShotCaller.cdc"

transaction(boosterId: UInt64, lineupId: UInt64) {
    let shotCallerRef: &ShotCaller

    prepare(signer: auth(BorrowValue) &Account) {
        // Get reference to ShotCaller contract
        self.shotCallerRef = getAccount(0xf8d6e0586b0a20c7).contracts.borrow<&ShotCaller>(name: "ShotCaller")
            ?? panic("Could not borrow reference to ShotCaller contract")
    }

    execute {
        // Activate the booster
        self.shotCallerRef.activateBooster(
            boosterId: boosterId,
            lineupId: lineupId
        )

        log("Booster activated successfully for lineup: ".concat(lineupId.toString()))
    }
}