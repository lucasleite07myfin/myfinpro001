export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      alert_logs: {
        Row: {
          alert_rule_id: string | null
          id: string
          message: string
          read: boolean | null
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          alert_rule_id?: string | null
          id?: string
          message: string
          read?: boolean | null
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          alert_rule_id?: string | null
          id?: string
          message?: string
          read?: boolean | null
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_logs_alert_rule_id_fkey"
            columns: ["alert_rule_id"]
            isOneToOne: false
            referencedRelation: "alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_rules: {
        Row: {
          account_id: string | null
          category_id: string | null
          created_at: string | null
          days_before_due: number | null
          id: string
          is_active: boolean | null
          name: string
          notification_channel: string[] | null
          rule_type: string
          threshold_percent: number | null
          threshold_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          category_id?: string | null
          created_at?: string | null
          days_before_due?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          notification_channel?: string[] | null
          rule_type: string
          threshold_percent?: number | null
          threshold_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          category_id?: string | null
          created_at?: string | null
          days_before_due?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          notification_channel?: string[] | null
          rule_type?: string
          threshold_percent?: number | null
          threshold_value?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          acquisition_date: string | null
          acquisition_value: number | null
          created_at: string | null
          evaluation_date: string | null
          id: string
          insured: boolean | null
          last_price_brl: number | null
          last_updated: string | null
          location: string | null
          name: string
          notes: string | null
          quantity: number | null
          symbol: string | null
          type: string
          updated_at: string | null
          user_id: string
          value: number
          wallet: string | null
        }
        Insert: {
          acquisition_date?: string | null
          acquisition_value?: number | null
          created_at?: string | null
          evaluation_date?: string | null
          id?: string
          insured?: boolean | null
          last_price_brl?: number | null
          last_updated?: string | null
          location?: string | null
          name: string
          notes?: string | null
          quantity?: number | null
          symbol?: string | null
          type: string
          updated_at?: string | null
          user_id: string
          value: number
          wallet?: string | null
        }
        Update: {
          acquisition_date?: string | null
          acquisition_value?: number | null
          created_at?: string | null
          evaluation_date?: string | null
          id?: string
          insured?: boolean | null
          last_price_brl?: number | null
          last_updated?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          quantity?: number | null
          symbol?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
          value?: number
          wallet?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          code: string
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description: string
          icon: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      custom_categories: {
        Row: {
          category_name: string
          created_at: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          category_name: string
          created_at?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          category_name?: string
          created_at?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string | null
          current_amount: number | null
          id: string
          name: string
          saving_location: string | null
          target_amount: number
          target_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_amount?: number | null
          id?: string
          name: string
          saving_location?: string | null
          target_amount: number
          target_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_amount?: number | null
          id?: string
          name?: string
          saving_location?: string | null
          target_amount?: number
          target_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_snapshots: {
        Row: {
          created_at: string | null
          debt_income_pct: number | null
          id: string
          months_emergency_fund: number | null
          net_worth_growth_12m: number | null
          savings_rate_pct: number | null
          snapshot_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          debt_income_pct?: number | null
          id?: string
          months_emergency_fund?: number | null
          net_worth_growth_12m?: number | null
          savings_rate_pct?: number | null
          snapshot_date: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          debt_income_pct?: number | null
          id?: string
          months_emergency_fund?: number | null
          net_worth_growth_12m?: number | null
          savings_rate_pct?: number | null
          snapshot_date?: string
          user_id?: string
        }
        Relationships: []
      }
      liabilities: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      monthly_finance_data: {
        Row: {
          balance: number | null
          created_at: string | null
          expense_total: number | null
          id: string
          income_total: number | null
          month: string
          savings_rate: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          expense_total?: number | null
          id?: string
          income_total?: number | null
          month: string
          savings_rate?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          expense_total?: number | null
          id?: string
          income_total?: number | null
          month?: string
          savings_rate?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          app_mode: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_mode?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_mode?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recurring_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          description: string
          due_day: number
          id: string
          is_paid: boolean | null
          monthly_values: Json | null
          paid_months: string[] | null
          payment_method: string | null
          repeat_months: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          description: string
          due_day: number
          id?: string
          is_paid?: boolean | null
          monthly_values?: Json | null
          paid_months?: string[] | null
          payment_method?: string | null
          repeat_months?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          description?: string
          due_day?: number
          id?: string
          is_paid?: boolean | null
          monthly_values?: Json | null
          paid_months?: string[] | null
          payment_method?: string | null
          repeat_months?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: Json | null
          bank_info: Json | null
          contact_person: string | null
          created_at: string | null
          document: string
          email: string | null
          id: string
          is_company: boolean
          name: string
          notes: string | null
          other_product_type: string | null
          payment_terms: string | null
          phone: string | null
          product_type: string
          state_registration: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: Json | null
          bank_info?: Json | null
          contact_person?: string | null
          created_at?: string | null
          document: string
          email?: string | null
          id?: string
          is_company: boolean
          name: string
          notes?: string | null
          other_product_type?: string | null
          payment_terms?: string | null
          phone?: string | null
          product_type: string
          state_registration?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: Json | null
          bank_info?: Json | null
          contact_person?: string | null
          created_at?: string | null
          document?: string
          email?: string | null
          id?: string
          is_company?: boolean
          name?: string
          notes?: string | null
          other_product_type?: string | null
          payment_terms?: string | null
          phone?: string | null
          product_type?: string
          state_registration?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string
          goal_id: string | null
          id: string
          investment_id: string | null
          is_goal_contribution: boolean | null
          is_investment_contribution: boolean | null
          is_recurring_payment: boolean | null
          payment_method: string | null
          recurring_expense_id: string | null
          source: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date: string
          description: string
          goal_id?: string | null
          id?: string
          investment_id?: string | null
          is_goal_contribution?: boolean | null
          is_investment_contribution?: boolean | null
          is_recurring_payment?: boolean | null
          payment_method?: string | null
          recurring_expense_id?: string | null
          source?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string
          goal_id?: string | null
          id?: string
          investment_id?: string | null
          is_goal_contribution?: boolean | null
          is_investment_contribution?: boolean | null
          is_recurring_payment?: boolean | null
          payment_method?: string | null
          recurring_expense_id?: string | null
          source?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_transactions_goal"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_investment"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transactions_recurring_expense"
            columns: ["recurring_expense_id"]
            isOneToOne: false
            referencedRelation: "recurring_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string | null
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id?: string | null
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
