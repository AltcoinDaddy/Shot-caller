import * as fcl from "@onflow/fcl";

// Configure FCL for testnet
fcl.config({
  "accessNode.api": "https://rest-testnet.onflow.org",
  "0xShotCaller": "0x8af82e4a2496860b",
  "0xFlowToken": "0x7e60df042a9c0868",
});

// Test script to query treasury balances
const getTreasuryBalances = async () => {
  const script = `
    import ShotCaller from 0x8af82e4a2496860b

    access(all) fun main(): {String: UFix64} {
      return ShotCaller.getTreasuryBalances()
    }
  `;

  try {
    const result = await fcl.query({
      cadence: script,
    });
    
    console.log("Treasury Balances:", result);
    return result;
  } catch (error) {
    console.error("Error querying treasury balances:", error);
    throw error;
  }
};

// Test script to get active tournaments
const getActiveTournaments = async () => {
  const script = `
    import ShotCaller from 0x8af82e4a2496860b

    access(all) fun main(): [ShotCaller.Tournament] {
      return ShotCaller.getActiveTournaments()
    }
  `;

  try {
    const result = await fcl.query({
      cadence: script,
    });
    
    console.log("Active Tournaments:", result);
    return result;
  } catch (error) {
    console.error("Error querying active tournaments:", error);
    throw error;
  }
};

// Test script to get booster marketplace
const getBoosterMarketplace = async () => {
  const script = `
    import ShotCaller from 0x8af82e4a2496860b

    access(all) fun main(): {String: {String: AnyStruct}} {
      return ShotCaller.getBoosterMarketplace()
    }
  `;

  try {
    const result = await fcl.query({
      cadence: script,
    });
    
    console.log("Booster Marketplace:", result);
    return result;
  } catch (error) {
    console.error("Error querying booster marketplace:", error);
    throw error;
  }
};

// Run all tests
const runTests = async () => {
  console.log("🚀 Testing ShotCaller contract integration on Flow Testnet...\n");
  
  try {
    console.log("1. Testing Treasury Balances...");
    await getTreasuryBalances();
    console.log("✅ Treasury balances test passed\n");

    console.log("2. Testing Active Tournaments...");
    await getActiveTournaments();
    console.log("✅ Active tournaments test passed\n");

    console.log("3. Testing Booster Marketplace...");
    await getBoosterMarketplace();
    console.log("✅ Booster marketplace test passed\n");

    console.log("🎉 All contract integration tests passed!");
  } catch (error) {
    console.error("❌ Contract integration test failed:", error);
    process.exit(1);
  }
};

// Run the tests
runTests();