import ShotCaller from "../contracts/ShotCaller.cdc"

access(all) fun main(userAddress: Address): [ShotCaller.Booster] {
    let shotCallerRef = getAccount(0xf8d6e0586b0a20c7).contracts.borrow<&ShotCaller>(name: "ShotCaller")
        ?? panic("Could not borrow reference to ShotCaller contract")

    let activeBoosterIds = shotCallerRef.getUserActiveBoosters(user: userAddress)
    let activeBoosters: [ShotCaller.Booster] = []

    for boosterId in activeBoosterIds {
        if let booster = shotCallerRef.getBooster(boosterId: boosterId) {
            activeBoosters.append(booster)
        }
    }

    return activeBoosters
}