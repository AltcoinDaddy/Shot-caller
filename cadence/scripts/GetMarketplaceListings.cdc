// Script to get marketplace listings

import ShotCaller from "../contracts/ShotCaller.cdc"

access(all) fun main(limit: UInt64, offset: UInt64): [ShotCaller.MarketplaceListing] {
    return ShotCaller.getActiveListings(limit: limit, offset: offset)
}