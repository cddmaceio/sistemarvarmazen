-- Migration 22: Criar tabelas para sistema WMS
-- Criação das tabelas cadastro_wms e tarefas_wms

-- Tabela para cadastro de usuários WMS
CREATE TABLE IF NOT EXISTS cadastro_wms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  login_wms TEXT NOT NULL UNIQUE,
  nome_wms TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para tarefas WMS importadas
CREATE TABLE IF NOT EXISTS tarefas_wms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  armazem_mapa TEXT,
  tarefa TEXT,
  placa_cavalo TEXT,
  placa_carreta TEXT,
  origem TEXT,
  destino TEXT,
  palete TEXT,
  prioridade TEXT,
  status TEXT,
  tipo TEXT,
  usuario TEXT,
  data_criacao DATETIME,
  data_ultima_associacao DATETIME,
  data_alteracao DATETIME,
  data_liberacao DATETIME,
  concluida_task BOOLEAN DEFAULT FALSE,
  tempo_execucao INTEGER, -- em segundos
  tarefa_valida BOOLEAN DEFAULT FALSE, -- TRUE se tempo_execucao > 10 segundos
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES usuarios(id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cadastro_wms_cpf ON cadastro_wms(cpf);
CREATE INDEX IF NOT EXISTS idx_cadastro_wms_login ON cadastro_wms(login_wms);
CREATE INDEX IF NOT EXISTS idx_tarefas_wms_user_id ON tarefas_wms(user_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_wms_data_criacao ON tarefas_wms(data_criacao);
CREATE INDEX IF NOT EXISTS idx_tarefas_wms_status ON tarefas_wms(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_wms_tarefa_valida ON tarefas_wms(tarefa_valida);
CREATE INDEX IF NOT EXISTS idx_tarefas_wms_usuario ON tarefas_wms(usuario);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER IF NOT EXISTS update_cadastro_wms_updated_at
  AFTER UPDATE ON cadastro_wms
  FOR EACH ROW
BEGIN
  UPDATE cadastro_wms SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_tarefas_wms_updated_at
  AFTER UPDATE ON tarefas_wms
  FOR EACH ROW
BEGIN
  UPDATE tarefas_wms SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger para calcular automaticamente se a tarefa é válida baseado no tempo de execução
CREATE TRIGGER IF NOT EXISTS calculate_tarefa_valida
  AFTER UPDATE OF tempo_execucao ON tarefas_wms
  FOR EACH ROW
BEGIN
  UPDATE tarefas_wms 
  SET tarefa_valida = CASE 
    WHEN NEW.tempo_execucao > 10 THEN TRUE 
    ELSE FALSE 
  END
  WHERE id = NEW.id;
END;