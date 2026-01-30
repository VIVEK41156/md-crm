-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('success', 'error', 'info', 'warning')),
  action_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications" ON notifications
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- System can create notifications (through service role)
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Function to create notification for action
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_action_type TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, action_type, resource_type, resource_id)
  VALUES (p_user_id, p_title, p_message, p_type, p_action_type, p_resource_type, p_resource_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify all admins
CREATE OR REPLACE FUNCTION notify_all_admins(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_action_type TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, action_type, resource_type, resource_id)
  SELECT id, p_title, p_message, p_type, p_action_type, p_resource_type, p_resource_id
  FROM profiles
  WHERE role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;