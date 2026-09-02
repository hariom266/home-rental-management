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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      apartments: {
        Row: {
          apartment_id: string
          apartment_number: string
          created_at: string
          description: string | null
          floor: number
          id: string
          monthly_rent: number
          security_deposit: number
          status: Database["public"]["Enums"]["apartment_status"]
          updated_at: string
        }
        Insert: {
          apartment_id: string
          apartment_number: string
          created_at?: string
          description?: string | null
          floor?: number
          id?: string
          monthly_rent?: number
          security_deposit?: number
          status?: Database["public"]["Enums"]["apartment_status"]
          updated_at?: string
        }
        Update: {
          apartment_id?: string
          apartment_number?: string
          created_at?: string
          description?: string | null
          floor?: number
          id?: string
          monthly_rent?: number
          security_deposit?: number
          status?: Database["public"]["Enums"]["apartment_status"]
          updated_at?: string
        }
        Relationships: []
      }
      building_settings: {
        Row: {
          building_address: string
          building_name: string
          contact_email: string
          currency: string
          id: string
          late_fee_grace_days: number
          late_fee_type: string
          late_fee_value: number
          owner_name: string
          owner_phone: string
          rent_due_day: number
          updated_at: string
        }
        Insert: {
          building_address?: string
          building_name?: string
          contact_email?: string
          currency?: string
          id?: string
          late_fee_grace_days?: number
          late_fee_type?: string
          late_fee_value?: number
          owner_name?: string
          owner_phone?: string
          rent_due_day?: number
          updated_at?: string
        }
        Update: {
          building_address?: string
          building_name?: string
          contact_email?: string
          currency?: string
          id?: string
          late_fee_grace_days?: number
          late_fee_type?: string
          late_fee_value?: number
          owner_name?: string
          owner_phone?: string
          rent_due_day?: number
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_requests: {
        Row: {
          admin_notes: string | null
          apartment_id: string
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          priority: Database["public"]["Enums"]["maintenance_priority"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["maintenance_status"]
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          apartment_id: string
          category?: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          apartment_id?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          message: string
          priority: string
          published_at: string
          target_apartment_id: string | null
          target_type: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          message: string
          priority?: string
          published_at?: string
          target_apartment_id?: string | null
          target_type?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          priority?: string
          published_at?: string
          target_apartment_id?: string | null
          target_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_target_apartment_id_fkey"
            columns: ["target_apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          apartment_id: string
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_gateway: string | null
          payment_method: string
          payment_status: Database["public"]["Enums"]["txn_status"]
          receipt_number: string | null
          rent_record_id: string | null
          tenant_id: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          apartment_id: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["txn_status"]
          receipt_number?: string | null
          rent_record_id?: string | null
          tenant_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          apartment_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["txn_status"]
          receipt_number?: string | null
          rent_record_id?: string | null
          tenant_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_rent_record_id_fkey"
            columns: ["rent_record_id"]
            isOneToOne: false
            referencedRelation: "rent_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          generated_at: string
          id: string
          payment_id: string
          receipt_number: string
          receipt_url: string | null
        }
        Insert: {
          generated_at?: string
          id?: string
          payment_id: string
          receipt_number: string
          receipt_url?: string | null
        }
        Update: {
          generated_at?: string
          id?: string
          payment_id?: string
          receipt_number?: string
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_records: {
        Row: {
          apartment_id: string
          billing_month: string
          created_at: string
          due_date: string
          id: string
          late_fee: number
          paid_amount: number
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status_enum"]
          rent_amount: number
          tenant_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          apartment_id: string
          billing_month: string
          created_at?: string
          due_date: string
          id?: string
          late_fee?: number
          paid_amount?: number
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status_enum"]
          rent_amount: number
          tenant_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          apartment_id?: string
          billing_month?: string
          created_at?: string
          due_date?: string
          id?: string
          late_fee?: number
          paid_amount?: number
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status_enum"]
          rent_amount?: number
          tenant_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_records_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          apartment_id: string | null
          auth_user_id: string | null
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          id: string
          move_in_date: string | null
          move_out_date: string | null
          phone: string | null
          status: Database["public"]["Enums"]["tenant_status"]
          updated_at: string
        }
        Insert: {
          apartment_id?: string | null
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          id?: string
          move_in_date?: string | null
          move_out_date?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Update: {
          apartment_id?: string | null
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          id?: string
          move_in_date?: string | null
          move_out_date?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      compute_late_fee: {
        Args: { _due: string; _rent: number }
        Returns: number
      }
      current_apartment_id: { Args: never; Returns: string }
      current_tenant_id: { Args: never; Returns: string }
      generate_monthly_rent: {
        Args: { _billing_month: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      apartment_status: "occupied" | "vacant" | "maintenance"
      app_role: "admin" | "tenant"
      maintenance_priority: "low" | "medium" | "high" | "emergency"
      maintenance_status: "submitted" | "in_progress" | "resolved" | "rejected"
      payment_status_enum: "pending" | "partially_paid" | "paid" | "overdue"
      tenant_status: "active" | "inactive"
      txn_status: "pending" | "successful" | "failed" | "refunded"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      apartment_status: ["occupied", "vacant", "maintenance"],
      app_role: ["admin", "tenant"],
      maintenance_priority: ["low", "medium", "high", "emergency"],
      maintenance_status: ["submitted", "in_progress", "resolved", "rejected"],
      payment_status_enum: ["pending", "partially_paid", "paid", "overdue"],
      tenant_status: ["active", "inactive"],
      txn_status: ["pending", "successful", "failed", "refunded"],
    },
  },
} as const
