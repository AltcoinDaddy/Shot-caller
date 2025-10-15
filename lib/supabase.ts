import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          wallet_address: string
          username: string | null
          created_at: string
          last_login: string | null
          total_points: number
          season_rank: number | null
          wins: number
          losses: number
        }
        Insert: {
          id?: string
          wallet_address: string
          username?: string | null
          created_at?: string
          last_login?: string | null
          total_points?: number
          season_rank?: number | null
          wins?: number
          losses?: number
        }
        Update: {
          id?: string
          wallet_address?: string
          username?: string | null
          created_at?: string
          last_login?: string | null
          total_points?: number
          season_rank?: number | null
          wins?: number
          losses?: number
        }
      }
      nfts: {
        Row: {
          id: string
          moment_id: number
          player_name: string
          team: string | null
          position: string | null
          sport: string
          rarity: string | null
          metadata: any | null
          last_updated: string
        }
        Insert: {
          id?: string
          moment_id: number
          player_name: string
          team?: string | null
          position?: string | null
          sport: string
          rarity?: string | null
          metadata?: any | null
          last_updated?: string
        }
        Update: {
          id?: string
          moment_id?: number
          player_name?: string
          team?: string | null
          position?: string | null
          sport?: string
          rarity?: string | null
          metadata?: any | null
          last_updated?: string
        }
      }
      lineups: {
        Row: {
          id: string
          user_id: string
          week_id: number
          nft_ids: number[]
          total_points: number
          submitted_at: string
          locked: boolean
        }
        Insert: {
          id?: string
          user_id: string
          week_id: number
          nft_ids: number[]
          total_points?: number
          submitted_at?: string
          locked?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          week_id?: number
          nft_ids?: number[]
          total_points?: number
          submitted_at?: string
          locked?: boolean
        }
      }
      contests: {
        Row: {
          id: string
          week_id: number
          start_time: string
          end_time: string
          status: string
          total_participants: number
          rewards_distributed: boolean
          entry_fee: number
          prize_pool: number
          max_participants: number | null
          contest_type: string
        }
        Insert: {
          id?: string
          week_id: number
          start_time: string
          end_time: string
          status?: string
          total_participants?: number
          rewards_distributed?: boolean
          entry_fee?: number
          prize_pool?: number
          max_participants?: number | null
          contest_type?: string
        }
        Update: {
          id?: string
          week_id?: number
          start_time?: string
          end_time?: string
          status?: string
          total_participants?: number
          rewards_distributed?: boolean
          entry_fee?: number
          prize_pool?: number
          max_participants?: number | null
          contest_type?: string
        }
      }
      treasury_transactions: {
        Row: {
          id: string
          transaction_hash: string
          transaction_type: string
          amount: number
          fee_amount: number | null
          reward_pool_amount: number | null
          treasury_amount: number | null
          user_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          transaction_hash: string
          transaction_type: string
          amount: number
          fee_amount?: number | null
          reward_pool_amount?: number | null
          treasury_amount?: number | null
          user_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          transaction_hash?: string
          transaction_type?: string
          amount?: number
          fee_amount?: number | null
          reward_pool_amount?: number | null
          treasury_amount?: number | null
          user_address?: string | null
          created_at?: string
        }
      }
      marketplace_listings: {
        Row: {
          id: string
          seller_address: string
          moment_id: number
          price: number
          status: string
          created_at: string
          sold_at: string | null
          buyer_address: string | null
        }
        Insert: {
          id?: string
          seller_address: string
          moment_id: number
          price: number
          status?: string
          created_at?: string
          sold_at?: string | null
          buyer_address?: string | null
        }
        Update: {
          id?: string
          seller_address?: string
          moment_id?: number
          price?: number
          status?: string
          created_at?: string
          sold_at?: string | null
          buyer_address?: string | null
        }
      }
      boosters: {
        Row: {
          id: string
          owner_address: string
          booster_type: string
          effect_type: string
          effect_value: number
          duration_hours: number
          purchased_at: string
          activated_at: string | null
          expires_at: string | null
          status: string
        }
        Insert: {
          id?: string
          owner_address: string
          booster_type: string
          effect_type: string
          effect_value: number
          duration_hours?: number
          purchased_at?: string
          activated_at?: string | null
          expires_at?: string | null
          status?: string
        }
        Update: {
          id?: string
          owner_address?: string
          booster_type?: string
          effect_type?: string
          effect_value?: number
          duration_hours?: number
          purchased_at?: string
          activated_at?: string | null
          expires_at?: string | null
          status?: string
        }
      }
      premium_access: {
        Row: {
          id: string
          user_address: string
          access_type: string
          purchased_at: string
          expires_at: string
          status: string
          flow_amount: number
        }
        Insert: {
          id?: string
          user_address: string
          access_type: string
          purchased_at?: string
          expires_at: string
          status?: string
          flow_amount: number
        }
        Update: {
          id?: string
          user_address?: string
          access_type?: string
          purchased_at?: string
          expires_at?: string
          status?: string
          flow_amount?: number
        }
      }
      player_stats: {
        Row: {
          id: string
          player_name: string
          game_date: string
          sport: string
          stats: any
          fantasy_points: number | null
          created_at: string
        }
        Insert: {
          id?: string
          player_name: string
          game_date: string
          sport: string
          stats: any
          fantasy_points?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          player_name?: string
          game_date?: string
          sport?: string
          stats?: any
          fantasy_points?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}