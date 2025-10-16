\# Implementation Plan

- [x] 1. Set up project foundation and core infrastructure
  - ✅ Initialize Next.js project with TypeScript and configure essential dependencies
  - ✅ Set up TailwindCSS, shadcn/ui components, and project structure
  - ✅ Configure environment variables and development tools
  - _Requirements: 1.1, 14.4_ (COMPLETED)

- [x] 2. Create basic UI pages and navigation
  - ✅ Create `/marketplace` page for NFT trading with FLOW token pricing
  - ✅ Create `/treasury` page for tournament entry, booster shop, and season pass purchase
  - ✅ Create `/premium` page for advanced analytics and subscription management
  - ✅ Create `/team` page for lineup building and NFT selection
  - ✅ Create `/leaderboard` page for rankings and competition
  - ✅ Update navigation to include all revenue model pages
  - _Requirements: 10.1, 7.1, 9.1, 13.1, 2.1, 4.1_

- [x] 3. Implement Flow blockchain and Dapper Wallet integration
  - ✅ Install and configure Flow Client Library (FCL) for Flow blockchain
  - ✅ Install and configure Dapper Wallet SDK for authentication
  - ✅ Create wallet connection component with connect/disconnect functionality
  - ✅ Implement authentication state management and session handling
  - ✅ Add wallet address verification and user session persistence
  - _Requirements: 1.1, 1.2, 1.3, 1.6_

- [x] 4. Create NFT ownership verification system
  - ✅ Integrate Find Labs API for NFT metadata and ownership queries
  - ✅ Implement Flow blockchain queries to verify NFT possession
  - ✅ Create NFT data models and TypeScript interfaces
  - ✅ Build caching layer for NFT ownership data
  - ✅ Replace mock NFT data with actual blockchain queries
  - _Requirements: 1.4, 1.5, 8.1, 8.2_

- [x] 5. Implement real-world sports data integration
  - ✅ Set up NBA and NFL stats API connections with authentication
  - ✅ Create data sync jobs to fetch daily player statistics
  - ✅ Implement fantasy scoring calculation engine
  - ✅ Build player stats caching and update mechanisms
  - ✅ Connect scoring system to actual player performance data
  - _Requirements: 3.1, 3.2, 3.6, 8.1_

- [x] 6. Set up database infrastructure with Supabase
  - ✅ Configure Supabase database with all required tables (users, NFTs, lineups, contests, treasury, marketplace, boosters, premium)
  - ✅ Implement database migrations and seed data for testing
  - ✅ Create comprehensive API endpoints for all functionality
  - ✅ Add proper error handling, validation, and security measures
  - ✅ Replace localStorage-based services with Supabase integration
  - _Requirements: 14.1, 14.3, 14.5, 14.6_

- [x] 7. Update smart contract to Cadence 1.0 and implement treasury system
  - ✅ Smart contract exists with Cadence 1.0 syntax (access(all) modifiers)
  - ✅ Treasury system with FLOW token vaults implemented
  - ✅ Fee collection and routing (70% reward pool, 30% platform treasury)
  - ✅ Marketplace functionality with NFT trading
  - ✅ Booster system with Disney Pinnacle NFT detection
  - ✅ Tournament and contest management
  - ✅ Structured reward distribution (25%, 15%, 10%, 30% shared, 20% sustainability)
  - _Requirements: 5.1, 5.2, 13.1, 13.2, 13.3, 13.4_

- [x] 8. Implement functional lineup management and contest system
  - ✅ Connect team builder to real NFT ownership verification
  - ✅ Implement lineup submission to smart contract and database
  - ✅ Create contest creation and management system
  - ✅ Add automatic lineup locking at contest deadlines
  - ✅ Build weekly cycle automation (contest start/end, scoring)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 9. Build leaderboard system with real data
  - ✅ Create leaderboard database schema and API endpoints
  - ✅ Replace mock leaderboard data with actual user rankings and points
  - ✅ Implement real-time ranking calculations and updates
  - ✅ Add prize pool display and reward structure information
  - ✅ Add user profile pages with ranking history and statistics
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 10. Implement tournament entry fee system
  - ✅ Create FLOW token payment interface for tournament participation
  - ✅ Build tournament creation with configurable entry fees and prize pools
  - ✅ Add participant management and entry validation
  - ✅ Create tournament status tracking and entry deadline enforcement
  - ✅ Connect to smart contract for fee collection and routing
  - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6_

- [x] 11. Build structured reward distribution system
  - ✅ Smart contract has structured reward distribution (1st: 25%, 2nd: 15%, 3rd: 10%, Top 10%: 30% shared)
  - ✅ Create automatic winner identification and prize calculation
  - ✅ Build reward distribution interface with FLOW token transfers
  - ✅ Add reward history tracking and display in user profiles
  - ✅ Implement sustainability allocation (20%) in smart contract
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 12. Implement functional marketplace NFT trading
  - ✅ Marketplace UI exists with listing and browsing functionality
  - ✅ Implement buy/sell functionality with automatic ownership transfer
  - ✅ Add marketplace fee collection (2-5%) and routing to treasury contract
  - ✅ Connect marketplace to real NFT ownership verification
  - ✅ Integrate with smart contract for secure NFT transfers
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 13. Implement booster pack and power-up system
  - ✅ Booster marketplace UI exists for purchasing power-ups
  - ✅ Smart contract has booster system with Disney Pinnacle NFT detection
  - ✅ Implement Disney Pinnacle NFT detection and automatic power-up activation
  - ✅ Build bonus multiplier system with "Energy" (+5% score) and "Luck" (random bonus) effects
  - ✅ Connect booster system to scoring engine for actual gameplay effects
  - ✅ Add booster inventory management and expiration tracking
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 14. Implement functional premium system
  - ✅ Premium UI exists with season pass purchase interface
  - ✅ Implement premium feature unlocking (advanced analytics, extra lineup slots, bonus rewards)
  - ✅ Build premium user interface with enhanced statistics and projections
  - ✅ Add subscription management and renewal notifications
  - ✅ Connect premium features to actual gameplay functionality
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 15. Create treasury admin system and sponsorship functionality
  - ✅ Treasury admin UI exists with basic interface
  - ✅ Smart contract has sponsorship functionality
  - ✅ Create sponsored tournament interface with brand logo and messaging display
  - ✅ Build sponsor contribution tracking and prize pool enhancement
  - ✅ Implement custom branded NFT reward distribution for sponsors
  - ✅ Add sponsor analytics dashboard with engagement metrics
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [x] 16. Enhance data visualization and analytics
  - ✅ Basic Recharts integration exists for performance charts
  - ✅ Build player statistics comparison tools and trend analysis
  - ✅ Create team performance analytics and scoring breakdowns with premium features
  - ✅ Add interactive charts for weekly and season-long data
  - ✅ Connect analytics to real player stats and scoring data
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [x] 17. Deploy smart contract to Flow Testnet
  - Fix flow.json configuration errors (nonexisting account test-acccount)
  - Set up proper testnet account configuration
  - Deploy ShotCaller Treasury Contract to Flow Testnet with proper configuration
  - Test all contract functions including fee routing and reward distribution
  - Integrate frontend with deployed smart contract
  - Update Flow configuration to use testnet contract addresses
  - _Requirements: 5.1, 5.2, 13.1, 13.2, 13.3, 13.4_



- [x] 18. Implement caching and performance optimization
  - Set up Redis caching for API responses, NFT data, and marketplace listings
  - Implement efficient database queries with proper indexing
  - Add image optimization and lazy loading for NFT displays
  - Create background job processing for stats updates, scoring, and reward distribution
  - _Requirements: 14.1, 14.2, 14.5_

- [x] 19. Add comprehensive error handling and fallbacks
  - Implement graceful error handling for wallet connection failures and FLOW token transactions
  - Add fallback mechanisms for API outages, blockchain issues, and payment processing failures
  - Create user-friendly error messages and retry functionality
  - Build offline mode support with data synchronization
  - _Requirements: 1.5, 3.6, 14.6, 13.6_

- [x] 20. Create responsive UI and mobile optimization
  - Ensure all components work properly on mobile devices including payment modals
  - Implement responsive design for team builder, leaderboards, and treasury interfaces
  - Add touch-friendly interactions for NFT selection and marketplace browsing
  - Optimize performance for mobile browsers and slower connections
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 21. Add comprehensive testing suite
  - Write unit tests for all React components including payment modals and marketplace
  - Create integration tests for API endpoints, database operations, and FLOW token transactions
  - Implement end-to-end tests for complete user workflows
  - Add smart contract tests for treasury management, fee routing, and reward distribution
  - _Requirements: All requirements (testing coverage)_

- [x] 22. Deploy application to production
  - Set up Vercel deployment for frontend with environment variables
  - Configure Supabase production database with all tables and API keys
  - Implement monitoring, logging, and error tracking systems
  - Set up CI/CD pipeline for automated deployments
  - _Requirements: 14.3, 14.4, 14.5, 13.5_

- [x] 23. Final integration testing and optimization
  - Conduct full end-to-end testing of complete game flow
  - Optimize database queries and API response times
  - Test wallet integration with real Dapper wallets, NFTs, and FLOW token transactions
  - Validate complete revenue model on testnet including fee routing and reward distribution
  - _Requirements: All requirements (final validation)_