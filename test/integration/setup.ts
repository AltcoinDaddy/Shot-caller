import { vi } from 'vitest'

// Mock environment variables for integration tests
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE = 'https://rest-testnet.onflow.org'
process.env.NBA_API_KEY = 'test-nba-key'
process.env.NFL_API_KEY = 'test-nfl-key'
process.env.FINDLABS_API_KEY = 'test-findlabs-key'
process.env.REDIS_URL = 'redis://localhost:6379'

// Mock external APIs
vi.mock('node-fetch', () => ({
  default: vi.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: [] }),
    text: () => Promise.resolve(''),
  })),
}))

// Mock Redis
vi.mock('ioredis', () => ({
  default: vi.fn(() => ({
    get: vi.fn(() => Promise.resolve(null)),
    set: vi.fn(() => Promise.resolve('OK')),
    del: vi.fn(() => Promise.resolve(1)),
    exists: vi.fn(() => Promise.resolve(0)),
    expire: vi.fn(() => Promise.resolve(1)),
    disconnect: vi.fn(),
  })),
}))

// Mock Supabase for integration tests
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table) => ({
      select: vi.fn(() => Promise.resolve({ 
        data: table === 'users' ? [{ id: '1', wallet_address: '0x123' }] : [], 
        error: null 
      })),
      insert: vi.fn(() => Promise.resolve({ 
        data: [{ id: '1' }], 
        error: null 
      })),
      update: vi.fn(() => Promise.resolve({ 
        data: [{ id: '1' }], 
        error: null 
      })),
      delete: vi.fn(() => Promise.resolve({ 
        data: [], 
        error: null 
      })),
      upsert: vi.fn(() => Promise.resolve({ 
        data: [{ id: '1' }], 
        error: null 
      })),
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: '1', email: 'test@example.com' } }, 
        error: null 
      })),
    },
  })),
}))

// Mock Flow FCL for integration tests
vi.mock('@onflow/fcl', () => ({
  query: vi.fn(() => Promise.resolve([])),
  mutate: vi.fn(() => Promise.resolve({ transactionId: '0x123' })),
  send: vi.fn(() => Promise.resolve({})),
  decode: vi.fn(() => Promise.resolve({})),
  config: vi.fn(),
}))