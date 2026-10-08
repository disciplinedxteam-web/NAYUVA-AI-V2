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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      care_appointments: {
        Row: {
          baby_id: string
          created_at: string
          id: string
          location: Json
          reason: string
          reschedule: Json | null
          starts_at: string
          status: string
        }
        Insert: {
          baby_id: string
          created_at?: string
          id?: string
          location?: Json
          reason: string
          reschedule?: Json | null
          starts_at: string
          status?: string
        }
        Update: {
          baby_id?: string
          created_at?: string
          id?: string
          location?: Json
          reason?: string
          reschedule?: Json | null
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_appointments_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "care_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_events: {
        Row: {
          baby_id: string
          caregiver_visible: boolean
          created_at: string
          id: string
          kind: string
          summary: string
        }
        Insert: {
          baby_id: string
          caregiver_visible?: boolean
          created_at?: string
          id?: string
          kind: string
          summary: string
        }
        Update: {
          baby_id?: string
          caregiver_visible?: boolean
          created_at?: string
          id?: string
          kind?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_events_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "care_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_facility: {
        Row: {
          settings: Json
          workspace: string
        }
        Insert: {
          settings?: Json
          workspace: string
        }
        Update: {
          settings?: Json
          workspace?: string
        }
        Relationships: []
      }
      care_profiles: {
        Row: {
          baby_name: string
          caregiver_name: string
          created_at: string
          id: string
          plan: Json
          workspace: string
        }
        Insert: {
          baby_name: string
          caregiver_name: string
          created_at?: string
          id?: string
          plan: Json
          workspace?: string
        }
        Update: {
          baby_name?: string
          caregiver_name?: string
          created_at?: string
          id?: string
          plan?: Json
          workspace?: string
        }
        Relationships: []
      }
      clinical_notes: {
        Row: {
          additional_note: string
          appointment_id: string
          baby_id: string
          created_at: string
          decision: string
          follow_up: string
          id: string
          observations: string
        }
        Insert: {
          additional_note?: string
          appointment_id: string
          baby_id: string
          created_at?: string
          decision: string
          follow_up?: string
          id?: string
          observations: string
        }
        Update: {
          additional_note?: string
          appointment_id?: string
          baby_id?: string
          created_at?: string
          decision?: string
          follow_up?: string
          id?: string
          observations?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "care_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "care_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_sessions: {
        Row: {
          expires_at: string
          role: string
          token_hash: string
        }
        Insert: {
          expires_at: string
          role: string
          token_hash: string
        }
        Update: {
          expires_at?: string
          role?: string
          token_hash?: string
        }
        Relationships: []
      }
      health_cards: {
        Row: {
          baby_id: string
          category: string
          created_at: string
          id: string
          observation: string
          priority: string
          quote: string
          review_note: string
          reviewed: boolean
        }
        Insert: {
          baby_id: string
          category: string
          created_at?: string
          id?: string
          observation: string
          priority: string
          quote: string
          review_note?: string
          reviewed?: boolean
        }
        Update: {
          baby_id?: string
          category?: string
          created_at?: string
          id?: string
          observation?: string
          priority?: string
          quote?: string
          review_note?: string
          reviewed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "health_cards_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "care_profiles"
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
    Enums: {},
  },
} as const
