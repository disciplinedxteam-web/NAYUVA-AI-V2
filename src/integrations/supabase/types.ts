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
      audit_log: {
        Row: {
          action: string
          actor_role: string | null
          created_at: string
          detail: Json
          entity: string
          entity_id: string | null
          id: number
        }
        Insert: {
          action: string
          actor_role?: string | null
          created_at?: string
          detail?: Json
          entity: string
          entity_id?: string | null
          id?: never
        }
        Update: {
          action?: string
          actor_role?: string | null
          created_at?: string
          detail?: Json
          entity?: string
          entity_id?: string | null
          id?: never
        }
        Relationships: []
      }
      care_appointments: {
        Row: {
          baby_id: string
          created_at: string
          ends_at: string | null
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
          ends_at?: string | null
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
          ends_at?: string | null
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
          plan_version: number
          status: string
          updated_at: string
          workspace: string
        }
        Insert: {
          baby_name: string
          caregiver_name: string
          created_at?: string
          id?: string
          plan: Json
          plan_version?: number
          status?: string
          updated_at?: string
          workspace?: string
        }
        Update: {
          baby_name?: string
          caregiver_name?: string
          created_at?: string
          id?: string
          plan?: Json
          plan_version?: number
          status?: string
          updated_at?: string
          workspace?: string
        }
        Relationships: []
      }
      caregiver_responses: {
        Row: {
          baby_id: string
          completeness: string
          confirmation_status: string
          created_at: string
          id: string
          original_text: string | null
          question_id: string
          session_id: string
          structured_answer: Json | null
          topic: string
          units: string | null
          validation_status: string
        }
        Insert: {
          baby_id: string
          completeness?: string
          confirmation_status?: string
          created_at?: string
          id?: string
          original_text?: string | null
          question_id: string
          session_id: string
          structured_answer?: Json | null
          topic: string
          units?: string | null
          validation_status?: string
        }
        Update: {
          baby_id?: string
          completeness?: string
          confirmation_status?: string
          created_at?: string
          id?: string
          original_text?: string | null
          question_id?: string
          session_id?: string
          structured_answer?: Json | null
          topic?: string
          units?: string | null
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_responses_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "care_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caregiver_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "checkin_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_sessions: {
        Row: {
          agent_version: string | null
          attempt_id: string | null
          baby_id: string
          call_status: string | null
          caregiver_name: string
          channel: string
          completed_at: string | null
          consent_at: string | null
          created_at: string
          destination_phone: string | null
          failure_code: string | null
          id: string
          plan_snapshot: Json
          plan_version: number
          question_bank_version: number | null
          question_ids: Json
          scheduled_for: string | null
          started_at: string | null
          status: string
          summary: Json | null
          transcript: Json
        }
        Insert: {
          agent_version?: string | null
          attempt_id?: string | null
          baby_id: string
          call_status?: string | null
          caregiver_name: string
          channel?: string
          completed_at?: string | null
          consent_at?: string | null
          created_at?: string
          destination_phone?: string | null
          failure_code?: string | null
          id?: string
          plan_snapshot?: Json
          plan_version: number
          question_bank_version?: number | null
          question_ids?: Json
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          summary?: Json | null
          transcript?: Json
        }
        Update: {
          agent_version?: string | null
          attempt_id?: string | null
          baby_id?: string
          call_status?: string | null
          caregiver_name?: string
          channel?: string
          completed_at?: string | null
          consent_at?: string | null
          created_at?: string
          destination_phone?: string | null
          failure_code?: string | null
          id?: string
          plan_snapshot?: Json
          plan_version?: number
          question_bank_version?: number | null
          question_ids?: Json
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          summary?: Json | null
          transcript?: Json
        }
        Relationships: [
          {
            foreignKeyName: "checkin_sessions_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "care_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          caregiver_profile_id: string | null
          expires_at: string
          role: string
          token_hash: string
        }
        Insert: {
          caregiver_profile_id?: string | null
          expires_at: string
          role: string
          token_hash: string
        }
        Update: {
          caregiver_profile_id?: string | null
          expires_at?: string
          role?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_sessions_caregiver_profile_id_fkey"
            columns: ["caregiver_profile_id"]
            isOneToOne: false
            referencedRelation: "care_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_instructions: {
        Row: {
          baby_id: string
          clinician: string
          created_at: string
          expires_on: string | null
          id: string
          instruction: string
          plan_version: number
          question_id: string | null
          revision: number
          starts_on: string | null
          status: string
          topic: string | null
        }
        Insert: {
          baby_id: string
          clinician: string
          created_at?: string
          expires_on?: string | null
          id?: string
          instruction: string
          plan_version: number
          question_id?: string | null
          revision?: number
          starts_on?: string | null
          status?: string
          topic?: string | null
        }
        Update: {
          baby_id?: string
          clinician?: string
          created_at?: string
          expires_on?: string | null
          id?: string
          instruction?: string
          plan_version?: number
          question_id?: string | null
          revision?: number
          starts_on?: string | null
          status?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "followup_instructions_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "care_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_instructions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      health_cards: {
        Row: {
          baby_id: string
          caregiver_name: string | null
          category: string
          created_at: string
          id: string
          observation: string
          plan_snapshot: Json | null
          priority: string
          quote: string
          review_note: string
          reviewed: boolean
          scheduled_for: string | null
          scoring_result: Json | null
          session_id: string | null
          summary_text: string | null
          summary_version: number
          workflow_status: string
        }
        Insert: {
          baby_id: string
          caregiver_name?: string | null
          category: string
          created_at?: string
          id?: string
          observation: string
          plan_snapshot?: Json | null
          priority: string
          quote: string
          review_note?: string
          reviewed?: boolean
          scheduled_for?: string | null
          scoring_result?: Json | null
          session_id?: string | null
          summary_text?: string | null
          summary_version?: number
          workflow_status?: string
        }
        Update: {
          baby_id?: string
          caregiver_name?: string | null
          category?: string
          created_at?: string
          id?: string
          observation?: string
          plan_snapshot?: Json | null
          priority?: string
          quote?: string
          review_note?: string
          reviewed?: boolean
          scheduled_for?: string | null
          scoring_result?: Json | null
          session_id?: string | null
          summary_text?: string | null
          summary_version?: number
          workflow_status?: string
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
      question_bank: {
        Row: {
          active: boolean
          answer_options: Json
          approval_status: string
          created_at: string
          first_wording: string
          id: string
          requires_confirmation: boolean
          response_type: string
          returning_wording: string | null
          topic: string
          translations: Json
          validation: Json
          version: number
        }
        Insert: {
          active?: boolean
          answer_options?: Json
          approval_status?: string
          created_at?: string
          first_wording: string
          id: string
          requires_confirmation?: boolean
          response_type?: string
          returning_wording?: string | null
          topic: string
          translations?: Json
          validation?: Json
          version?: number
        }
        Update: {
          active?: boolean
          answer_options?: Json
          approval_status?: string
          created_at?: string
          first_wording?: string
          id?: string
          requires_confirmation?: boolean
          response_type?: string
          returning_wording?: string | null
          topic?: string
          translations?: Json
          validation?: Json
          version?: number
        }
        Relationships: []
      }
      topic_schedules: {
        Row: {
          active: boolean
          baby_id: string
          checkin_time: string
          created_at: string
          end_date: string | null
          frequency: string
          id: string
          last_completed_at: string | null
          next_due_at: string | null
          plan_version: number
          start_date: string | null
          topic: string
        }
        Insert: {
          active?: boolean
          baby_id: string
          checkin_time: string
          created_at?: string
          end_date?: string | null
          frequency: string
          id?: string
          last_completed_at?: string | null
          next_due_at?: string | null
          plan_version: number
          start_date?: string | null
          topic: string
        }
        Update: {
          active?: boolean
          baby_id?: string
          checkin_time?: string
          created_at?: string
          end_date?: string | null
          frequency?: string
          id?: string
          last_completed_at?: string | null
          next_due_at?: string | null
          plan_version?: number
          start_date?: string | null
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_schedules_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "care_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trigger_rules: {
        Row: {
          active: boolean
          approval_status: string
          created_at: string
          criteria: Json
          effective_from: string | null
          effective_to: string | null
          id: string
          question_id: string | null
          review_destination: string | null
          topic: string | null
          version: number
          workflow_action: string | null
        }
        Insert: {
          active?: boolean
          approval_status?: string
          created_at?: string
          criteria?: Json
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          question_id?: string | null
          review_destination?: string | null
          topic?: string | null
          version?: number
          workflow_action?: string | null
        }
        Update: {
          active?: boolean
          approval_status?: string
          created_at?: string
          criteria?: Json
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          question_id?: string | null
          review_destination?: string | null
          topic?: string | null
          version?: number
          workflow_action?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trigger_rules_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_svara_card: {
        Args: { p_baby: string; p_session: string; p_summary: string }
        Returns: string
      }
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
