-- Script para corrigir problemas de encoding na coluna turno
-- Padroniza todas as variações de 'manhã' para 'Manhã'

-- Primeiro, vamos ver os valores únicos atuais na coluna turno
SELECT DISTINCT turno, 
       LENGTH(turno) as tamanho,
       ASCII(SUBSTRING(turno, 1, 1)) as primeiro_char_ascii,
       ASCII(SUBSTRING(turno, -1, 1)) as ultimo_char_ascii
FROM usuarios 
WHERE turno IS NOT NULL
ORDER BY turno;

-- Também verificar na tabela lancamentos_produtividade
SELECT DISTINCT turno, 
       LENGTH(turno) as tamanho,
       ASCII(SUBSTRING(turno, 1, 1)) as primeiro_char_ascii,
       ASCII(SUBSTRING(turno, -1, 1)) as ultimo_char_ascii
FROM lancamentos_produtividade 
WHERE turno IS NOT NULL
ORDER BY turno;

-- Corrigir variações de 'manhã' na tabela usuarios
UPDATE usuarios 
SET turno = 'Manhã'
WHERE LOWER(TRIM(turno)) IN ('manha', 'manhã', 'manhã', 'manhã ', ' manhã', 'manha ', ' manha')
   OR turno LIKE '%anh%'
   OR turno LIKE '%man%';

-- Corrigir variações de 'tarde' na tabela usuarios
UPDATE usuarios 
SET turno = 'Tarde'
WHERE LOWER(TRIM(turno)) IN ('tarde', 'tarde ', ' tarde')
   OR turno LIKE '%ard%';

-- Corrigir variações de 'noite' na tabela usuarios
UPDATE usuarios 
SET turno = 'Noite'
WHERE LOWER(TRIM(turno)) IN ('noite', 'noite ', ' noite')
   OR turno LIKE '%oit%';

-- Corrigir variações de 'geral' na tabela usuarios
UPDATE usuarios 
SET turno = 'Geral'
WHERE LOWER(TRIM(turno)) IN ('geral', 'geral ', ' geral')
   OR turno LIKE '%era%';

-- Corrigir variações de 'manhã' na tabela lancamentos_produtividade
UPDATE lancamentos_produtividade 
SET turno = 'Manhã'
WHERE LOWER(TRIM(turno)) IN ('manha', 'manhã', 'manhã', 'manhã ', ' manhã', 'manha ', ' manha')
   OR turno LIKE '%anh%'
   OR turno LIKE '%man%';

-- Corrigir variações de 'tarde' na tabela lancamentos_produtividade
UPDATE lancamentos_produtividade 
SET turno = 'Tarde'
WHERE LOWER(TRIM(turno)) IN ('tarde', 'tarde ', ' tarde')
   OR turno LIKE '%ard%';

-- Corrigir variações de 'noite' na tabela lancamentos_produtividade
UPDATE lancamentos_produtividade 
SET turno = 'Noite'
WHERE LOWER(TRIM(turno)) IN ('noite', 'noite ', ' noite')
   OR turno LIKE '%oit%';

-- Corrigir variações de 'geral' na tabela lancamentos_produtividade
UPDATE lancamentos_produtividade 
SET turno = 'Geral'
WHERE LOWER(TRIM(turno)) IN ('geral', 'geral ', ' geral')
   OR turno LIKE '%era%';

-- Verificar os resultados após a correção
SELECT 'usuarios' as tabela, turno, COUNT(*) as quantidade
FROM usuarios 
WHERE turno IS NOT NULL
GROUP BY turno
UNION ALL
SELECT 'lancamentos_produtividade' as tabela, turno, COUNT(*) as quantidade
FROM lancamentos_produtividade 
WHERE turno IS NOT NULL
GROUP BY turno
ORDER BY tabela, turno;

-- Verificar se ainda existem valores não padronizados
SELECT 'usuarios' as tabela, turno
FROM usuarios 
WHERE turno IS NOT NULL 
  AND turno NOT IN ('Manhã', 'Tarde', 'Noite', 'Geral')
UNION ALL
SELECT 'lancamentos_produtividade' as tabela, turno
FROM lancamentos_produtividade 
WHERE turno IS NOT NULL 
  AND turno NOT IN ('Manhã', 'Tarde', 'Noite', 'Geral');