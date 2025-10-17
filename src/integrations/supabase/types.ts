export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
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
          user_id?: string
          value?: number
          wallet?: string | null
        }
        Relationships: []
      }
      custom_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      discount_coupons: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          discount_percent: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          stripe_coupon_id: string | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          discount_percent: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          stripe_coupon_id?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          discount_percent?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          stripe_coupon_id?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      emp_assets: {
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
          user_id?: string
          value?: number
          wallet?: string | null
        }
        Relationships: []
      }
      emp_goals: {
        Row: {
          created_at: string | null
          current_amount: number | null
          id: string
          name: string
          saving_location: string | null
          target_amount: number
          target_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_amount?: number | null
          id?: string
          name: string
          saving_location?: string | null
          target_amount: number
          target_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_amount?: number | null
          id?: string
          name?: string
          saving_location?: string | null
          target_amount?: number
          target_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emp_liabilities: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      emp_monthly_finance_data: {
        Row: {
          created_at: string | null
          expense_total: number | null
          id: string
          income_total: number | null
          month: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expense_total?: number | null
          id?: string
          income_total?: number | null
          month: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expense_total?: number | null
          id?: string
          income_total?: number | null
          month?: string
          user_id?: string
        }
        Relationships: []
      }
      emp_recurring_expenses: {
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
          user_id?: string
        }
        Relationships: []
      }
      emp_transactions: {
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
          target_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_amount?: number | null
          id?: string
          name: string
          saving_location?: string | null
          target_amount: number
          target_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_amount?: number | null
          id?: string
          name?: string
          saving_location?: string | null
          target_amount?: number
          target_date?: string | null
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
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      monthly_finance_data: {
        Row: {
          created_at: string | null
          expense_total: number | null
          id: string
          income_total: number | null
          month: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expense_total?: number | null
          id?: string
          income_total?: number | null
          month: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expense_total?: number | null
          id?: string
          income_total?: number | null
          month?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
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
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
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
          document: string | null
          email: string | null
          id: string
          is_company: boolean | null
          name: string
          notes: string | null
          other_product_type: string | null
          payment_terms: string | null
          phone: string | null
          product_type: string | null
          state_registration: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: Json | null
          bank_info?: Json | null
          contact_person?: string | null
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          is_company?: boolean | null
          name: string
          notes?: string | null
          other_product_type?: string | null
          payment_terms?: string | null
          phone?: string | null
          product_type?: string | null
          state_registration?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: Json | null
          bank_info?: Json | null
          contact_person?: string | null
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          is_company?: boolean | null
          name?: string
          notes?: string | null
          other_product_type?: string | null
          payment_terms?: string | null
          phone?: string | null
          product_type?: string | null
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
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
