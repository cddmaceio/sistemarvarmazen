# Sistema RV Armazém

Sistema de produtividade para colaboradores de armazém com cálculo de remuneração baseado em KPIs e atividades.

## 🚀 Tecnologias

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Hono.js, Cloudflare Workers
- **Banco de Dados**: SQLite (D1 Database)
- **Deploy**: Vercel, Netlify, Cloudflare Workers

## 📦 Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd sistema_rv_armazem_novo

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .dev.vars.example .dev.vars
# Edite o arquivo .dev.vars com suas configurações

# Execute em desenvolvimento
npm run dev
```

## 🏗️ Build e Deploy

### Desenvolvimento Local

```bash
# Frontend (porta 5174)
npm run dev

# Backend (porta 8787)
npx wrangler dev
```

### Deploy na Vercel

1. **Configuração inicial:**
```bash
# Instale a CLI da Vercel
npm install -g vercel

# Faça login
vercel login
```

2. **Deploy:**
```bash
# Build para produção
npm run build:vercel

# Deploy
npm run deploy:vercel
```

3. **Configurações necessárias na Vercel:**
   - Adicione as variáveis de ambiente no dashboard da Vercel
   - Configure o banco de dados (recomendado: Supabase ou PlanetScale)

### Deploy na Netlify

1. **Configuração inicial:**
```bash
# Instale a CLI da Netlify
npm install -g netlify-cli

# Faça login
netlify login
```

2. **Deploy:**
```bash
# Build para produção
npm run build:netlify

# Deploy
npm run deploy:netlify
```

3. **Configurações necessárias na Netlify:**
   - ⚠️ **IMPORTANTE**: Consulte o arquivo [NETLIFY_SETUP.md](./NETLIFY_SETUP.md) para configuração completa das variáveis de ambiente
   - Adicione as variáveis de ambiente no dashboard da Netlify
   - Configure o banco de dados

### Deploy no Cloudflare Workers (Recomendado)

```bash
# Configure o Wrangler
npx wrangler login

# Deploy
npx wrangler deploy
```

## 🗄️ Banco de Dados

### Banco de Dados

O sistema utiliza **Supabase (PostgreSQL)** como banco de dados principal.

```bash
# Para aplicar o schema inicial, execute o arquivo:
# supabase-migration-completa.sql no dashboard do Supabase
```

### Estrutura Principal

- `usuarios` - Dados dos colaboradores
- `activities` - Atividades disponíveis
- `kpis` - KPIs por função e turno
- `lancamentos_produtividade` - Lançamentos de produtividade
- `historico_lancamentos_aprovados` - Histórico de aprovações

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente (.dev.vars)

```env
# Banco de dados
DATABASE_URL=your_database_url

# Autenticação (se aplicável)
JWT_SECRET=your_jwt_secret

# Outras configurações
NODE_ENV=development
```

## 📋 Funcionalidades

### Para Colaboradores
- ✅ Cálculo de produtividade por atividade
- ✅ Lançamento de KPIs atingidos
- ✅ Visualização de histórico pessoal
- ✅ Dashboard com métricas

### Para Administradores
- ✅ Validação de lançamentos
- ✅ Edição de dados
- ✅ Relatórios e exportação
- ✅ Gestão de usuários e atividades

### Melhorias Recentes
- ✅ Limite de 1 KPI por dia
- ✅ Validação rigorosa de KPIs
- ✅ Exibição correta de "KPIs Atingidos" no histórico
- ✅ Correção de bugs de carregamento

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build para produção
npm run preview          # Preview do build

# Deploy
npm run build:vercel     # Build otimizado para Vercel
npm run build:netlify    # Build otimizado para Netlify
npm run deploy:vercel    # Deploy na Vercel
npm run deploy:netlify   # Deploy na Netlify

# Utilitários
npm run lint             # Linting do código
npm run check            # Verificação completa
```

## 🔍 Troubleshooting

### Problemas Comuns

1. **Erro de proxy**: Reinicie o servidor de desenvolvimento
2. **Banco não conecta**: Verifique as variáveis de ambiente
3. **Build falha**: Verifique as dependências e TypeScript

### Logs

```bash
# Logs do Cloudflare Workers
npx wrangler tail

# Logs da Vercel
vercel logs

# Logs da Netlify
netlify logs
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs de erro
2. Consulte a documentação das plataformas
3. Abra uma issue no repositório

---

*Este projeto foi criado usando [Mocha](https://getmocha.com).*
