
-- Add missing fields to KPIs table for better management
ALTER TABLE kpis ADD COLUMN descricao TEXT;
ALTER TABLE kpis ADD COLUMN status_ativo BOOLEAN DEFAULT true;
