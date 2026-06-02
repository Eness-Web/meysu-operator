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
      operator_accounts: {
        Row: { id: string; username: string; password: string; display_name: string; role: string; created_at: string }
        Insert: { id?: string; username: string; password: string; display_name: string; role: string; created_at?: string }
        Update: { id?: string; username?: string; password?: string; display_name?: string; role?: string; created_at?: string }
      }
      operator_machines: {
        Row: { operator_id: string; machine_id: string }
        Insert: { operator_id: string; machine_id: string }
        Update: { operator_id?: string; machine_id?: string }
      }
      machines: {
        Row: { id: string; line_id: string | null; code: string | null; name: string; machine_type: "ana" | "yan"; output_label: string | null; created_at: string }
        Insert: { id?: string; line_id?: string | null; code?: string | null; name: string; machine_type: "ana" | "yan"; output_label?: string | null; created_at?: string }
        Update: { id?: string; line_id?: string | null; code?: string | null; name?: string; machine_type?: "ana" | "yan"; output_label?: string | null; created_at?: string }
      }
      machine_start_logs: {
        Row: { id: string; operator_id: string; operator_name: string; personnel_name: string; machine_name: string; shift: string; start_time: string; note: string | null; created_at: string }
        Insert: { id?: string; operator_id: string; operator_name: string; personnel_name: string; machine_name: string; shift: string; start_time: string; note?: string | null; created_at?: string }
        Update: { id?: string; operator_id?: string; operator_name?: string; personnel_name?: string; machine_name?: string; shift?: string; start_time?: string; note?: string | null; created_at?: string }
      }
      machine_stop_logs: {
        Row: { id: string; operator_id: string; operator_name: string; personnel_name: string; machine_name: string; shift: string; stop_reason: string; start_time: string; end_time: string | null; duration_minutes: number | null; solution: string | null; created_at: string }
        Insert: { id?: string; operator_id: string; operator_name: string; personnel_name: string; machine_name: string; shift: string; stop_reason: string; start_time: string; end_time?: string | null; duration_minutes?: number | null; solution?: string | null; created_at?: string }
        Update: { id?: string; operator_id?: string; operator_name?: string; personnel_name?: string; machine_name?: string; shift?: string; stop_reason?: string; start_time?: string; end_time?: string | null; duration_minutes?: number | null; solution?: string | null; created_at?: string }
      }
      end_of_day_logs: {
        Row: { id: string; operator_id: string; operator_name: string; personnel_name: string; machine_name: string; shift: string; total_cans: number; waste_cans: number; net_cans: number; created_at: string }
        Insert: { id?: string; operator_id: string; operator_name: string; personnel_name: string; machine_name: string; shift: string; total_cans: number; waste_cans: number; net_cans: number; created_at?: string }
        Update: { id?: string; operator_id?: string; operator_name?: string; personnel_name?: string; machine_name?: string; shift?: string; total_cans?: number; waste_cans?: number; net_cans?: number; created_at?: string }
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

