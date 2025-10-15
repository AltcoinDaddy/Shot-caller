import { fcl } from '@/lib/flow-config';
import { nftOwnershipService } from '@/lib/services/nft-ownership-service';

// Verify wallet address and get account information
export const verifyWalletAddress = async (address: string): Promise<{
  isValid: boolean;
  account?: any;
  error?: string;
}> => {
  try {
    if (!address) {
      return { isValid: false, error: 'No address provided' };
    }

    // Get account information from Flow blockchain
    const account = await fcl.account(address);
    
    if (!account) {
      return { isValid: false, error: 'Account not found' };
    }

    return {
      isValid: true,
      account,
    };
  } catch (error) {
    console.error('Wallet verification failed:', error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
};

// Get Flow balance for an address
export const getFlowBalance = async (address: string): Promise<{
  balance: string;
  error?: string;
}> => {
  try {
    const script = `
      import FlowToken from 0x7e60df042a9c0868

      pub fun main(address: Address): UFix64 {
        let account = getAccount(address)
        let vaultRef = account.getCapability(/public/flowTokenBalance)
          .borrow<&FlowToken.Vault{FlowToken.Balance}>()
          ?? panic("Could not borrow Balance reference to the Vault")
        
        return vaultRef.balance
      }
    `;

    const balance = await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [arg(address, t.Address)],
    });

    return { balance: balance.toString() };
  } catch (error) {
    console.error('Failed to get Flow balance:', error);
    return {
      balance: '0.0',
      error: error instanceof Error ? error.message : 'Failed to get balance',
    };
  }
};

// Check if address owns specific NFT collections
export const checkNFTCollections = async (address: string): Promise<{
  hasTopShot: boolean;
  hasAllDay: boolean;
  collections: string[];
  error?: string;
}> => {
  try {
    const script = `
      import NonFungibleToken from 0x631e88ae7f1d7c20
      import TopShot from 0x877931736ee77cff
      import AllDay from 0x4dfd62c88d1b6462

      pub fun main(address: Address): {String: Bool} {
        let account = getAccount(address)
        let collections: {String: Bool} = {}
        
        // Check for TopShot collection
        let topShotRef = account.getCapability(/public/MomentCollection)
          .borrow<&{TopShot.MomentCollectionPublic}>()
        collections["TopShot"] = topShotRef != nil
        
        // Check for AllDay collection
        let allDayRef = account.getCapability(/public/MomentCollection)
          .borrow<&{AllDay.MomentNFTCollectionPublic}>()
        collections["AllDay"] = allDayRef != nil
        
        return collections
      }
    `;

    const result = await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [arg(address, t.Address)],
    });

    const collections: string[] = [];
    const hasTopShot = result.TopShot || false;
    const hasAllDay = result.AllDay || false;

    if (hasTopShot) collections.push('NBA Top Shot');
    if (hasAllDay) collections.push('NFL All Day');

    return {
      hasTopShot,
      hasAllDay,
      collections,
    };
  } catch (error) {
    console.error('Failed to check NFT collections:', error);
    return {
      hasTopShot: false,
      hasAllDay: false,
      collections: [],
      error: error instanceof Error ? error.message : 'Failed to check collections',
    };
  }
};

// Verify user owns required NFTs for gameplay using enhanced NFT service
export const verifyGameplayEligibility = async (address: string): Promise<{
  isEligible: boolean;
  reason?: string;
  collections: string[];
}> => {
  try {
    // Use the new NFT ownership service for comprehensive verification
    const ownershipResponse = await nftOwnershipService.getOwnership(address);

    if (!ownershipResponse.success) {
      // Fallback to basic collection check if NFT service fails
      const { hasTopShot, hasAllDay, collections, error } = await checkNFTCollections(address);

      if (error) {
        return {
          isEligible: false,
          reason: 'Unable to verify NFT collections',
          collections: [],
        };
      }

      const isEligible = hasTopShot || hasAllDay;
      const reason = isEligible 
        ? undefined 
        : 'You need to own NBA Top Shot or NFL All Day NFTs to play';

      return {
        isEligible,
        reason,
        collections,
      };
    }

    const ownership = ownershipResponse.data!;
    const collectionNames = ownership.collections.map(c => c.collectionName);

    return {
      isEligible: ownership.isEligible,
      reason: ownership.eligibilityReason,
      collections: collectionNames,
    };
  } catch (error) {
    console.error('Failed to verify gameplay eligibility:', error);
    return {
      isEligible: false,
      reason: 'Verification failed',
      collections: [],
    };
  }
};