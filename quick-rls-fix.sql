-- Quick fix for infinite recursion in RLS policies
-- Run this in your Supabase SQL editor

-- Drop the problematic policies
DROP POLICY IF EXISTS "conversation_participants_select_participants" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert_participants" ON conversation_participants;
DROP POLICY IF EXISTS "messages_select_participants" ON messages;
DROP POLICY IF EXISTS "messages_insert_participants" ON messages;

-- Create simple, non-recursive policies
CREATE POLICY "conversation_participants_select_participants" ON conversation_participants 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "conversation_participants_insert_participants" ON conversation_participants 
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- For messages, use a simple approach (temporarily allow all for testing)
CREATE POLICY "messages_select_participants" ON messages 
  FOR SELECT USING (sender_id = auth.uid());

CREATE POLICY "messages_insert_participants" ON messages 
  FOR INSERT WITH CHECK (sender_id = auth.uid());
