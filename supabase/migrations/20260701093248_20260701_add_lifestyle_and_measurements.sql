/*
# Add Lifestyle Habits to Anamneses and Body Measurements to Physical Assessments

1. Changes to `anamneses` table:
   - `trains_currently` (boolean) - Does the client currently train?
   - `training_duration` (text) - How long has the client been training / not training?
   - `training_frequency` (text) - How many times per week does the client train?
   - `sedentary_habits` (text) - Description of daily movement/activity level
   - `smokes` (boolean) - Does the client smoke?
   - `cigarettes_per_day` (integer) - Number of cigarettes per day (if smoking)
   - `sleep_hours` (numeric) - Average hours of sleep per day
   - `meals_per_day` (integer) - Number of meals per day
   - `hydration_liters` (numeric) - Daily water intake in liters

2. Changes to `physical_assessments` table:
   Body Circumferences:
   - `shoulder_circumference` (numeric) - Shoulder circumference in cm
   - `chest_circumference` (numeric) - Chest circumference in cm
   - `right_arm_circumference` (numeric) - Right arm circumference in cm
   - `left_arm_circumference` (numeric) - Left arm circumference in cm
   - `waist_circumference` (numeric) - Waist circumference in cm
   - `hip_circumference` (numeric) - Hip circumference in cm
   - `right_thigh_circumference` (numeric) - Right thigh circumference in cm
   - `left_thigh_circumference` (numeric) - Left thigh circumference in cm
   - `right_calf_circumference` (numeric) - Right calf circumference in cm
   - `left_calf_circumference` (numeric) - Left calf circumference in cm
   
   Cardiovascular:
   - `systolic_bp` (numeric) - Systolic blood pressure (mmHg)
   - `diastolic_bp` (numeric) - Diastolic blood pressure (mmHg)
   - `resting_hr` (numeric) - Resting heart rate (bpm)
   - `max_hr_tanaka` (numeric) - Max heart rate calculated using Tanaka formula
   
   Fitdays Data (replacing InBody-specific naming):
   - `protein_mass` (numeric) - Already exists as `protein`
   - Note: Using existing fields where possible, adding new ones for Fitdays-specific data

3. Security:
   - No changes to RLS policies (tables already have appropriate policies)
*/

-- Add lifestyle fields to anamneses
ALTER TABLE anamneses
ADD COLUMN IF NOT EXISTS trains_currently boolean DEFAULT null,
ADD COLUMN IF NOT EXISTS training_duration text DEFAULT null,
ADD COLUMN IF NOT EXISTS training_frequency text DEFAULT null,
ADD COLUMN IF NOT EXISTS sedentary_habits text DEFAULT null,
ADD COLUMN IF NOT EXISTS smokes boolean DEFAULT null,
ADD COLUMN IF NOT EXISTS cigarettes_per_day integer DEFAULT null,
ADD COLUMN IF NOT EXISTS sleep_hours numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS meals_per_day integer DEFAULT null,
ADD COLUMN IF NOT EXISTS hydration_liters numeric DEFAULT null;

-- Add body measurement fields to physical_assessments
ALTER TABLE physical_assessments
ADD COLUMN IF NOT EXISTS shoulder_circumference numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS chest_circumference numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS right_arm_circumference numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS left_arm_circumference numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS waist_circumference numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS hip_circumference numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS right_thigh_circumference numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS left_thigh_circumference numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS right_calf_circumference numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS left_calf_circumference numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS systolic_bp numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS diastolic_bp numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS resting_hr numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS max_hr_tanaka numeric DEFAULT null,
ADD COLUMN IF NOT EXISTS waist_hip_ratio numeric DEFAULT null;