import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError, ValidationError } from '@/lib/services/enhanced-database-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Get user's reward transactions
    const transactions = await enhancedDatabaseService.getTreasuryTransactionsByUser(walletAddress)
    
    // Filter for reward-related transactions
    const rewardTransactions = transactions.filter(tx => 
      tx.transaction_type === 'reward_distribution' || 
      tx.transaction_type === 'tournament_entry'
    )

    // Get user's lineups to correlate with rewards
    const user = await enhancedDatabaseService.getUserByWallet(walletAddress)
    let lineups = []
    if (user) {
      lineups = await enhancedDatabaseService.getUserLineups(user.id)
    }

    // Format reward history
    const rewardHistory = rewardTransactions.map(tx => ({
      id: tx.id,
      transactionHash: tx.transaction_hash,
      transactionType: tx.transaction_type,
      amount: tx.amount,
      createdAt: tx.created_at,
      isReward: tx.transaction_type === 'reward_distribution',
      isEntry: tx.transaction_type === 'tournament_entry'
    }))

    // Calculate totals
    const totalRewardsEarned = rewardTransactions
      .filter(tx => tx.transaction_type === 'reward_distribution')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const totalEntriesPaid = rewardTransactions
      .filter(tx => tx.transaction_type === 'tournament_entry')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const netEarnings = totalRewardsEarned - totalEntriesPaid

    return NextResponse.json({
      success: true,
      rewardHistory,
      summary: {
        totalRewardsEarned,
        totalEntriesPaid,
        netEarnings,
        totalTransactions: rewardTransactions.length,
        totalLineups: lineups.length
      }
    })

  } catch (error) {
    console.error('Get reward history error:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { success: false, error: 'Database error occurred' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}