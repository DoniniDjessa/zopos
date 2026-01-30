export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      "zop-users": {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          created_at: string;
          updated_at: string;
          avatar_url: string | null;
          phone: string | null;
          preferences: Json | null;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          created_at?: string;
          updated_at?: string;
          avatar_url?: string | null;
          phone?: string | null;
          preferences?: Json | null;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          created_at?: string;
          updated_at?: string;
          avatar_url?: string | null;
          phone?: string | null;
          preferences?: Json | null;
        };
      };
    };
  };
}
