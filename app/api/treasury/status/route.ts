import { NextRequest, NextResponse } from 'next/server'
import { enhancedDatabaseService, DatabaseError } from '@/lib/services/enhanced-database-service'

export async function GET(request: NextRequest) {
  try {
    // Get treasury statistics
    const treasuryStats = await enhancedDatabaseService.getTreasuryStats()
    
    // Get recent transactions (last 10)
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // For recent transactions, we'll get all and limit in memory for simplicity
    // In production, you'd want to add pagination to the database service
    const allTransactions = await enhancedDatabaseService.getTreasuryTransactionsByUser('')
    const recentTransactions = allTransactions.slice(0, limit)

    return NextResponse.json({
      success: true,
      treasury: {
        totalRewardPool: treasuryStats.totalRewardPool,
        totalTreasury: treasuryStats.totalTreasury,
        totalVolume: treasuryStats.totalVolume,
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.id,
          transactionHash: tx.transaction_hash,
          transactionType: tx.transaction_type,
          amount: tx.amount,
          feeAmount: tx.fee_amount,
          rewardPoolAmount: tx.reward_pool_amount,
          treasuryAmount: tx.treasury_amount,
          userAddress: tx.user_address,
          createdAt: tx.created_at
        }))
      }
    })

  } catch (error) {
    console.error('Treasury status error:', error)

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