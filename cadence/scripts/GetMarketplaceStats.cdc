// Script to get marketplace statistics

import ShotCaller from "../contracts/ShotCaller.cdc"

access(all) fun main(): {String: UFix64} {
    return ShotCaller.getMarketplaceStats()
}