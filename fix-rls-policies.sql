-- Fix RLS policies to prevent infinite recursion
-- Run this in your Supabase SQL editor

-- Drop ALL existing policies that might cause issues
DROP POLICY IF EXISTS "conversation_participants_select_participants" ON conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert_participants" ON conversation_participants;
DROP POLICY IF EXISTS "messages_select_participants" ON messages;
DROP POLICY IF EXISTS "messages_insert_participants" ON messages;

-- Create simplified policies that don't cause recursion
CREATE POLICY "conversation_participants_select_participants" ON conversation_participants 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "conversation_participants_insert_participants" ON conversation_participants 
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- For messages, we'll use a different approach
-- First, let's create a function to check if user is participant
CREATE OR REPLACE FUNCTION is_conversation_participant(conversation_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conversation_uuid 
    AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the message policies using the function
CREATE POLICY "messages_select_participants" ON messages 
  FOR SELECT USING (is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "messages_insert_participants" ON messages 
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND 
    is_conversation_participant(conversation_id, auth.uid())
  );
