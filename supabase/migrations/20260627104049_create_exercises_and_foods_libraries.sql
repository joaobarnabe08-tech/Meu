/*
# Biblioteca de Exercícios e Alimentos

1. Novas Tabelas
   - `exercises_library`: Catálogo global de exercícios com URL de vídeo demonstrativo
     - id, name, muscle_group, video_url, description
   - `foods_library`: Base de dados de alimentos com macronutrientes por 100g
     - id, name, calories_per_100g, proteins_per_100g, carbs_per_100g, fats_per_100g, category

2. Alterações
   - `workout_exercises`: Adiciona coluna `video_url` para sobrepor ou usar o vídeo do exercício

3. Segurança
   - RLS ativo, leitura pública (anon + authenticated) em ambas as bibliotecas
   - Sem políticas de escrita para clientes (bibliotecas são geridas pelo sistema)
*/

-- Exercícios
CREATE TABLE IF NOT EXISTS exercises_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  muscle_group text,
  video_url text,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exercises_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_exercises" ON exercises_library;
CREATE POLICY "public_read_exercises" ON exercises_library FOR SELECT
TO anon, authenticated USING (true);

-- Alimentos
CREATE TABLE IF NOT EXISTS foods_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  calories_per_100g numeric(7,2),
  proteins_per_100g numeric(6,2),
  carbs_per_100g numeric(6,2),
  fats_per_100g numeric(6,2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE foods_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_foods" ON foods_library;
CREATE POLICY "public_read_foods" ON foods_library FOR SELECT
TO anon, authenticated USING (true);

-- Adiciona video_url a workout_exercises
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_exercises' AND column_name = 'video_url') THEN
    ALTER TABLE workout_exercises ADD COLUMN video_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_exercises' AND column_name = 'notes') THEN
    ALTER TABLE workout_exercises ADD COLUMN notes text;
  END IF;
END $$;
