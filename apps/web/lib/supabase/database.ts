/**
 * Minimal Database type for the Supabase client. Only includes tables this
 * codebase actually writes to. Read-only tables (`propiedades`) keep using
 * inline casts in their data-fetching modules.
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          phone_e164: string | null;
          has_pet: boolean | null;
          pet_details: string | null;
          has_real_estate: boolean | null;
          real_estate_location: string | null;
          has_guarantor: boolean | null;
          guarantor_details: string | null;
          caucion_status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          phone_e164?: string | null;
          has_pet?: boolean | null;
          pet_details?: string | null;
          has_real_estate?: boolean | null;
          real_estate_location?: string | null;
          has_guarantor?: boolean | null;
          guarantor_details?: string | null;
          caucion_status?: string | null;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
        Relationships: [];
      };
      chats: {
        Row: {
          id: string;
          user_id: string | null;
          phone_e164: string;
          propiedad_posting_id: string | null;
          contact_name: string | null;
          last_message_at: string | null;
          last_inbound_at: string | null;
          unread_count: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          phone_e164: string;
          propiedad_posting_id?: string | null;
          contact_name?: string | null;
          last_message_at?: string | null;
          last_inbound_at?: string | null;
          unread_count?: number;
          status?: string;
        };
        Update: Partial<Database['public']['Tables']['chats']['Insert']>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          direction: 'in' | 'out';
          body: string | null;
          kind: string;
          kapso_message_id: string | null;
          status: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          direction: 'in' | 'out';
          body?: string | null;
          kind?: string;
          kapso_message_id?: string | null;
          status?: string | null;
          error?: string | null;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
        Relationships: [];
      };
      analyses: {
        Row: {
          id: string;
          url: string;
          posting_id: string | null;
          scraped_data: Record<string, unknown>;
          report: Record<string, unknown>;
          score: number | null;
          visual_description: string | null;
          visual_embedding: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          posting_id?: string | null;
          scraped_data: Record<string, unknown>;
          report: Record<string, unknown>;
          score?: number | null;
          visual_description?: string | null;
          visual_embedding?: number[] | null;
        };
        Update: Partial<Database['public']['Tables']['analyses']['Insert']>;
        Relationships: [];
      };
      feed_results: {
        Row: {
          id: string;
          user_id: string | null;
          search_id: string;
          posting_id: string;
          filters: Record<string, unknown>;
          match_score: number | null;
          report_summary: string | null;
          report_highlights: Record<string, unknown> | null;
          status: 'pending' | 'accepted' | 'rejected';
          decided_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          search_id: string;
          posting_id: string;
          filters: Record<string, unknown>;
          match_score?: number | null;
          report_summary?: string | null;
          report_highlights?: Record<string, unknown> | null;
          status?: 'pending' | 'accepted' | 'rejected';
          decided_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['feed_results']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
