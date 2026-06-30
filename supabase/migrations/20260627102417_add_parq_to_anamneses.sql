/*
# Adicionar campos PAR-Q à tabela anamneses

1. Alterações
   - Adiciona 7 colunas booleanas à tabela `anamneses` para as perguntas do questionário PAR-Q
   - Adiciona coluna de texto `parq_notes` para observações do PAR-Q
   - Todos os campos são nullable (clientes existentes não são afetados)

2. Campos adicionados
   - parq_heart_condition: Algum médico disse que tens uma condição cardíaca?
   - parq_chest_pain_activity: Sentes dor no peito durante atividade física?
   - parq_chest_pain_rest: Sentiste dor no peito em repouso no último mês?
   - parq_dizziness: Perdeste o equilíbrio por tonturas ou já perdeste os sentidos?
   - parq_bone_joint: Tens algum problema ósseo/articular que pode piorar com exercício?
   - parq_medication: Estás a tomar medicação para pressão arterial ou coração?
   - parq_other_reason: Conheces outra razão para não praticar exercício?
   - parq_notes: Observações adicionais sobre o PAR-Q
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'parq_heart_condition') THEN
    ALTER TABLE anamneses ADD COLUMN parq_heart_condition boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'parq_chest_pain_activity') THEN
    ALTER TABLE anamneses ADD COLUMN parq_chest_pain_activity boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'parq_chest_pain_rest') THEN
    ALTER TABLE anamneses ADD COLUMN parq_chest_pain_rest boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'parq_dizziness') THEN
    ALTER TABLE anamneses ADD COLUMN parq_dizziness boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'parq_bone_joint') THEN
    ALTER TABLE anamneses ADD COLUMN parq_bone_joint boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'parq_medication') THEN
    ALTER TABLE anamneses ADD COLUMN parq_medication boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'parq_other_reason') THEN
    ALTER TABLE anamneses ADD COLUMN parq_other_reason boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'parq_notes') THEN
    ALTER TABLE anamneses ADD COLUMN parq_notes text;
  END IF;
END $$;
