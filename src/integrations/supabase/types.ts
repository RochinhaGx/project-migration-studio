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
      pedidos: {
        Row: {
          codigo: string
          created_at: string
          email: string | null
          entrega: Json | null
          frete: number
          id: string
          itens: Json
          metodo_pagamento: string
          mp_payment_id: string | null
          owner_id: string | null
          pagador: Json | null
          status: string
          stripe_session_id: string | null
          total: number
        }
        Insert: {
          codigo?: string
          created_at?: string
          email?: string | null
          entrega?: Json | null
          frete?: number
          id?: string
          itens?: Json
          metodo_pagamento?: string
          mp_payment_id?: string | null
          owner_id?: string | null
          pagador?: Json | null
          status?: string
          stripe_session_id?: string | null
          total?: number
        }
        Update: {
          codigo?: string
          created_at?: string
          email?: string | null
          entrega?: Json | null
          frete?: number
          id?: string
          itens?: Json
          metodo_pagamento?: string
          mp_payment_id?: string | null
          owner_id?: string | null
          pagador?: Json | null
          status?: string
          stripe_session_id?: string | null
          total?: number
        }
        Relationships: []
      }
      pedidos_sob_medida: {
        Row: {
          arquivo: string | null
          contato: string
          cor: string
          created_at: string
          descricao: string
          dimensoes: Json | null
          id: string
          logo_arquivo: string | null
          nome: string
          owner_id: string | null
        }
        Insert: {
          arquivo?: string | null
          contato: string
          cor?: string
          created_at?: string
          descricao: string
          dimensoes?: Json | null
          id?: string
          logo_arquivo?: string | null
          nome: string
          owner_id?: string | null
        }
        Update: {
          arquivo?: string | null
          contato?: string
          cor?: string
          created_at?: string
          descricao?: string
          dimensoes?: Json | null
          id?: string
          logo_arquivo?: string | null
          nome?: string
          owner_id?: string | null
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria: string
          cores: Json
          created_at: string
          descricao: string
          destaque: boolean
          especificacoes: Json
          id: string
          imagens: string[]
          materiais: string[]
          modelo_3d: string | null
          nome: string
          preco: number
          video_url: string | null
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          cores?: Json
          created_at?: string
          descricao?: string
          destaque?: boolean
          especificacoes?: Json
          id?: string
          imagens?: string[]
          materiais?: string[]
          modelo_3d?: string | null
          nome: string
          preco?: number
          video_url?: string | null
        }
        Update: {
          ativo?: boolean
          categoria?: string
          cores?: Json
          created_at?: string
          descricao?: string
          destaque?: boolean
          especificacoes?: Json
          id?: string
          imagens?: string[]
          materiais?: string[]
          modelo_3d?: string | null
          nome?: string
          preco?: number
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          display_name: string
          id: string
          preferences: Json
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string
          id: string
          preferences?: Json
        }
        Update: {
          avatar_url?: string | null
          display_name?: string
          id?: string
          preferences?: Json
        }
        Relationships: []
      }
      quote_rate_limits: {
        Row: {
          key: string
          last_submission: string
        }
        Insert: {
          key: string
          last_submission?: string
        }
        Update: {
          key?: string
          last_submission?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      claim_quote_slot: { Args: { client_key: string }; Returns: boolean }
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
      app_role: ["admin", "user"],
    },
  },
} as const
