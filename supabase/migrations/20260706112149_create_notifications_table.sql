CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'custom' CHECK (type IN ('workout', 'plan', 'appointment', 'custom')),
  title text NOT NULL,
  message text NOT NULL,
  related_id text DEFAULT null,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_client ON notifications(client_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Trainer sees all notifications; client sees only their own
DROP POLICY IF EXISTS "select_notifications" ON notifications;
CREATE POLICY "select_notifications" ON notifications FOR SELECT
  TO authenticated USING (
    (SELECT is_trainer()) = true
    OR notifications.client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

-- Only trainer can insert
DROP POLICY IF EXISTS "insert_notifications" ON notifications;
CREATE POLICY "insert_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (
    (SELECT is_trainer()) = true
  );

-- Client can update read status of their own; trainer can update all
DROP POLICY IF EXISTS "update_notifications" ON notifications;
CREATE POLICY "update_notifications" ON notifications FOR UPDATE
  TO authenticated USING (
    (SELECT is_trainer()) = true
    OR notifications.client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  ) WITH CHECK (
    (SELECT is_trainer()) = true
    OR notifications.client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

-- Only trainer can delete
DROP POLICY IF EXISTS "delete_notifications" ON notifications;
CREATE POLICY "delete_notifications" ON notifications FOR DELETE
  TO authenticated USING (
    (SELECT is_trainer()) = true
  );
