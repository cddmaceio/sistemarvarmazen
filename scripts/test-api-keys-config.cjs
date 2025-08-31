#!/usr/bin/env node

/**
 * Script para testar configurações de API keys e comunicação frontend-backend
 * Verifica se as variáveis de ambiente estão configuradas corretamente
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Carrega variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

console.log('🔍 Testando Configurações de API Keys\n');

// Teste 1: Verificar variáveis de ambiente
console.log('📋 1. Verificando Variáveis de Ambiente:');
console.log('----------------------------------------');

const backendUrl = process.env.SUPABASE_URL;
const backendKey = process.env.SUPABASE_ANON_KEY;
const frontendUrl = process.env.VITE_SUPABASE_URL;
const frontendKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log(`Backend SUPABASE_URL: ${backendUrl ? '✅ Configurado' : '❌ Não encontrado'}`);
console.log(`Backend SUPABASE_ANON_KEY: ${backendKey ? '✅ Configurado' : '❌ Não encontrado'}`);
console.log(`Frontend VITE_SUPABASE_URL: ${frontendUrl ? '✅ Configurado' : '❌ Não encontrado'}`);
console.log(`Frontend VITE_SUPABASE_ANON_KEY: ${frontendKey ? '✅ Configurado' : '❌ Não encontrado'}`);

if (backendUrl) {
  console.log(`URL: ${backendUrl.substring(0, 30)}...`);
}

// Teste 2: Verificar consistência entre frontend e backend
console.log('\n🔄 2. Verificando Consistência:');
console.log('--------------------------------');

if (backendUrl && frontendUrl) {
  if (backendUrl === frontendUrl) {
    console.log('✅ URLs são consistentes');
  } else {
    console.log('❌ URLs são diferentes!');
    console.log(`  Backend: ${backendUrl}`);
    console.log(`  Frontend: ${frontendUrl}`);
  }
}

if (backendKey && frontendKey) {
  if (backendKey === frontendKey) {
    console.log('✅ Chaves são consistentes');
  } else {
    console.log('❌ Chaves são diferentes!');
  }
}

// Teste 3: Testar conexão com Supabase
console.log('\n🌐 3. Testando Conexão com Supabase:');
console.log('------------------------------------');

if (backendUrl && backendKey) {
  try {
    const supabase = createClient(backendUrl, backendKey);
    
    // Teste simples de conexão
    supabase.from('usuarios').select('count', { count: 'exact', head: true })
      .then(({ data, error, count }) => {
        if (error) {
          console.log('❌ Erro na conexão:', error.message);
        } else {
          console.log('✅ Conexão com Supabase bem-sucedida');
          console.log(`📊 Total de usuários na tabela: ${count || 'N/A'}`);
        }
      })
      .catch(err => {
        console.log('❌ Erro na conexão:', err.message);
      });
      
    // Teste de KPIs
    setTimeout(() => {
      supabase.from('kpis').select('count', { count: 'exact', head: true })
        .then(({ data, error, count }) => {
          if (error) {
            console.log('❌ Erro ao acessar KPIs:', error.message);
          } else {
            console.log('✅ Acesso à tabela KPIs bem-sucedido');
            console.log(`📊 Total de KPIs na tabela: ${count || 'N/A'}`);
          }
        })
        .catch(err => {
          console.log('❌ Erro ao acessar KPIs:', err.message);
        });
    }, 1000);
    
    // Teste de atividades
    setTimeout(() => {
      supabase.from('atividades').select('count', { count: 'exact', head: true })
        .then(({ data, error, count }) => {
          if (error) {
            console.log('❌ Erro ao acessar atividades:', error.message);
          } else {
            console.log('✅ Acesso à tabela atividades bem-sucedido');
            console.log(`📊 Total de atividades na tabela: ${count || 'N/A'}`);
          }
        })
        .catch(err => {
          console.log('❌ Erro ao acessar atividades:', err.message);
        });
    }, 2000);
    
  } catch (error) {
    console.log('❌ Erro ao criar cliente Supabase:', error.message);
  }
} else {
  console.log('❌ Não é possível testar - variáveis de ambiente não configuradas');
}

// Teste 4: Verificar arquivos de build
console.log('\n🔨 4. Verificando Arquivos de Build:');
console.log('------------------------------------');

const fs = require('fs');

const functionsSrc = path.join(__dirname, 'netlify', 'functions-src', 'api.ts');
const functionsBuild = path.join(__dirname, 'netlify', 'functions-build', 'api.js');

if (fs.existsSync(functionsSrc)) {
  console.log('✅ Arquivo fonte encontrado: netlify/functions-src/api.ts');
} else {
  console.log('❌ Arquivo fonte não encontrado: netlify/functions-src/api.ts');
}

if (fs.existsSync(functionsBuild)) {
  console.log('✅ Arquivo build encontrado: netlify/functions-build/api.js');
  
  // Verificar se o build está atualizado
  const srcStats = fs.existsSync(functionsSrc) ? fs.statSync(functionsSrc) : null;
  const buildStats = fs.statSync(functionsBuild);
  
  if (srcStats && srcStats.mtime > buildStats.mtime) {
    console.log('⚠️  ATENÇÃO: Arquivo fonte é mais recente que o build!');
    console.log('   Execute: npm run build:functions');
  } else {
    console.log('✅ Build parece estar atualizado');
  }
} else {
  console.log('❌ Arquivo build não encontrado: netlify/functions-build/api.js');
}

console.log('\n📝 Resumo:');
console.log('----------');
console.log('1. Verifique se todas as variáveis estão configuradas');
console.log('2. Certifique-se de que URLs e chaves são consistentes');
console.log('3. Execute npm run build:functions se necessário');
console.log('4. Configure as mesmas variáveis no painel do Netlify para produção');
console.log('\n✨ Teste concluído!\n');