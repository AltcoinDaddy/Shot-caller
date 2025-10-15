import ShotCaller from "../contracts/ShotCaller.cdc"

access(all) fun main(): {String: {String: AnyStruct}} {
    let shotCallerRef = getAccount(0xf8d6e0586b0a20c7).contracts.borrow<&ShotCaller>(name: "ShotCaller")
        ?? panic("Could not borrow reference to ShotCaller contract")

    return shotCallerRef.getBoosterMarketplace()
}