"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { 
  Coins, 
  TrendingUp, 
  Users, 
  Trophy, 
  Settings, 
  Download, 
  Upload,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Percent,
  Calendar,
  Target,
  Shield
} from "lucide-react"
import { SponsorAnalyticsDashboard } from "./sponsor-analytics-dashboard"
import { SponsorContributionTracker } from "./sponsor-contribution-tracker"

interface TreasuryStats {
  totalBalance: number
  rewardPool: number
  platformTreasury: number
  weeklyDistributed: number
  monthlyRevenue: number
  sponsorContributions: number
  feeCollection: {
    marketplace: number
    tournaments: number
    boosters: number
    seasonPass: number
  }
}

interface Transaction {
  id: string
  type: 'fee_collection' | 'reward_distribution' | 'sponsor_contribution' | 'withdrawal'
  amount: number
  description: string
  timestamp: Date
  status: 'completed' | 'pending' | 'failed'
  txHash?: string
}

export function TreasuryAdminDashboard() {
  const [treasuryStats, setTreasuryStats] = useState<TreasuryStats>({
    totalBalance: 15420.75,
    rewardPool: 10794.53,
    platformTreasury: 4626.22,
    weeklyDistributed: 2340.50,
    monthlyRevenue: 8750.25,
    sponsorContributions: 1250.00,
    feeCollection: {
      marketplace: 450.75,
      tournaments: 2100.00,
      boosters: 680.50,
      seasonPass: 1200.00
    }
  })

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([
    {
      id: 'tx-1',
      type: 'sponsor_contribution',
      amount: 500.0,
      description: 'FlowSports tournament sponsorship',
      timestamp: new Date('2024-12-14T10:30:00'),
      status: 'completed',
      txHash: '0x1234...5678'
    },
    {
      id: 'tx-2',
      type: 'reward_distribution',
      amount: -1250.0,
      description: 'Week 15 prize distribution',
      timestamp: new Date('2024-12-13T18:00:00'),
      status: 'completed',
      txHash: '0x2345...6789'
    },
    {
      id: 'tx-3',
      type: 'fee_collection',
      amount: 125.50,
      description: 'Marketplace transaction fees',
      timestamp: new Date('2024-12-13T14:22:00'),
      status: 'completed',
      txHash: '0x3456...7890'
    }
  ])

  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [loading, setLoading] = useState(false)

  // Mock chart data
  const revenueData = [
    { name: 'Week 1', marketplace: 120, tournaments: 450, boosters: 80, sponsors: 200 },
    { name: 'Week 2', marketplace: 180, tournaments: 520, boosters: 120, sponsors: 300 },
    { name: 'Week 3', marketplace: 150, tournaments: 480, boosters: 95, sponsors: 250 },
    { name: 'Week 4', marketplace: 200, tournaments: 650, boosters: 140, sponsors: 500 }
  ]

  const treasuryDistribution = [
    { name: 'Reward Pool (70%)', value: treasuryStats.rewardPool, color: '#3B82F6' },
    { name: 'Platform Treasury (30%)', value: treasuryStats.platformTreasury, color: '#10B981' }
  ]

  const feeSourceData = Object.entries(treasuryStats.feeCollection).map(([source, amount]) => ({
    name: source.charAt(0).toUpperCase() + source.slice(1),
    value: amount,
    color: source === 'marketplace' ? '#F59E0B' : 
           source === 'tournaments' ? '#3B82F6' :
           source === 'boosters' ? '#8B5CF6' : '#10B981'
  }))

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawAddress) return
    
    setLoading(true)
    try {
      // Simulate withdrawal process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newTransaction: Transaction = {
        id: `tx-${Date.now()}`,
        type: 'withdrawal',
        amount: -parseFloat(withdrawAmount),
        description: `Treasury withdrawal to ${withdrawAddress.slice(0, 8)}...`,
        timestamp: new Date(),
        status: 'completed',
        txHash: `0x${Math.random().toString(16).slice(2, 10)}...`
      }
      
      setRecentTransactions(prev => [newTransaction, ...prev])
      setTreasuryStats(prev => ({
        ...prev,
        platformTreasury: prev.platformTreasury - parseFloat(withdrawAmount)
      }))
      
      setShowWithdrawDialog(false)
      setWithdrawAmount('')
      setWithdrawAddress('')
    } catch (error) {
      console.error('Withdrawal failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'fee_collection':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'reward_distribution':
        return <Trophy className="h-4 w-4 text-blue-500" />
      case 'sponsor_contribution':
        return <DollarSign className="h-4 w-4 text-purple-500" />
      case 'withdrawal':
        return <Upload className="h-4 w-4 text-red-500" />
      default:
        return <Coins className="h-4 w-4 text-gray-500" />
    }
  }

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) return 'text-green-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Treasury Administration</h2>
          <p className="text-muted-foreground">
            Monitor FLOW token treasury, fee distribution, and sponsorship revenue
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Treasury Withdrawal</DialogTitle>
                <DialogDescription>
                  Withdraw FLOW tokens from platform treasury
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (FLOW)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="100"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    Available: {treasuryStats.platformTreasury.toLocaleString()} FLOW
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Recipient Address</Label>
                  <Input
                    id="address"
                    placeholder="0x1234567890abcdef..."
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                  />
                </div>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This action will transfer FLOW tokens from the platform treasury. 
                    Ensure the recipient address is correct.
                  </AlertDescription>
                </Alert>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleWithdraw} disabled={loading}>
                  {loading ? "Processing..." : "Withdraw"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Treasury Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Treasury</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treasuryStats.totalBalance.toLocaleString()} FLOW</div>
            <p className="text-xs text-muted-foreground">
              Combined balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treasuryStats.monthlyRevenue.toLocaleString()} FLOW</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sponsor Contributions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treasuryStats.sponsorContributions.toLocaleString()} FLOW</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Distributed</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treasuryStats.weeklyDistributed.toLocaleString()} FLOW</div>
            <p className="text-xs text-muted-foreground">
              In rewards
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="sponsorship">Sponsorship</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Treasury Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Treasury Distribution</CardTitle>
                <CardDescription>70% reward pool, 30% platform treasury</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={treasuryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {treasuryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} FLOW`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Fee Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
                <CardDescription>Fee collection by source</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={feeSourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} FLOW`} />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Weekly revenue breakdown by source</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="marketplace" stroke="#F59E0B" strokeWidth={2} />
                  <Line type="monotone" dataKey="tournaments" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="boosters" stroke="#8B5CF6" strokeWidth={2} />
                  <Line type="monotone" dataKey="sponsors" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest treasury transactions and fee collections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getTransactionIcon(tx.type)}
                      <div>
                        <div className="font-medium">{tx.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {tx.timestamp.toLocaleString()}
                          {tx.txHash && (
                            <span className="ml-2">• {tx.txHash}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${getTransactionColor(tx.type, tx.amount)}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} FLOW
                      </div>
                      <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sponsorship" className="space-y-6">
          <SponsorContributionTracker showCreateForm={true} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <SponsorAnalyticsDashboard showAllSponsors={true} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fee Distribution</CardTitle>
                <CardDescription>Configure automatic fee routing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Reward Pool Percentage</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" value="70" className="w-20" />
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Platform Treasury Percentage</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" value="30" className="w-20" />
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <Button className="w-full">Update Distribution</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Treasury access and security controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Multi-signature Required</Label>
                  <Badge variant="default">
                    <Shield className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Daily Withdrawal Limit</Label>
                  <span className="text-sm">1,000 FLOW</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Admin Addresses</Label>
                  <span className="text-sm">3 of 5</span>
                </div>
                <Button variant="outline" className="w-full">Manage Security</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}