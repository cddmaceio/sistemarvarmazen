# 🚀 Configuração do Netlify - Variáveis de Ambiente

## 📋 Problema
O erro "Missing Supabase environment variables" ocorre quando as variáveis de ambiente do Supabase não estão configuradas no dashboard do Netlify.

## ✅ Solução

### 1. Acesse o Dashboard do Netlify
1. Faça login em [netlify.com](https://netlify.com)
2. Acesse seu site/projeto
3. Vá para **Site settings** → **Environment variables**

### 2. Adicione as Variáveis de Ambiente
Adicione as seguintes variáveis com seus respectivos valores:

```bash
# Variáveis principais do Supabase
SUPABASE_URL=https://qcqkfipckcnydsjjdral.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWtmaXBja2NueWRzampkcmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mjc3MzcsImV4cCI6MjA3MTIwMzczN30.5Bq-1-TyOugW1-NrkDj_37lCYDvKJNiaRC6vFoWqXZk

# Variáveis para o frontend (Vite)
VITE_SUPABASE_URL=https://qcqkfipckcnydsjjdral.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWtmaXBja2NueWRzampkcmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mjc3MzcsImV4cCI6MjA3MTIwMzczN30.5Bq-1-TyOugW1-NrkDj_37lCYDvKJNiaRC6vFoWqXZk

# Variáveis para Next.js (se necessário)
NEXT_PUBLIC_SUPABASE_URL=https://qcqkfipckcnydsjjdral.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWtmaXBja2NueWRzampkcmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mjc3MzcsImV4cCI6MjA3MTIwMzczN30.5Bq-1-TyOugW1-NrkDj_37lCYDvKJNiaRC6vFoWqXZk
```

### 3. Configuração Passo a Passo

#### No Dashboard do Netlify:
1. **Site settings** → **Environment variables**
2. Clique em **Add a variable**
3. Para cada variável:
   - **Key**: Nome da variável (ex: `SUPABASE_URL`)
   - **Value**: Valor correspondente
   - **Scopes**: Selecione `All scopes` ou `Builds` e `Functions`
4. Clique em **Create variable**

### 4. Redeploy do Site
Após adicionar todas as variáveis:
1. Vá para **Deploys**
2. Clique em **Trigger deploy** → **Deploy site**
3. Aguarde o build completar

## 🔧 Verificação

### Logs de Build
Verifique nos logs de build se as variáveis estão sendo carregadas:
```bash
✓ Environment variables loaded
✓ SUPABASE_URL: https://qcqkfipckcnydsjjdral.supabase.co
✓ SUPABASE_ANON_KEY: [HIDDEN]
```

### Teste das Functions
Após o deploy, teste os endpoints:
```bash
# Teste básico
curl https://seu-site.netlify.app/.netlify/functions/worker/api/health

# Teste com autenticação
curl https://seu-site.netlify.app/.netlify/functions/worker/api/lancamentos
```

## 🚨 Troubleshooting

### Erro Persiste?
1. **Verifique os nomes das variáveis** - devem ser exatamente iguais
2. **Confirme os valores** - copie diretamente do `.env.local`
3. **Scope correto** - deve incluir `Functions`
4. **Redeploy** - sempre necessário após mudanças

### Logs de Debug
Para debug, adicione temporariamente no código:
```javascript
console.log('ENV Check:', {
  hasUrl: !!process.env.SUPABASE_URL,
  hasKey: !!process.env.SUPABASE_ANON_KEY,
  url: process.env.SUPABASE_URL?.substring(0, 30) + '...'
});
```

## 📝 Comandos Úteis

```bash
# Build local para testar
npm run build:netlify

# Deploy manual
npm run deploy:netlify

# Verificar logs
netlify logs
```

## ✅ Checklist Final
- [ ] Todas as 6 variáveis adicionadas no Netlify
- [ ] Scopes incluem "Functions"
- [ ] Site foi redeployado
- [ ] Logs de build mostram sucesso
- [ ] Endpoints respondem corretamente
- [ ] Erro "Missing Supabase environment variables" resolvido

---

**💡 Dica**: Mantenha as chaves do Supabase seguras e nunca as exponha em logs ou código público.