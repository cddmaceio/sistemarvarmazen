
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cpf TEXT NOT NULL UNIQUE,
  data_nascimento DATE NOT NULL,
  nome TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO usuarios (cpf, data_nascimento, nome, role, is_active)
VALUES ('087.495.304-96', '1990-11-01', 'Usuário de Teste', 'admin', true);
