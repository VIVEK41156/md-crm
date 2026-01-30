-- Drop existing leads policies
DROP POLICY IF EXISTS "Users can view all leads" ON leads;
DROP POLICY IF EXISTS "Users can view leads" ON leads;

-- Admins can view all leads
CREATE POLICY "Admins can view all leads" ON leads
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Users can view leads assigned to them
CREATE POLICY "Users can view assigned leads" ON leads
  FOR SELECT TO authenticated USING (assigned_to = auth.uid());

-- Users can view unassigned leads (optional - remove if you don't want this)
CREATE POLICY "Users can view unassigned leads" ON leads
  FOR SELECT TO authenticated USING (assigned_to IS NULL);

-- Keep other policies as is for INSERT, UPDATE, DELETE
-- These should already be restricted by permissions