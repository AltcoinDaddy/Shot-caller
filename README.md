# 🏆 ShotCaller - NFT Fantasy Sports Platform

**Transform your NBA Top Shot and NFL All Day NFTs into competitive fantasy game assets**

ShotCaller is a revolutionary fantasy sports platform built on the Flow blockchain that allows users to leverage their NBA Top Shot and NFL All Day NFT collections to compete in weekly fantasy contests, earn rewards, and climb leaderboards.

## 🎯 Overview

ShotCaller bridges the gap between NFT collecting and fantasy sports by turning static digital collectibles into active gaming assets. Users connect their Dapper wallets, build lineups using their NFT moments, and compete based on real-world athlete performance.

### Key Features

- **NFT-Powered Fantasy Sports**: Use your NBA Top Shot and NFL All Day moments as fantasy players
- **Weekly Competitions**: Compete in weekly contests with real-time scoring
- **Blockchain Rewards**: Earn FLOW tokens and exclusive NFTs for top performance
- **Marketplace Trading**: Buy and sell NFT moments with other users
- **Premium Features**: Advanced analytics, lineup optimization, and exclusive tournaments
- **Treasury System**: Community-driven reward distribution and sponsorship integration

## 🚀 Quick Start

### Prerequisites

- **Flow Wallet**: Dapper Wallet, Flow Wallet, or Blocto
- **NFT Collection**: NBA Top Shot or NFL All Day moments
- **FLOW Tokens**: For marketplace transactions and premium features

### Getting Started

1. **Connect Your Wallet**
   ```
   Visit https://shotcaller.app
   Click "Connect Wallet"
   Authorize with your Flow wallet
   ```

2. **Verify Your NFTs**
   ```
   Your collection will be automatically synced
   Eligible NFTs will appear in your profile
   ```

3. **Build Your Team**
   ```
   Navigate to "My Team"
   Select up to 5 NFTs for your lineup
   Submit your lineup before weekly deadlines
   ```

4. **Compete & Earn**
   ```
   Track your performance on the leaderboard
   Earn points based on real athlete stats
   Claim rewards for top finishes
   ```

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 15.2.4, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4.1.9, shadcn/ui components
- **Blockchain**: Flow blockchain, Cadence smart contracts
- **Database**: Supabase (PostgreSQL)
- **Caching**: Redis for performance optimization
- **Authentication**: Flow wallet integration (@onflow/fcl)
- **Testing**: Vitest, Playwright, Cadence Test Framework

### Project Structure

```
shotcaller/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes and endpoints
│   ├── dashboard/         # User dashboard
│   ├── marketplace/       # NFT trading marketplace
│   ├── team/             # Team management
│   ├── leaderboard/      # Competition rankings
│   ├── profile/          # User profiles
│   ├── premium/          # Premium features
│   ├── treasury/         # Treasury management
│   └── results/          # Contest results
├── components/            # Reusable React components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and services
├── contexts/             # React context providers
├── cadence/              # Flow smart contracts
├── test/                 # Test suites
└── docs/                 # Documentation
```

## 🎮 Core Features

### 1. Team Management
- **Lineup Builder**: Select up to 5 NFTs from your collection
- **Position Requirements**: Strategic team composition
- **Deadline Management**: Submit lineups before weekly cutoffs
- **Performance Tracking**: Real-time scoring updates

### 2. Fantasy Scoring System
- **NBA Scoring**: Points, rebounds, assists, steals, blocks
- **NFL Scoring**: Passing/rushing yards, touchdowns, receptions
- **Bonus Multipliers**: Rare NFTs provide scoring bonuses
- **Weekly Updates**: Automated scoring from official league data

### 3. NFT Marketplace
- **Buy/Sell NFTs**: Trade moments with other users
- **FLOW Payments**: Secure blockchain transactions
- **Price Discovery**: Market-driven pricing
- **Filtering & Search**: Find specific players, teams, rarities

### 4. Leaderboard & Competitions
- **Weekly Contests**: Regular competition cycles
- **Season Rankings**: Long-term performance tracking
- **Prize Pools**: FLOW token rewards for top performers
- **Achievement System**: Unlock badges and milestones

### 5. Premium Features
- **Advanced Analytics**: Detailed performance insights
- **Lineup Optimization**: AI-powered team suggestions
- **Exclusive Tournaments**: Premium-only competitions
- **Priority Support**: Enhanced customer service

### 6. Treasury System
- **Community Rewards**: Distributed prize pools
- **Sponsorship Integration**: Brand partnerships and sponsored tournaments
- **Governance**: Community voting on platform decisions
- **Revenue Sharing**: Transparent fee distribution

## 🔧 Development Setup

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/shotcaller.git
cd shotcaller

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Set up database
pnpm db:setup

# Start development server
pnpm dev
```

### Environment Variables

```bash
# Flow Configuration
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
FLOW_PRIVATE_KEY=your_private_key

# Database
DATABASE_URL=your_supabase_url
DATABASE_ANON_KEY=your_supabase_anon_key

# Redis Cache
REDIS_URL=your_redis_url

# API Keys
FINDLABS_API_KEY=your_findlabs_key
SPORTS_DATA_API_KEY=your_sports_api_key
```

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Testing
pnpm test             # Run unit tests
pnpm test:e2e         # Run end-to-end tests
pnpm test:contracts   # Test Cadence contracts
pnpm test:integration # Run integration tests

# Database
pnpm db:migrate       # Run database migrations
pnpm db:seed          # Seed with sample data
pnpm db:reset         # Reset database

# Deployment
pnpm deploy:staging   # Deploy to staging
pnpm deploy:production # Deploy to production
```

## 🎯 API Reference

### Authentication
All API endpoints require Flow wallet authentication via FCL.

### Core Endpoints

#### NFT Management
```
GET /api/nfts                    # Get user's NFT collection
GET /api/nfts/verify/:momentId   # Verify NFT ownership
POST /api/nfts/sync              # Sync collection from blockchain
```

#### Team Management
```
GET /api/lineups/current         # Get current lineup
POST /api/lineups/submit         # Submit new lineup
GET /api/lineups/history         # Get lineup history
```

#### Marketplace
```
GET /api/marketplace/listings    # Get marketplace listings
POST /api/marketplace/listings   # Create new listing
POST /api/marketplace/purchase   # Purchase NFT
DELETE /api/marketplace/cancel   # Cancel listing
```

#### Leaderboard
```
GET /api/leaderboard            # Get current rankings
GET /api/leaderboard/history    # Get historical rankings
GET /api/leaderboard/prizes     # Get prize information
```

#### Scoring
```
GET /api/scoring/weekly         # Get weekly scores
GET /api/scoring/breakdown/:id  # Get detailed scoring breakdown
POST /api/scoring/update        # Update scores (admin only)
```

## 🏆 Game Rules

### Lineup Requirements
- **Team Size**: 5 NFTs maximum
- **Position Limits**: Varies by sport and contest type
- **Rarity Bonuses**: Higher rarity NFTs provide scoring multipliers
- **Deadline**: Lineups must be submitted before weekly cutoff

### Scoring System

#### NBA Scoring
- **Points**: 1 point per point scored
- **Rebounds**: 1.2 points per rebound
- **Assists**: 1.5 points per assist
- **Steals/Blocks**: 3 points each
- **Turnovers**: -1 point each

#### NFL Scoring
- **Passing Yards**: 1 point per 25 yards
- **Rushing/Receiving Yards**: 1 point per 10 yards
- **Touchdowns**: 6 points each
- **Interceptions/Fumbles**: -2 points each

### Rarity Multipliers
- **Common**: 1.0x multiplier
- **Rare**: 1.1x multiplier
- **Epic**: 1.25x multiplier
- **Legendary**: 1.5x multiplier

## 💰 Tokenomics

### FLOW Token Usage
- **Entry Fees**: Contest participation (optional)
- **Marketplace**: NFT trading currency
- **Premium**: Subscription payments
- **Rewards**: Prize distribution

### Fee Structure
- **Marketplace Fee**: 3% of transaction value
- **Premium Subscription**: 10 FLOW/month
- **Contest Entry**: Varies by tournament

### Revenue Distribution
- **Treasury**: 30% of fees
- **Reward Pool**: 70% of fees
- **Development**: Funded through treasury

## 🔒 Security

### Smart Contract Security
- **Audited Contracts**: Professional security audits
- **Multi-sig Wallets**: Secure fund management
- **Upgrade Patterns**: Safe contract upgrades

### Data Protection
- **Wallet-Only Auth**: No password storage
- **Encrypted Data**: Sensitive information encryption
- **Privacy Controls**: User data management

### Best Practices
- **Regular Updates**: Security patch deployment
- **Monitoring**: Real-time threat detection
- **Incident Response**: Rapid security response

## 🚀 Deployment

### Staging Environment
```bash
# Deploy to staging
pnpm deploy:staging

# Run health checks
pnpm health:check

# Monitor metrics
pnpm monitor:metrics
```

### Production Deployment
```bash
# Validate environment
pnpm validate:env

# Deploy to production
pnpm deploy:production

# Set up production database
pnpm setup:production-db
```

### Infrastructure
- **Hosting**: Vercel for frontend, Railway for backend services
- **Database**: Supabase (managed PostgreSQL)
- **CDN**: Vercel Edge Network
- **Monitoring**: Built-in performance monitoring

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user flow testing
- **Contract Tests**: Cadence smart contract testing

### Running Tests
```bash
# All tests
pnpm test

# Specific test suites
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:contracts

# With coverage
pnpm test:coverage
```

## 📊 Performance

### Optimization Features
- **Caching**: Redis for API responses
- **CDN**: Global content delivery
- **Image Optimization**: Next.js image optimization
- **Code Splitting**: Automatic bundle optimization

### Monitoring
- **Real-time Metrics**: Performance tracking
- **Error Tracking**: Automated error reporting
- **User Analytics**: Usage pattern analysis

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

### Pull Request Process
1. Ensure all tests pass
2. Update documentation
3. Add changeset for releases
4. Request code review

## 📚 Documentation

### Additional Resources
- **[Flow Documentation](https://developers.flow.com/)**: Flow blockchain development
- **[Cadence Language](https://cadence-lang.org/)**: Smart contract language
- **[NBA Top Shot API](https://docs.nbatopshot.com/)**: NBA Top Shot integration
- **[NFL All Day API](https://docs.nflallday.com/)**: NFL All Day integration

### Support
- **Discord**: [Join our community](https://discord.gg/shotcaller)
- **Documentation**: [docs.shotcaller.app](https://docs.shotcaller.app)
- **Support Email**: support@shotcaller.app

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Flow Team**: Blockchain infrastructure and support
- **Dapper Labs**: NBA Top Shot and NFL All Day partnerships
- **Community**: Beta testers and early adopters
- **Contributors**: Open source contributors and maintainers

---

**Built with ❤️ on Flow blockchain**

*Transform your NFT collection into a championship fantasy team today!*