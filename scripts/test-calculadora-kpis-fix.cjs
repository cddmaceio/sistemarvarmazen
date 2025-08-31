const fs = require('fs');
const path = require('path');

console.log('🔧 DIAGNÓSTICO: Problema da Calculadora - KPIs não carregando');
console.log('================================================================\n');

// 1. Verificar estrutura dos dados retornados pela API
console.log('1. 📊 ANÁLISE DA API /api/kpis/available');
console.log('==========================================');

const kpisRoutePath = path.join(__dirname, 'src', 'worker', 'routes', 'kpis.ts');
if (fs.existsSync(kpisRoutePath)) {
  const kpisContent = fs.readFileSync(kpisRoutePath, 'utf8');
  
  // Verificar se retorna array direto ou objeto
  const returnsArray = kpisContent.includes('return c.json(kpis || [])');
  const returnsObject = kpisContent.includes('return c.json({ kpisAtingidos:');
  
  console.log(`   ✅ Arquivo de rotas KPIs encontrado`);
  console.log(`   📋 Retorna array direto: ${returnsArray ? '✅' : '❌'}`);
  console.log(`   📋 Retorna objeto wrapper: ${returnsObject ? '✅' : '❌'}`);
  
  if (returnsArray) {
    console.log('   ✅ API configurada corretamente para retornar array');
  } else {
    console.log('   ⚠️  API pode estar retornando estrutura incorreta');
  }
} else {
  console.log('   ❌ Arquivo de rotas KPIs não encontrado');
}

// 2. Verificar processamento no Home.tsx
console.log('\n2. 🏠 ANÁLISE DO Home.tsx');
console.log('==========================');

const homePath = path.join(__dirname, 'src', 'pages', 'Home.tsx');
if (fs.existsSync(homePath)) {
  const homeContent = fs.readFileSync(homePath, 'utf8');
  
  // Verificar como os dados são processados
  const hasKpisAtingidos = homeContent.includes('data.kpisAtingidos');
  const hasDirectData = homeContent.includes('data || []');
  const hasCorrectKey = homeContent.includes('key={`${kpi.nome_kpi}-${kpi.turno_kpi}`}');
  const hasIncorrectKey = homeContent.includes('key={`undefined-undefined`}') || 
                         homeContent.includes('key={kpi.nome_kpi}') ||
                         !homeContent.includes('key={`${kpi.nome_kpi}-${kpi.turno_kpi}`}');
  
  console.log(`   ✅ Arquivo Home.tsx encontrado`);
  console.log(`   📋 Processa data.kpisAtingidos: ${hasKpisAtingidos ? '✅' : '❌'}`);
  console.log(`   📋 Processa data direto: ${hasDirectData ? '✅' : '❌'}`);
  console.log(`   📋 Key correta no map: ${hasCorrectKey ? '✅' : '❌'}`);
  
  // Verificar problema das keys duplicadas
  const mapMatches = homeContent.match(/availableKPIs\.map\(\(kpi\) => \([\s\S]*?key={[^}]+}/g);
  if (mapMatches) {
    console.log('\n   🔍 ANÁLISE DAS KEYS NO MAP:');
    mapMatches.forEach((match, index) => {
      console.log(`   Map ${index + 1}: ${match.split('key={')[1] || 'key não encontrada'}`);
    });
  }
  
  // Verificar se há problema na função fetchAvailableKPIs
  const fetchFunction = homeContent.match(/const fetchAvailableKPIs = async[\s\S]*?};/g);
  if (fetchFunction) {
    const func = fetchFunction[0];
    const hasCorrectProcessing = func.includes('data.kpisAtingidos || data || []');
    const hasConsoleLog = func.includes('console.log');
    
    console.log('\n   🔍 ANÁLISE DA FUNÇÃO fetchAvailableKPIs:');
    console.log(`   📋 Processamento correto: ${hasCorrectProcessing ? '✅' : '❌'}`);
    console.log(`   📋 Tem logs de debug: ${hasConsoleLog ? '✅' : '❌'}`);
  }
} else {
  console.log('   ❌ Arquivo Home.tsx não encontrado');
}

// 3. Verificar hook useAvailableKPIs
console.log('\n3. 🪝 ANÁLISE DO HOOK useAvailableKPIs');
console.log('=====================================');

const useApiPath = path.join(__dirname, 'src', 'hooks', 'useApi.ts');
if (fs.existsSync(useApiPath)) {
  const useApiContent = fs.readFileSync(useApiPath, 'utf8');
  
  const hasUseAvailableKPIs = useApiContent.includes('export const useAvailableKPIs');
  const hasCorrectEndpoint = useApiContent.includes('/kpis/available');
  const hasArrayProcessing = useApiContent.includes('Array.isArray(data) ? data : []');
  
  console.log(`   ✅ Hook useAvailableKPIs existe: ${hasUseAvailableKPIs ? '✅' : '❌'}`);
  console.log(`   📋 Endpoint correto: ${hasCorrectEndpoint ? '✅' : '❌'}`);
  console.log(`   📋 Processamento de array: ${hasArrayProcessing ? '✅' : '❌'}`);
  
  if (hasUseAvailableKPIs) {
    // Extrair a função para análise
    const hookMatch = useApiContent.match(/export const useAvailableKPIs[\s\S]*?return \{[\s\S]*?\};\s*\}/g);
    if (hookMatch) {
      const hookContent = hookMatch[0];
      const hasErrorHandling = hookContent.includes('catch');
      const hasLoadingState = hookContent.includes('setLoading');
      
      console.log(`   📋 Tratamento de erro: ${hasErrorHandling ? '✅' : '❌'}`);
      console.log(`   📋 Estado de loading: ${hasLoadingState ? '✅' : '❌'}`);
    }
  }
} else {
  console.log('   ❌ Arquivo useApi.ts não encontrado');
}

// 4. Verificar tipos TypeScript
console.log('\n4. 📝 ANÁLISE DOS TIPOS');
console.log('=======================');

const typesPath = path.join(__dirname, 'src', 'shared', 'types.ts');
if (fs.existsSync(typesPath)) {
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  
  const hasKPIType = typesContent.includes('export interface KPIType') || typesContent.includes('export type KPIType');
  const hasNomeKpi = typesContent.includes('nome_kpi');
  const hasTurnoKpi = typesContent.includes('turno_kpi');
  
  console.log(`   ✅ Tipo KPIType definido: ${hasKPIType ? '✅' : '❌'}`);
  console.log(`   📋 Campo nome_kpi: ${hasNomeKpi ? '✅' : '❌'}`);
  console.log(`   📋 Campo turno_kpi: ${hasTurnoKpi ? '✅' : '❌'}`);
  
  if (hasKPIType) {
    // Extrair definição do tipo
    const kpiTypeMatch = typesContent.match(/(export interface KPIType|export type KPIType)[\s\S]*?\}/g);
    if (kpiTypeMatch) {
      console.log('\n   🔍 DEFINIÇÃO DO TIPO KPIType:');
      const typeLines = kpiTypeMatch[0].split('\n').slice(0, 10); // Primeiras 10 linhas
      typeLines.forEach(line => {
        if (line.trim()) console.log(`   ${line.trim()}`);
      });
    }
  }
} else {
  console.log('   ❌ Arquivo types.ts não encontrado');
}

// 5. Identificar problemas específicos
console.log('\n5. 🚨 PROBLEMAS IDENTIFICADOS');
console.log('==============================');

const problems = [];
const solutions = [];

// Verificar se Home.tsx está usando fetchAvailableKPIs corretamente
if (fs.existsSync(homePath)) {
  const homeContent = fs.readFileSync(homePath, 'utf8');
  
  // Problema 1: Processamento incorreto dos dados
  if (homeContent.includes('data.kpisAtingidos || data || []')) {
    problems.push('❌ Home.tsx está processando dados incorretamente');
    solutions.push('✅ Corrigir para usar apenas data || [] ou Array.isArray(data) ? data : []');
  }
  
  // Problema 2: Keys duplicadas
  if (!homeContent.includes('key={`${kpi.nome_kpi}-${kpi.turno_kpi}`}')) {
    problems.push('❌ Keys duplicadas no map de KPIs');
    solutions.push('✅ Usar key={`${kpi.nome_kpi}-${kpi.turno_kpi}`} para keys únicas');
  }
  
  // Problema 3: Função fetchAvailableKPIs duplicada
  if (homeContent.includes('const fetchAvailableKPIs = async')) {
    problems.push('❌ Função fetchAvailableKPIs duplicada (existe no hook e no componente)');
    solutions.push('✅ Usar apenas o hook useAvailableKPIs');
  }
}

if (problems.length === 0) {
  console.log('   ✅ Nenhum problema óbvio identificado nos arquivos');
  console.log('   💡 O problema pode estar na execução ou dados do banco');
} else {
  problems.forEach(problem => console.log(`   ${problem}`));
}

console.log('\n6. 💡 SOLUÇÕES RECOMENDADAS');
console.log('============================');

if (solutions.length > 0) {
  solutions.forEach(solution => console.log(`   ${solution}`));
} else {
  console.log('   1. ✅ Verificar se o banco de dados tem KPIs para a função/turno testada');
  console.log('   2. ✅ Verificar se a API está retornando dados corretos');
  console.log('   3. ✅ Verificar se o frontend está processando os dados corretamente');
  console.log('   4. ✅ Verificar se as keys do React estão únicas');
}

console.log('\n7. 🧪 PRÓXIMOS PASSOS');
console.log('=====================');
console.log('   1. 🔧 Corrigir problemas identificados');
console.log('   2. 🧪 Testar API diretamente');
console.log('   3. 🧪 Testar componente isoladamente');
console.log('   4. 🧪 Verificar dados no banco');

console.log('\n✅ DIAGNÓSTICO COMPLETO!');
console.log('========================');
console.log('Execute as correções recomendadas e teste novamente.');