# 📋 Guia de Desenvolvimento - Sistema RV Armazém

## 🎯 Padronização de Arquivos

### Worker (Backend)
- **Fonte da Verdade**: Arquivos `.ts` em `src/worker/routes/`
- **Arquivos Compilados**: `src/worker/supabase-worker.js` (gerado automaticamente)
- **⚠️ IMPORTANTE**: Nunca edite arquivos `.js` diretamente!

### Fluxo de Desenvolvimento

1. **Editar código**: Modifique apenas arquivos `.ts`
2. **Compilar worker**: `npm run build:worker`
3. **Testar localmente**: `npm run dev`
4. **Build completo**: `npm run build` (antes de deploy)

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor local
npm run build:worker     # Compila apenas o worker
npm run build           # Build completo

# Limpeza
node cleanup-duplicates.cjs  # Remove arquivos .js duplicados
```

### Estrutura de Arquivos

```
src/worker/
├── routes/
│   ├── calculator.ts    ✅ Editar este
│   ├── activities.ts    ✅ Editar este
│   ├── auth.ts         ✅ Editar este
│   └── ...
├── supabase-worker.ts   ✅ Arquivo principal
└── supabase-worker.js   🤖 Gerado automaticamente
```

### ⚠️ Regras Importantes

1. **Nunca edite arquivos `.js`** - eles são sobrescritos na compilação
2. **Sempre compile após mudanças** - use `npm run build:worker`
3. **Reinicie o servidor** após compilar para aplicar mudanças
4. **Teste sempre** - use scripts de teste para validar mudanças

### 🧪 Testes

- `test-logica-corrigida.cjs` - Testa lógica de cálculo
- Sempre execute testes após mudanças importantes

### 🔧 Troubleshooting

**Problema**: Mudanças não aparecem no servidor
**Solução**: 
1. `npm run build:worker`
2. Reiniciar `npm run dev`

**Problema**: Arquivos .js e .ts conflitantes
**Solução**: `node cleanup-duplicates.cjs`