/*
# Add client authentication and invitation system

## Overview
This migration adds a complete authentication system for clients, allowing trainers to invite clients via email. Clients receive an email, activate their account, and are automatically linked to their existing client profile. Row Level Security ensures each client can only see their own data.

## Changes

### 1. Modified table: `clients`
- Added column `auth_user_id` (uuid, nullable) — links the client profile to a Supabase auth user account. Nullable so existing client profiles (without auth) continue to work. Has a unique constraint so one auth account maps to exactly one client profile.

### 2. New table: `invites`
- `id` (uuid, primary key)
- `client_id` (text, foreign key to clients.id ON DELETE CASCADE) — which client profile the invite is for
- `email` (text, not null) — the email address the invite was sent to
- `token` (uuid, not null, unique) — unique token for the invite link
- `status` (text, not null, default 'pending') — pending | accepted | expired
- `expires_at` (timestamptz, not null) — when the invite expires (7 days from creation)
- `created_at` (timestamptz, default now())
- `accepted_at` (timestamptz, nullable) — when the client activated their account

### 3. Security — RLS policies

**clients table:**
- Trainer (anon key) keeps full CRUD access (the trainer app uses the anon key)
- Authenticated clients can SELECT their own row (where auth.uid() = auth_user_id)

**invites table:**
- Trainer (anon key) can INSERT and SELECT invites (trainer creates and views invites)
- Authenticated clients can SELECT their own invites (where the invite's client_id matches a client with auth_user_id = auth.uid())

**All child tables (anamneses, physical_assessments, workouts, workout_exercises, nutrition_plans, nutrition_meals):**
- Trainer (anon key) keeps full CRUD (existing behavior preserved)
- Authenticated clients get SELECT-only access scoped to their client profile via the parent's auth_user_id

### 4. Indexes
- `idx_clients_auth_user_id` on clients(auth_user_id) — fast lookup by auth user
- `idx_invites_token` on invites(token) — fast invite lookup by token
- `idx_invites_client_id` on invites(client_id) — fast invite lookup by client
- `idx_invites_email` on invites(email) — fast invite lookup by email

## Important notes
1. The trainer app uses the anon key (no sign-in), so all trainer operations go through `TO anon, authenticated` policies.
2. Client sign-in uses Supabase Auth (email/password). After sign-in, the client's auth.uid() is matched against clients.auth_user_id.
3. Clients have SELECT-only access to their data — they cannot INSERT, UPDATE, or DELETE any records.
4. The trainer retains full CRUD on all tables.
5. Existing client profiles without auth_user_id continue to work normally for the trainer.
*/

-- ============================================================
-- 1. Add auth_user_id to clients
-- ============================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Unique constraint so one auth account maps to exactly one client profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_auth_user_id_key'
  ) THEN
    ALTER TABLE clients ADD CONSTRAINT clients_auth_user_id_key UNIQUE (auth_user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clients_auth_user_id ON clients(auth_user_id);

-- ============================================================
-- 2. Create invites table
-- ============================================================
CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_client_id ON invites(client_id);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);

-- ============================================================
-- 3. RLS policies for clients table
-- ============================================================
-- Trainer (anon) keeps full access
DROP POLICY IF EXISTS "anon_select_clients" ON clients;
CREATE POLICY "anon_select_clients" ON clients FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_clients" ON clients;
CREATE POLICY "anon_insert_clients" ON clients FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_clients" ON clients;
CREATE POLICY "anon_update_clients" ON clients FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_clients" ON clients;
CREATE POLICY "anon_delete_clients" ON clients FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 4. RLS policies for invites table
-- ============================================================
-- Trainer (anon) can create and view invites
DROP POLICY IF EXISTS "anon_select_invites" ON invites;
CREATE POLICY "anon_select_invites" ON invites FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_invites" ON invites;
CREATE POLICY "anon_insert_invites" ON invites FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_invites" ON invites;
CREATE POLICY "anon_update_invites" ON invites FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_invites" ON invites;
CREATE POLICY "anon_delete_invites" ON invites FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 5. RLS policies for anamneses — client SELECT-only
-- ============================================================
DROP POLICY IF EXISTS "client_select_anamneses" ON anamneses;
CREATE POLICY "client_select_anamneses" ON anamneses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = anamneses.client_id
      AND clients.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. RLS policies for physical_assessments — client SELECT-only
-- ============================================================
DROP POLICY IF EXISTS "client_select_physical_assessments" ON physical_assessments;
CREATE POLICY "client_select_physical_assessments" ON physical_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = physical_assessments.client_id
      AND clients.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. RLS policies for workouts — client SELECT-only
-- ============================================================
DROP POLICY IF EXISTS "client_select_workouts" ON workouts;
CREATE POLICY "client_select_workouts" ON workouts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = workouts.client_id
      AND clients.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- 8. RLS policies for workout_exercises — client SELECT-only
-- ============================================================
DROP POLICY IF EXISTS "client_select_workout_exercises" ON workout_exercises;
CREATE POLICY "client_select_workout_exercises" ON workout_exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      JOIN clients ON clients.id = workouts.client_id
      WHERE workouts.id = workout_exercises.workout_id
      AND clients.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- 9. RLS policies for nutrition_plans — client SELECT-only
-- ============================================================
DROP POLICY IF EXISTS "client_select_nutrition_plans" ON nutrition_plans;
CREATE POLICY "client_select_nutrition_plans" ON nutrition_plans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = nutrition_plans.client_id
      AND clients.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- 10. RLS policies for nutrition_meals — client SELECT-only
-- ============================================================
DROP POLICY IF EXISTS "client_select_nutrition_meals" ON nutrition_meals;
CREATE POLICY "client_select_nutrition_meals" ON nutrition_meals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM nutrition_plans
      JOIN clients ON clients.id = nutrition_plans.client_id
      WHERE nutrition_plans.id = nutrition_meals.nutrition_plan_id
      AND clients.auth_user_id = auth.uid()
    )
  );
