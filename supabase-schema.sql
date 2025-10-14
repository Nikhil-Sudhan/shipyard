-- Shipyard Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  location_city TEXT,
  location_country TEXT,
  interests TEXT[],
  primary_photo_url TEXT,
  extra_photo_urls TEXT[],
  summary_intro TEXT[],
  summary_outro TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profile_answers table
CREATE TABLE profile_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversation_participants table
CREATE TABLE conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_interests ON profiles USING GIN (interests);
CREATE INDEX idx_profiles_location ON profiles (location_country, location_city);
CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at);
CREATE INDEX idx_conversation_participants_user ON conversation_participants (user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for profile_answers
CREATE POLICY "profile_answers_select_own" ON profile_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profile_answers_insert_own" ON profile_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profile_answers_update_own" ON profile_answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profile_answers_delete_own" ON profile_answers FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for conversations
CREATE POLICY "conversations_select_participants" ON conversations FOR SELECT 
  USING (id IN (
    SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
  ));
CREATE POLICY "conversations_insert_participants" ON conversations FOR INSERT 
  WITH CHECK (true); -- Will be handled by conversation_participants

-- RLS Policies for conversation_participants
CREATE POLICY "conversation_participants_select_participants" ON conversation_participants FOR SELECT 
  USING (user_id = auth.uid() OR conversation_id IN (
    SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
  ));
CREATE POLICY "conversation_participants_insert_participants" ON conversation_participants FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "messages_select_participants" ON messages FOR SELECT 
  USING (conversation_id IN (
    SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
  ));
CREATE POLICY "messages_insert_participants" ON messages FOR INSERT 
  WITH CHECK (
    sender_id = auth.uid() AND 
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);

-- Storage policies for profile photos
CREATE POLICY "profile_photos_select_public" ON storage.objects FOR SELECT 
  USING (bucket_id = 'profile-photos');

CREATE POLICY "profile_photos_insert_own" ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'profile-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "profile_photos_update_own" ON storage.objects FOR UPDATE 
  USING (
    bucket_id = 'profile-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "profile_photos_delete_own" ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'profile-photos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
