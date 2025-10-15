import * as fcl from "@onflow/fcl";

// Flow configuration for testnet (development)
const FLOW_CONFIG = {
  "accessNode.api": "https://rest-testnet.onflow.org", // Testnet
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn", // Testnet wallet discovery
  "0xProfile": "0xba1132bc08f82fe2", // Profile contract address on testnet
  "0xFlowToken": "0x7e60df042a9c0868", // FlowToken contract address on testnet
  "0xNonFungibleToken": "0x631e88ae7f1d7c20", // NFT standard on testnet
  "0xTopShot": "0x877931736ee77cff", // NBA Top Shot on testnet
  "0xAllDay": "0x4dfd62c88d1b6462", // NFL All Day on testnet
};

// Wallet service configurations
export const WALLET_SERVICES = {
  DAPPER: {
    id: "0x82ec283f88a62e65", // Dapper Wallet service ID
    name: "Dapper Wallet",
    description: "Connect with your Dapper Wallet to access NBA Top Shot and NFL All Day",
    icon: "🏀",
  },
  FLOW_WALLET: {
    id: "0xead892083b3e2c6c", // Flow Wallet service ID  
    name: "Flow Wallet",
    description: "Connect with Flow Wallet - the official Flow blockchain wallet",
    icon: "💎",
  },
  BLOCTO: {
    id: "0xdb99ee4eaa83f0fc", // Blocto Wallet service ID
    name: "Blocto Wallet", 
    description: "Connect with Blocto - cross-chain wallet supporting Flow",
    icon: "🌊",
  },
};

// Initialize Flow Client Library with multi-wallet support
export const initFlow = () => {
  fcl.config(FLOW_CONFIG);
  configureMultiWallet();
};

// Configure wallet discovery to include multiple wallet options
export const configureMultiWallet = () => {
  fcl.config({
    "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
    "discovery.authn.endpoint": "https://fcl-discovery.onflow.org/api/testnet/authn",
    // Include multiple wallet services for user choice
    "discovery.authn.include": [
      WALLET_SERVICES.DAPPER.id,     // Dapper Wallet (primary for NBA Top Shot/NFL All Day)
      WALLET_SERVICES.FLOW_WALLET.id, // Flow Wallet (official Flow wallet)
      WALLET_SERVICES.BLOCTO.id,     // Blocto (popular multi-chain wallet)
    ],
  });
};

// Dapper Wallet specific configuration (for NBA Top Shot/NFL All Day focus)
export const configureDapperWallet = () => {
  fcl.config({
    "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
    "discovery.authn.endpoint": "https://fcl-discovery.onflow.org/api/testnet/authn",
    "discovery.authn.include": [WALLET_SERVICES.DAPPER.id], // Only Dapper Wallet
  });
};

// Flow Wallet specific configuration
export const configureFlowWallet = () => {
  fcl.config({
    "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
    "discovery.authn.endpoint": "https://fcl-discovery.onflow.org/api/testnet/authn",
    "discovery.authn.include": [WALLET_SERVICES.FLOW_WALLET.id], // Only Flow Wallet
  });
};

// Get wallet service info by service ID
export const getWalletServiceInfo = (serviceId: string) => {
  return Object.values(WALLET_SERVICES).find(service => service.id === serviceId);
};

// Check if connected wallet is Dapper (important for NBA Top Shot/NFL All Day)
export const isDapperWallet = (services?: any[]) => {
  if (!services || services.length === 0) return false;
  return services.some(service => service.id === WALLET_SERVICES.DAPPER.id);
};

// Check if connected wallet is Flow Wallet
export const isFlowWallet = (services?: any[]) => {
  if (!services || services.length === 0) return false;
  return services.some(service => service.id === WALLET_SERVICES.FLOW_WALLET.id);
};

export { fcl };