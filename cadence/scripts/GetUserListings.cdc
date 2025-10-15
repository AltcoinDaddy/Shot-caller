// Script to get user's marketplace listings

import ShotCaller from "../contracts/ShotCaller.cdc"

access(all) fun main(user: Address): [ShotCaller.MarketplaceListing] {
    return ShotCaller.getUserListings(user: user)
}