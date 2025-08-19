
CREATE TABLE log_exportacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL,
  admin_nome TEXT NOT NULL,
  filtros_aplicados TEXT, -- JSON
  formato_exportacao TEXT NOT NULL, -- csv, xlsx, pdf
  total_registros INTEGER NOT NULL,
  nome_arquivo TEXT,
  data_exportacao DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_origem TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
