export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ical_links: {
        Row: {
          created_at: string
          id: string
          last_synced: string | null
          platform: string
          property_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_synced?: string | null
          platform: string
          property_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          last_synced?: string | null
          platform?: string
          property_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ical_links_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          name: string
          operator_id: string | null
          role: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id: string
          name: string
          operator_id?: string | null
          role: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
          operator_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          bathrooms: number
          bedrooms: number
          capacity: number
          created_at: string
          description: string | null
          ical_token: string | null
          ical_url: string | null
          id: string
          image_url: string | null
          internal_code: string
          name: string
          notes: string | null
          operator_id: string
          parent_id: string | null
          type: string | null
        }
        Insert: {
          address: string
          bathrooms: number
          bedrooms: number
          capacity: number
          created_at?: string
          description?: string | null
          ical_token?: string | null
          ical_url?: string | null
          id?: string
          image_url?: string | null
          internal_code: string
          name: string
          notes?: string | null
          operator_id: string
          parent_id?: string | null
          type?: string | null
        }
        Update: {
          address?: string
          bathrooms?: number
          bedrooms?: number
          capacity?: number
          created_at?: string
          description?: string | null
          ical_token?: string | null
          ical_url?: string | null
          id?: string
          image_url?: string | null
          internal_code?: string
          name?: string
          notes?: string | null
          operator_id?: string
          parent_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string
          end_date: string
          external_id: string | null
          guest_count: number | null
          guest_name: string | null
          ical_url: string | null
          id: string
          is_blocking: boolean | null
          notes: string | null
          platform: string
          property_id: string
          source: string
          source_reservation_id: string | null
          start_date: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          end_date: string
          external_id?: string | null
          guest_count?: number | null
          guest_name?: string | null
          ical_url?: string | null
          id?: string
          is_blocking?: boolean | null
          notes?: string | null
          platform: string
          property_id: string
          source: string
          source_reservation_id?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          external_id?: string | null
          guest_count?: number | null
          guest_name?: string | null
          ical_url?: string | null
          id?: string
          is_blocking?: boolean | null
          notes?: string | null
          platform?: string
          property_id?: string
          source?: string
          source_reservation_id?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_source_reservation_id_fkey"
            columns: ["source_reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
