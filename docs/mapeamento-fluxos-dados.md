# Mapeamento de Fluxos de Dados - Sistema RV Armazém

## Visão Geral da Arquitetura

### Frontend (React + TypeScript)
- **Localização**: `src/`
- **Hooks de API**: `src/hooks/useApi.ts`
- **Autenticação**: `src/hooks/useAuth.tsx`
- **Componentes**: `src/components/`
- **Páginas**: `src/pages/`

### Backend (Cloudflare Workers + Hono)
- **Localização**: `src/worker/`
- **Rotas**: `src/worker/routes/`
- **Utilitários**: `src/worker/utils.ts`
- **Ponto de entrada**: `src/worker/index.ts`

### Banco de Dados
- **Supabase PostgreSQL**
- **Tabelas principais**: `usuarios`, `kpis`, `activities`, `lancamentos_produtividade`

---

## Mapeamento de Endpoints e Hooks

### 1. Autenticação (`/api/auth`)

#### Backend: `src/worker/routes/auth.ts`
- **POST** `/api/auth/login`
  - **Input**: `{ cpf: string, data_nascimento: string }`
  - **Output**: Dados do usuário ou erro 401
  - **Validação**: `LoginSchema`

- **POST** `/api/auth/logout`
  - **Output**: `{ success: true, message: string }`

#### Frontend: `src/hooks/useAuth.tsx`
- **Hook**: `useAuth()`
- **Funções**: `login()`, `logout()`, `updateUser()`
- **Estado**: `user`, `loading`, `isAdmin`, `isCollaborator`, `userFunction`, `userTurno`

---

### 2. Atividades (`/api/activities`)

#### Backend: `src/worker/routes/activities.ts`
- **GET** `/api/activities`
  - **Output**: Array de atividades ordenadas por nome

- **GET** `/api/activity-names`
  - **Output**: `{ results: Array<{ nome_atividade: string }> }`
  - **Características**: Remove duplicatas, força UTF-8

- **POST** `/api/activities`
  - **Input**: Dados da atividade (validado por `ActivitySchema`)
  - **Output**: Atividade criada

- **PUT** `/api/activities/:id`
  - **Input**: Dados parciais da atividade
  - **Output**: Atividade atualizada

- **DELETE** `/api/activities/:id`
  - **Output**: Confirmação de exclusão

#### Frontend: `src/hooks/useApi.ts`
- **Hook**: `useActivities()`
  - **Estado**: `activities`, `loading`, `error`
  - **Funções**: `createActivity()`, `updateActivity()`, `deleteActivity()`, `refetch()`

- **Hook**: `useActivityNames()`
  - **Estado**: `activityNames`, `loading`, `error`
  - **Endpoint**: `/api/activity-names`

---

### 3. KPIs (`/api/kpis`)

#### Backend: `src/worker/routes/kpis.ts`
- **GET** `/api/kpis`
  - **Output**: Array de KPIs ordenados por nome

- **GET** `/api/functions`
  - **Output**: Array de funções únicas dos KPIs

- **GET** `/api/kpis/available`
  - **Query Params**: `funcao`, `turno`
  - **Output**: Array de KPIs disponíveis para função e turno
  - **Lógica**: Busca KPIs específicos do turno + KPIs gerais

- **POST** `/api/kpis`
  - **Input**: Dados do KPI (validado por `KPISchema`)
  - **Output**: KPI criado

- **PUT** `/api/kpis/:id`
  - **Input**: Dados parciais do KPI
  - **Output**: KPI atualizado

- **DELETE** `/api/kpis/:id`
  - **Output**: Confirmação de exclusão

#### Frontend: `src/hooks/useApi.ts`
- **Hook**: `useKPIs()`
  - **Estado**: `kpis`, `loading`, `error`
  - **Funções**: `createKPI()`, `updateKPI()`, `deleteKPI()`, `refetch()`

- **Hook**: `useFunctions()`
  - **Estado**: `functions`, `loading`, `error`
  - **Endpoint**: `/api/functions`

- **Hook**: `useAvailableKPIs()`
  - **Estado**: `kpis`, `loading`, `error`
  - **Função**: `fetchKPIs(funcao, turno)`
  - **Endpoint**: `/api/kpis/available`
  - **Logs**: Inclui debug detalhado

---

### 4. Calculadora (`/api/calculate`)

#### Backend: `src/worker/routes/calculator.ts`
- **POST** `/api/calculate`
  - **Input**: Dados do cálculo (validado por `CalculatorInputSchema`)
  - **Output**: Resultado do cálculo com detalhes
  - **Lógica Complexa**:
    - Normalização de strings (remove acentos)
    - Mapeamento de função/turno para valores do DB
    - Cálculo de produtividade e bônus
    - Processamento de múltiplas atividades
    - Validação de tarefas WMS

#### Frontend: `src/hooks/useApi.ts`
- **Hook**: `useCalculator()`
  - **Estado**: `result`, `loading`, `error`
  - **Função**: `calculate(input)`
  - **Endpoint**: `/api/calculate`

---

### 5. Usuários (`/api/usuarios`)

#### Backend: `src/worker/routes/users.ts`
- **GET** `/api/usuarios`
  - **Output**: Array de usuários ordenados por data de criação

- **POST** `/api/usuarios`
  - **Input**: Dados do usuário (validado por `UserSchema`)
  - **Output**: Usuário criado

- **PUT** `/api/usuarios/:id`
  - **Input**: Dados parciais do usuário
  - **Output**: Usuário atualizado

- **DELETE** `/api/usuarios/:id`
  - **Output**: Confirmação de exclusão

#### Frontend
- **Não há hook específico implementado**
- **Uso direto**: Componentes fazem chamadas diretas quando necessário

---

### 6. Lançamentos (`/api/lancamentos`)

#### Backend: `src/worker/routes/lancamentos.ts`
- **GET** `/api/lancamentos`
  - **Output**: Array de lançamentos ordenados por data de criação

- **POST** `/api/lancamentos`
  - **Input**: Dados do lançamento (validado por `CreateLancamentoSchema`)
  - **Output**: Lançamento criado
  - **Lógica**:
    - Busca dados do usuário
    - Salva dados do calculador e resultado
    - Logs detalhados para debug

- **PUT** `/api/lancamentos/:id`
  - **Input**: Dados parciais do lançamento
  - **Output**: Lançamento atualizado

- **DELETE** `/api/lancamentos/:id`
  - **Output**: Confirmação de exclusão

- **GET** `/api/export-preview`
  - **Output**: Preview dos dados para exportação

#### Frontend
- **Não há hook específico implementado**
- **Uso**: Integrado no fluxo da calculadora

---

## Fluxos de Dados Principais

### 1. Fluxo de Autenticação
```
Usuário → Login Form → useAuth.login() → POST /api/auth/login → Supabase → Retorna dados do usuário → Atualiza estado global
```

### 2. Fluxo da Calculadora de KPIs
```
1. Usuário autenticado → useAuth fornece função/turno
2. useAvailableKPIs.fetchKPIs() → GET /api/kpis/available → Retorna KPIs disponíveis
3. Usuário preenche formulário → useCalculator.calculate() → POST /api/calculate → Retorna resultado
4. Resultado salvo → POST /api/lancamentos → Persiste no banco
```

### 3. Fluxo de Gerenciamento de Dados
```
Admin → Páginas de gerenciamento → useActivities/useKPIs → CRUD operations → Supabase → Atualiza estado local
```

---

## Configurações e Variáveis de Ambiente

### Frontend (Vite)
- `VITE_SUPABASE_URL`: URL do Supabase
- `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase

### Backend (Cloudflare Workers)
- `SUPABASE_URL`: URL do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase

### Arquivo de Configuração
- **Local**: `.env.local` (contém ambas as configurações)
- **Produção**: Netlify Environment Variables

---

## Problemas Identificados e Soluções

### ✅ Resolvidos
1. **Inconsistência de API Keys**: Padronizado no `.env.local`
2. **Calculadora de KPIs**: Corrigido hook `useAvailableKPIs`
3. **Encoding de caracteres**: Implementado normalização

### 🔄 Em Análise
1. **Hooks faltantes**: Usuários e Lançamentos não têm hooks dedicados
2. **Duplicação de código**: Alguns padrões se repetem entre hooks
3. **Error handling**: Padronização do tratamento de erros

---

## Recomendações

### 1. Padronização de Hooks
- Criar hooks para `useUsers()` e `useLancamentos()`
- Implementar padrão consistente de error handling
- Adicionar retry logic para falhas de rede

### 2. Otimização de Performance
- Implementar cache para dados estáticos (funções, atividades)
- Adicionar debounce em buscas
- Lazy loading para dados grandes

### 3. Monitoramento
- Adicionar logs estruturados
- Implementar métricas de performance
- Alertas para falhas de API

### 4. Segurança
- Validação adicional no frontend
- Rate limiting nas APIs
- Sanitização de inputs