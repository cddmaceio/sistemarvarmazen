-- Adicionar campo turno na tabela usuarios
ALTER TABLE usuarios ADD COLUMN turno TEXT DEFAULT 'Manhã';

-- Atualizar usuários existentes com turnos baseados na função
UPDATE usuarios 
SET turno = CASE 
  WHEN funcao = 'Operador de Empilhadeira' THEN 'Manhã'
  WHEN funcao = 'Ajudante de Armazém' THEN 'Manhã'
  WHEN funcao = 'Conferente' THEN 'Tarde'
  WHEN funcao = 'Supervisor' THEN 'Geral'
  WHEN funcao = 'Gerente' THEN 'Geral'
  ELSE 'Manhã'
END
WHERE turno IS NULL OR turno = 'Manhã';

-- Criar índice para o campo turno
CREATE INDEX IF NOT EXISTS idx_usuarios_turno ON usuarios(turno);

-- Verificar os dados atualizados
SELECT id, nome, funcao, turno FROM usuarios ORDER BY id;