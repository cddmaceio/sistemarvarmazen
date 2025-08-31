# Análise de Configurações de API Keys e Comunicação Frontend-Backend

## Problemas Identificados

### 1. Inconsistência nas Variáveis de Ambiente

#### Frontend (src/lib/supabase.ts)
- Usa: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- Prefixo VITE_ é necessário para Vite expor as variáveis no frontend

#### Backend (netlify/functions)
- Usa: `SUPABASE_URL` e `SUPABASE_ANON_KEY` (sem prefixo VITE_)
- Correto para ambiente Node.js/Netlify Functions

#### Arquivo .env.local
- Contém AMBAS as versões:
  - `SUPABASE_URL` e `SUPABASE_ANON_KEY` (para backend)
  - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (incorreto - deveria ser VITE_)

### 2. Duplicação de Ambientes

#### Estrutura de Pastas
- `netlify/functions-src/` - Código TypeScript para desenvolvimento
- `netlify/functions-build/` - Código JavaScript compilado para produção
- Ambos contêm a mesma lógica, mas em formatos diferentes

#### Processo de Build
- `functions-src/api.ts` é compilado para `functions-build/api.js`
- Script `build:functions` no package.json faz essa compilação
- Possível confusão: editar diretamente em `functions-build` é perdido no próximo build

### 3. Configurações de Variáveis de Ambiente

#### Arquivo .env.local (atual)
```
SUPABASE_URL=https://qcqkfipckcnydsjjdral.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://qcqkfipckcnydsjjdral.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Deveria ser:
```
# Para backend (Netlify Functions)
SUPABASE_URL=https://qcqkfipckcnydsjjdral.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Para frontend (Vite)
VITE_SUPABASE_URL=https://qcqkfipckcnydsjjdral.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Fluxo de Comunicação

#### Frontend → Backend
1. Frontend (React) usa hooks em `src/hooks/`
2. Hooks fazem chamadas para `/api/*`
3. Netlify redireciona `/api/*` para `/.netlify/functions/api/*`
4. Functions em `netlify/functions-build/api.js` processam as requisições
5. Backend usa `getSupabase(c.env)` para acessar Supabase

#### Pontos de Falha
- Se variáveis de ambiente não estão configuradas corretamente no Netlify
- Se o build não foi executado após mudanças em `functions-src`
- Se há inconsistência entre desenvolvimento local e produção

## Soluções Recomendadas

### 1. Padronizar Variáveis de Ambiente

#### Atualizar .env.local
```bash
# Backend (Netlify Functions)
SUPABASE_URL=https://qcqkfipckcnydsjjdral.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWtmaXBja2NueWRzampkcmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mjc3MzcsImV4cCI6MjA3MTIwMzczN30.5Bq-1-TyOugW1-NrkDj_37lCYDvKJNiaRC6vFoWqXZk

# Frontend (Vite)
VITE_SUPABASE_URL=https://qcqkfipckcnydsjjdral.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWtmaXBja2NueWRzampkcmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mjc3MzcsImV4cCI6MjA3MTIwMzczN30.5Bq-1-TyOugW1-NrkDj_37lCYDvKJNiaRC6vFoWqXZk
```

### 2. Fluxo de Desenvolvimento Padronizado

#### Regra Principal
**NUNCA editar diretamente em `netlify/functions-build/`**

#### Fluxo Correto
1. Editar apenas em `netlify/functions-src/`
2. Executar `npm run build:functions` para compilar
3. Testar localmente com `npm run dev`
4. Deploy para produção

### 3. Scripts de Verificação

Criar scripts para:
- Verificar se variáveis de ambiente estão configuradas
- Validar comunicação frontend-backend
- Testar endpoints da API
- Verificar se build está atualizado

### 4. Configuração do Netlify

Garantir que as variáveis de ambiente estão configuradas no painel do Netlify:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Próximos Passos

1. ✅ Corrigir .env.local com variáveis corretas
2. ⏳ Verificar configuração do Netlify
3. ⏳ Criar scripts de teste
4. ⏳ Analisar problemas na calculadora de KPIs
5. ⏳ Documentar fluxo de desenvolvimento

## Status da Análise

- ✅ Estrutura de pastas mapeada
- ✅ Variáveis de ambiente identificadas
- ✅ Fluxo de comunicação documentado
- ⏳ Problemas na calculadora (próxima etapa)