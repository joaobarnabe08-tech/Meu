export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          birth_date: string | null;
          gender: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'created_at'> & { created_at?: string | null };
        Update: Partial<Database['public']['Tables']['clients']['Row']>;
      };
      anamneses: {
        Row: {
          id: string;
          client_id: string;
          health_history: string | null;
          goals: string | null;
          notes: string | null;
          parq_heart_condition: boolean | null;
          parq_chest_pain_activity: boolean | null;
          parq_chest_pain_rest: boolean | null;
          parq_dizziness: boolean | null;
          parq_bone_joint: boolean | null;
          parq_medication: boolean | null;
          parq_other_reason: boolean | null;
          parq_notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['anamneses']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string | null; updated_at?: string | null };
        Update: Partial<Database['public']['Tables']['anamneses']['Row']>;
      };
      physical_assessments: {
        Row: {
          id: string;
          client_id: string;
          assessment_date: string;
          weight: number | null;
          height: number | null;
          body_fat_percentage: number | null;
          imc: number | null;
          fat_mass: number | null;
          fat_free_mass: number | null;
          muscle_mass: number | null;
          skeletal_muscle_mass: number | null;
          body_water: number | null;
          protein: number | null;
          minerals: number | null;
          bone_mass: number | null;
          visceral_fat: number | null;
          basal_metabolic_rate: number | null;
          subcutaneous_fat: number | null;
          metabolic_age: number | null;
          inbody_score: number | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['physical_assessments']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string | null };
        Update: Partial<Database['public']['Tables']['physical_assessments']['Row']>;
      };
      workouts: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['workouts']['Row'], 'created_at'> & { created_at?: string | null };
        Update: Partial<Database['public']['Tables']['workouts']['Row']>;
      };
      workout_exercises: {
        Row: {
          id: string;
          workout_id: string;
          exercise_name: string;
          sets: number;
          reps: string;
          rest_seconds: number | null;
          order_index: number;
          video_url: string | null;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['workout_exercises']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['workout_exercises']['Row']>;
      };
      exercises_library: {
        Row: {
          id: string;
          name: string;
          muscle_group: string | null;
          video_url: string | null;
          description: string | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['exercises_library']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['exercises_library']['Row']>;
      };
      foods_library: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          calories_per_100g: number | null;
          proteins_per_100g: number | null;
          carbs_per_100g: number | null;
          fats_per_100g: number | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['foods_library']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['foods_library']['Row']>;
      };
      nutrition_plans: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          daily_calories: number | null;
          is_active: boolean;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['nutrition_plans']['Row'], 'created_at'> & { created_at?: string | null };
        Update: Partial<Database['public']['Tables']['nutrition_plans']['Row']>;
      };
      nutrition_meals: {
        Row: {
          id: string;
          nutrition_plan_id: string;
          meal_name: string;
          time: string;
          foods: string;
          calories: number | null;
          proteins: number | null;
          carbs: number | null;
          fats: number | null;
          order_index: number;
        };
        Insert: Omit<Database['public']['Tables']['nutrition_meals']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['nutrition_meals']['Row']>;
      };
    };
  };
};
