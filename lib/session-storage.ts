// Session storage utilities for persisting user authentication state

interface UserSession {
  address: string;
  timestamp: number;
  services?: any[];
}

const SESSION_KEY = 'shotcaller_user_session';
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const sessionStorage = {
  // Save user session to localStorage
  saveSession: (address: string, services?: any[]): void => {
    try {
      const session: UserSession = {
        address,
        timestamp: Date.now(),
        services,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  },

  // Get user session from localStorage
  getSession: (): UserSession | null => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) return null;

      const session: UserSession = JSON.parse(sessionData);
      
      // Check if session has expired
      if (Date.now() - session.timestamp > SESSION_EXPIRY) {
        sessionStorage.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  },

  // Clear user session from localStorage
  clearSession: (): void => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  },

  // Check if session exists and is valid
  hasValidSession: (): boolean => {
    const session = sessionStorage.getSession();
    return session !== null;
  },

  // Update session timestamp (extend session)
  refreshSession: (): void => {
    const session = sessionStorage.getSession();
    if (session) {
      sessionStorage.saveSession(session.address, session.services);
    }
  },
};

// Wallet address validation utility
export const validateFlowAddress = (address: string): boolean => {
  // Flow addresses are 16 characters long and start with 0x
  const flowAddressRegex = /^0x[a-fA-F0-9]{16}$/;
  return flowAddressRegex.test(address);
};

// Format Flow address for display
export const formatFlowAddress = (address: string, length: number = 8): string => {
  if (!address || !validateFlowAddress(address)) return '';
  
  if (address.length <= length + 2) return address; // +2 for '0x'
  
  const start = address.slice(0, Math.ceil(length / 2) + 2);
  const end = address.slice(-Math.floor(length / 2));
  return `${start}...${end}`;
};