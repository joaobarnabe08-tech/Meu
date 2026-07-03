/*
# Add trainer role detection and update RLS for authenticated access

## Overview
This migration introduces a role system to distinguish trainers from clients in the auth system. Trainers get full CRUD access to all tables; clients get SELECT-only access to their own data. The previous anon-key access is replaced by authenticated access since the app now requires login for both user types.

## Changes

### 1. Helper function: `is_trainer()`
- A SECURITY DEFINER function that checks if the current authenticated user has `role = 'trainer'` in their `raw_app_meta_data`. This is the user-immutable metadata set during account creation.
- Returns boolean.

### 2. Helper function: `get_client_id_by_auth()`
- A SECURITY DEFINER function that returns the `clients.id` for the current authenticated user by matching `auth_user_id = auth.uid()`.
- Returns text or NULL.

### 3. RLS policy updates
All tables previously had `TO anon, authenticated USING (true)` policies (open access for the anon key). These are replaced with:
- **Trainer access**: `TO authenticated USING (is_trainer())` — full CRUD for trainers
- **Client SELECT access**: `TO authenticated USING (...ownership check...)` — read-only for clients on their own data
- The `anon` role is removed from policies since the app now requires authentication.

### 4. Tables affected
- `clients` — trainer full CRUD; client SELECT own row
- `anamneses` — trainer full CRUD; client SELECT own
- `physical_assessments` — trainer full CRUD; client SELECT own
- `workouts` — trainer full CRUD; client SELECT own
- `workout_exercises` — trainer full CRUD; client SELECT own (via parent workout)
- `nutrition_plans` — trainer full CRUD; client SELECT own
- `nutrition_meals` — trainer full CRUD; client SELECT own (via parent plan)
- `exercises_library` — trainer full CRUD; client SELECT all (library is shared reference data)
- `foods_library` — trainer full CRUD; client SELECT all (library is shared reference data)
- `invites` — trainer full CRUD; client SELECT own

## Important notes
1. The trainer account must be created with `raw_app_meta_data: { role: 'trainer' }` — this is done via the Supabase admin API or the activation flow.
2. Client accounts are created via the invite flow and linked to a `clients` row via `auth_user_id`.
3. The `is_trainer()` function uses `SECURITY DEFINER` so it can read `auth.users.raw_app_meta_data` which is not accessible to the anon role.
4. Existing anon policies are dropped and replaced — the app now requires authentication for all operations.
*/

-- ============================================================
-- 1. Helper functions
-- ============================================================

-- Check if current user is a trainer
CREATE OR REPLACE FUNCTION public.is_trainer()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT raw_app_meta_data->>'role' = 'trainer'
     FROM auth.users
     WHERE id = auth.uid()),
    false
  );
$$;

-- Get the client_id for the current authenticated user
CREATE OR REPLACE FUNCTION public.get_client_id_by_auth()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.clients WHERE auth_user_id = auth.uid();
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_trainer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_id_by_auth() TO authenticated;

-- ============================================================
-- 2. clients table — update RLS
-- ============================================================
DROP POLICY IF EXISTS "anon_select_clients" ON clients;
DROP POLICY IF EXISTS "anon_insert_clients" ON clients;
DROP POLICY IF EXISTS "anon_update_clients" ON clients;
DROP POLICY IF EXISTS "anon_delete_clients" ON clients;
DROP POLICY IF EXISTS "client_select_clients" ON clients;

-- Trainer: full CRUD
CREATE POLICY "trainer_select_clients" ON clients FOR SELECT
  TO authenticated USING (is_trainer() OR auth_user_id = auth.uid());

CREATE POLICY "trainer_insert_clients" ON clients FOR INSERT
  TO authenticated WITH CHECK (is_trainer());

CREATE POLICY "trainer_update_clients" ON clients FOR UPDATE
  TO authenticated USING (is_trainer()) WITH CHECK (is_trainer());

CREATE POLICY "trainer_delete_clients" ON clients FOR DELETE
  TO authenticated USING (is_trainer());

-- ============================================================
-- 3. invites table — update RLS
-- ============================================================
DROP POLICY IF EXISTS "anon_select_invites" ON invites;
DROP POLICY IF EXISTS "anon_insert_invites" ON invites;
DROP POLICY IF EXISTS "anon_update_invites" ON invites;
DROP POLICY IF EXISTS "anon_delete_invites" ON invites;

CREATE POLICY "trainer_select_invites" ON invites FOR SELECT
  TO authenticated USING (is_trainer() OR client_id = get_client_id_by_auth());

CREATE POLICY "trainer_insert_invites" ON invites FOR INSERT
  TO authenticated WITH CHECK (is_trainer());

CREATE POLICY "trainer_update_invites" ON invites FOR UPDATE
  TO authenticated USING (is_trainer()) WITH CHECK (is_trainer());

CREATE POLICY "trainer_delete_invites" ON invites FOR DELETE
  TO authenticated USING (is_trainer());

-- ============================================================
-- 4. anamneses table — update RLS
-- ============================================================
-- Drop existing anon policies
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT policyname FROM pg_policies WHERE tablename = 'anamneses' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON anamneses', t);
  END LOOP;
END $$;

CREATE POLICY "trainer_select_anamneses" ON anamneses FOR SELECT
  TO authenticated USING (is_trainer() OR client_id = get_client_id_by_auth());
CREATE POLICY "trainer_insert_anamneses" ON anamneses FOR INSERT
  TO authenticated WITH CHECK (is_trainer());
CREATE POLICY "trainer_update_anamneses" ON anamneses FOR UPDATE
  TO authenticated USING (is_trainer()) WITH CHECK (is_trainer());
CREATE POLICY "trainer_delete_anamneses" ON anamneses FOR DELETE
  TO authenticated USING (is_trainer());

-- ============================================================
-- 5. physical_assessments table — update RLS
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT policyname FROM pg_policies WHERE tablename = 'physical_assessments' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON physical_assessments', t);
  END LOOP;
END $$;

CREATE POLICY "trainer_select_assessments" ON physical_assessments FOR SELECT
  TO authenticated USING (is_trainer() OR client_id = get_client_id_by_auth());
CREATE POLICY "trainer_insert_assessments" ON physical_assessments FOR INSERT
  TO authenticated WITH CHECK (is_trainer());
CREATE POLICY "trainer_update_assessments" ON physical_assessments FOR UPDATE
  TO authenticated USING (is_trainer()) WITH CHECK (is_trainer());
CREATE POLICY "trainer_delete_assessments" ON physical_assessments FOR DELETE
  TO authenticated USING (is_trainer());

-- ============================================================
-- 6. workouts table — update RLS
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT policyname FROM pg_policies WHERE tablename = 'workouts' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON workouts', t);
  END LOOP;
END $$;

CREATE POLICY "trainer_select_workouts" ON workouts FOR SELECT
  TO authenticated USING (is_trainer() OR client_id = get_client_id_by_auth());
CREATE POLICY "trainer_insert_workouts" ON workouts FOR INSERT
  TO authenticated WITH CHECK (is_trainer());
CREATE POLICY "trainer_update_workouts" ON workouts FOR UPDATE
  TO authenticated USING (is_trainer()) WITH CHECK (is_trainer());
CREATE POLICY "trainer_delete_workouts" ON workouts FOR DELETE
  TO authenticated USING (is_trainer());

-- ============================================================
-- 7. workout_exercises table — update RLS
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT policyname FROM pg_policies WHERE tablename = 'workout_exercises' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON workout_exercises', t);
  END LOOP;
END $$;

CREATE POLICY "trainer_select_workout_exercises" ON workout_exercises FOR SELECT
  TO authenticated USING (
    is_trainer() OR EXISTS (
      SELECT 1 FROM workouts w
      JOIN clients c ON c.id = w.client_id
      WHERE w.id = workout_exercises.workout_id AND c.auth_user_id = auth.uid()
    )
  );
CREATE POLICY "trainer_insert_workout_exercises" ON workout_exercises FOR INSERT
  TO authenticated WITH CHECK (is_trainer());
CREATE POLICY "trainer_update_workout_exercises" ON workout_exercises FOR UPDATE
  TO authenticated USING (is_trainer()) WITH CHECK (is_trainer());
CREATE POLICY "trainer_delete_workout_exercises" ON workout_exercises FOR DELETE
  TO authenticated USING (is_trainer());

-- ============================================================
-- 8. nutrition_plans table — update RLS
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT policyname FROM pg_policies WHERE tablename = 'nutrition_plans' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON nutrition_plans', t);
  END LOOP;
END $$;

CREATE POLICY "trainer_select_nutrition_plans" ON nutrition_plans FOR SELECT
  TO authenticated USING (is_trainer() OR client_id = get_client_id_by_auth());
CREATE POLICY "trainer_insert_nutrition_plans" ON nutrition_plans FOR INSERT
  TO authenticated WITH CHECK (is_trainer());
CREATE POLICY "trainer_update_nutrition_plans" ON nutrition_plans FOR UPDATE
  TO authenticated USING (is_trainer()) WITH CHECK (is_trainer());
CREATE POLICY "trainer_delete_nutrition_plans" ON nutrition_plans FOR DELETE
  TO authenticated USING (is_trainer());

-- ============================================================
-- 9. nutrition_meals table — update RLS
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT policyname FROM pg_policies WHERE tablename = 'nutrition_meals' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON nutrition_meals', t);
  END LOOP;
END $$;

CREATE POLICY "trainer_select_nutrition_meals" ON nutrition_meals FOR SELECT
  TO authenticated USING (
    is_trainer() OR EXISTS (
      SELECT 1 FROM nutrition_plans np
      JOIN clients c ON c.id = np.client_id
      WHERE np.id = nutrition_meals.nutrition_plan_id AND c.auth_user_id = auth.uid()
    )
  );
CREATE POLICY "trainer_insert_nutrition_meals" ON nutrition_meals FOR INSERT
  TO authenticated WITH CHECK (is_trainer());
CREATE POLICY "trainer_update_nutrition_meals" ON nutrition_meals FOR UPDATE
  TO authenticated USING (is_trainer()) WITH CHECK (is_trainer());
CREATE POLICY "trainer_delete_nutrition_meals" ON nutrition_meals FOR DELETE
  TO authenticated USING (is_trainer());

-- ============================================================
-- 10. exercises_library table — update RLS
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT policyname FROM pg_policies WHERE tablename = 'exercises_library' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON exercises_library', t);
  END LOOP;
END $$;

-- Trainer: full CRUD; Client: SELECT all (shared reference data)
CREATE POLICY "trainer_select_exercises_library" ON exercises_library FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "trainer_insert_exercises_library" ON exercises_library FOR INSERT
  TO authenticated WITH CHECK (is_trainer());
CREATE POLICY "trainer_update_exercises_library" ON exercises_library FOR UPDATE
  TO authenticated USING (is_trainer()) WITH CHECK (is_trainer());
CREATE POLICY "trainer_delete_exercises_library" ON exercises_library FOR DELETE
  TO authenticated USING (is_trainer());

-- ============================================================
-- 11. foods_library table — update RLS
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT policyname FROM pg_policies WHERE tablename = 'foods_library' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON foods_library', t);
  END LOOP;
END $$;

-- Trainer: full CRUD; Client: SELECT all (shared reference data)
CREATE POLICY "trainer_select_foods_library" ON foods_library FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "trainer_insert_foods_library" ON foods_library FOR INSERT
  TO authenticated WITH CHECK (is_trainer());
CREATE POLICY "trainer_update_foods_library" ON foods_library FOR UPDATE
  TO authenticated USING (is_trainer()) WITH CHECK (is_trainer());
CREATE POLICY "trainer_delete_foods_library" ON foods_library FOR DELETE
  TO authenticated USING (is_trainer());
