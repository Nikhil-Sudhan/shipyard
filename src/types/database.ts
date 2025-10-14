export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          location_city: string | null
          location_country: string | null
          interests: string[] | null
          primary_photo_url: string | null
          extra_photo_urls: string[] | null
          summary_intro: string[] | null
          summary_outro: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          location_city?: string | null
          location_country?: string | null
          interests?: string[] | null
          primary_photo_url?: string | null
          extra_photo_urls?: string[] | null
          summary_intro?: string[] | null
          summary_outro?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          location_city?: string | null
          location_country?: string | null
          interests?: string[] | null
          primary_photo_url?: string | null
          extra_photo_urls?: string[] | null
          summary_intro?: string[] | null
          summary_outro?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profile_answers: {
        Row: {
          id: string
          user_id: string
          question_key: string
          answer_text: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_key: string
          answer_text: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_key?: string
          answer_text?: string
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id?: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          user_id?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type ProfileAnswer = Database['public']['Tables']['profile_answers']['Row']
export type ProfileAnswerInsert = Database['public']['Tables']['profile_answers']['Insert']

export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']

export type ConversationParticipant = Database['public']['Tables']['conversation_participants']['Row']
export type ConversationParticipantInsert = Database['public']['Tables']['conversation_participants']['Insert']

export type Message = Database['public']['Tables']['messages']['Row']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']


