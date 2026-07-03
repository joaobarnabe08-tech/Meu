/*
# Create appointments table for trainer scheduling

## Overview
This migration creates an `appointments` table that allows trainers to manage scheduling sessions with their clients. Trainers have full CRUD access; clients can view only their own appointments (read-only).

## New table: `appointments`
- `id` (uuid, primary key, auto-generated)
- `client_id` (text, not null, foreign key to clients.id ON DELETE CASCADE) — which client the appointment is for
- `title` (text, not null) — short title for the session (e.g. "Treino Personal", "Avaliação Física")
- `appointment_date` (date, not null) — the date of the session
- `start_time` (time, not null) — start time of the session
- `end_time` (time, nullable) — end time of the session (optional)
- `location` (text, nullable) — where the session takes place (e.g. "Ginásio", "Online")
- `notes` (text, nullable) — trainer's notes about the session
- `status` (text, not null, default 'scheduled') — scheduled | completed | cancelled
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

## Security — RLS policies
- **Trainer**: full CRUD via `is_trainer()` function (already exists from previous migration)
- **Client**: SELECT-only, scoped to their own appointments via `get_client_id_by_auth()` function (already exists)

## Indexes
- `idx_appointments_client_id` — fast lookup by client
- `idx_appointments_date` — fast lookup by date (calendar view)
- `idx_appointments_status` — filter by status
*/
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Sessão de Treino',
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  location text,
  notes text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Trainer: full CRUD
DROP POLICY IF EXISTS "trainer_select_appointments" ON appointments;
CREATE POLICY "trainer_select_appointments" ON appointments FOR SELECT
  TO authenticated USING (is_trainer() OR client_id = get_client_id_by_auth());

DROP POLICY IF EXISTS "trainer_insert_appointments" ON appointments;
CREATE POLICY "trainer_insert_appointments" ON appointments FOR INSERT
  TO authenticated WITH CHECK (is_trainer());

DROP POLICY IF EXISTS "trainer_update_appointments" ON appointments;
CREATE POLICY "trainer_update_appointments" ON appointments FOR UPDATE
  TO authenticated USING (is_trainer()) WITH CHECK (is_trainer());

DROP POLICY IF EXISTS "trainer_delete_appointments" ON appointments;
CREATE POLICY "trainer_delete_appointments" ON appointments FOR DELETE
  TO authenticated USING (is_trainer());
