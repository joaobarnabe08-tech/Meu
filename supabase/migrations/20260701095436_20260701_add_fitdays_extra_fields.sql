/*
# Add Fitdays-specific composition fields to physical_assessments

1. Changes to `physical_assessments`:
   - `muscle_rate` (numeric) - Taxa muscular (%)
   - `skeletal_muscle_percentage` (numeric) - Massa Musc. Esquelética (%)
   - `protein_percentage` (numeric) - Proteína (%)
   - `body_water_percentage` (numeric) - Água corporal (%)
   - `smi` (numeric) - Skeletal Muscle Index (kg/m²)
   - `fitdays_score` (numeric) - Pontuação Fitdays (replaces inbody_score label-wise, kept for backward compat)

2. Security: No RLS changes (table already has policies)
*/

ALTER TABLE physical_assessments
ADD COLUMN IF NOT EXISTS muscle_rate numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS skeletal_muscle_percentage numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS protein_percentage numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS body_water_percentage numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS smi numeric DEFAULT null;