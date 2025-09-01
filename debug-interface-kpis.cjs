const { chromium } = require('playwright');

async function testKPIInterface() {
  console.log('🧪 Testando interface de KPIs na calculadora...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navegar para a página da calculadora
    console.log('📄 Navegando para a calculadora...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);
    
    // Verificar se a página carregou
    const title = await page.title();
    console.log('📋 Título da página:', title);
    
    // Capturar o HTML da página para debug
    const bodyText = await page.locator('body').textContent();
    console.log('📄 Conteúdo da página (primeiros 500 chars):', bodyText?.substring(0, 500));
    
    // Verificar se há elementos de login
    const loginButton = await page.locator('button:has-text("Entrar")');
    if (await loginButton.count() > 0) {
      console.log('🔐 Página de login detectada, tentando fazer login...');
      
      // Procurar campos de CPF e Data de Nascimento
       const cpfField = await page.locator('input[placeholder="000.000.000-00"]').first();
       const dateField = await page.locator('input[type="date"]').first();
       
       console.log(`🔍 CPF field found: ${await cpfField.count() > 0}`);
       console.log(`🔍 Date field found: ${await dateField.count() > 0}`);
      
      if (await cpfField.count() > 0 && await dateField.count() > 0) {
        console.log('📝 Preenchendo campos de login...');
        await cpfField.fill('12345678901'); // CPF de teste
        await dateField.fill('1990-01-01'); // Data de nascimento de teste
        await loginButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ Login realizado');
        
        // Verificar se o login foi bem-sucedido
        const newBodyText = await page.locator('body').textContent();
        console.log('📄 Conteúdo após login (primeiros 300 chars):', newBodyText?.substring(0, 300));
      } else {
        console.log('❌ Campos de login não encontrados');
        console.log('🔍 Elementos de input encontrados:');
        const inputs = await page.locator('input').all();
        for (let i = 0; i < Math.min(inputs.length, 5); i++) {
          const placeholder = await inputs[i].getAttribute('placeholder');
          const type = await inputs[i].getAttribute('type');
          const name = await inputs[i].getAttribute('name');
          console.log(`   Input ${i + 1}: type=${type}, name=${name}, placeholder=${placeholder}`);
        }
      }
    }
    
    // Verificar diferentes seletores para o campo de função
    console.log('🔍 Procurando campo de função...');
    
    // Tentar diferentes seletores
    const selectors = [
      'select[name="funcao"]',
      'select:has-text("Função")',
      'select:has-text("Operador")',
      'select',
      '[data-testid="funcao-select"]'
    ];
    
    let funcaoSelect = null;
    for (const selector of selectors) {
      const element = await page.locator(selector).first();
      if (await element.count() > 0) {
        console.log(`✅ Campo encontrado com seletor: ${selector}`);
        funcaoSelect = element;
        break;
      }
    }
    
    if (funcaoSelect) {
      console.log('✅ Campo de função encontrado');
      
      // Listar opções disponíveis
      const options = await funcaoSelect.locator('option').allTextContents();
      console.log('📋 Opções disponíveis:', options);
      
      // Selecionar uma função (usar a primeira opção que não seja vazia)
      const validOption = options.find(opt => opt.trim() && opt.trim() !== 'Selecione uma função');
      if (validOption) {
        await funcaoSelect.selectOption(validOption);
        console.log(`🔧 Função selecionada: ${validOption}`);
      } else {
        console.log('❌ Nenhuma opção válida encontrada');
        return;
      }
      
      // Aguardar um pouco para os KPIs carregarem
      await page.waitForTimeout(2000);
      
      // Verificar se a seção de KPIs apareceu
      const kpiSection = await page.locator('text=KPIs Disponíveis para sua Função/Turno').first();
      if (await kpiSection.count() > 0) {
        console.log('✅ Seção de KPIs encontrada');
        
        // Listar todos os KPIs disponíveis
        const kpiCards = await page.locator('[class*="cursor-pointer"][class*="border"]').all();
        console.log(`📊 Encontrados ${kpiCards.length} KPIs na interface`);
        
        for (let i = 0; i < kpiCards.length; i++) {
          const kpiCard = kpiCards[i];
          const kpiText = await kpiCard.textContent();
          console.log(`📈 KPI ${i + 1}: ${kpiText?.trim()}`);
        }
        
        // Testar seleção de KPIs
        if (kpiCards.length > 0) {
          console.log('\n🧪 Testando seleção de KPIs...');
          
          // Clicar no primeiro KPI
          console.log('👆 Clicando no primeiro KPI...');
          await kpiCards[0].click();
          await page.waitForTimeout(500);
          
          // Verificar se foi selecionado
          const firstSelected = await kpiCards[0].locator('[class*="text-green-600"]').count();
          console.log(`✅ Primeiro KPI selecionado: ${firstSelected > 0}`);
          
          if (kpiCards.length > 1) {
            // Clicar no segundo KPI
            console.log('👆 Clicando no segundo KPI...');
            await kpiCards[1].click();
            await page.waitForTimeout(500);
            
            // Verificar estado de ambos os KPIs
            const firstStillSelected = await kpiCards[0].locator('[class*="text-green-600"]').count();
            const secondSelected = await kpiCards[1].locator('[class*="text-green-600"]').count();
            
            console.log(`🔍 Estado após clicar no segundo KPI:`);
            console.log(`   - Primeiro KPI ainda selecionado: ${firstStillSelected > 0}`);
            console.log(`   - Segundo KPI selecionado: ${secondSelected > 0}`);
            
            if (firstStillSelected > 0 && secondSelected > 0) {
              console.log('✅ Seleção múltipla funcionando corretamente!');
            } else if (!firstStillSelected && secondSelected > 0) {
              console.log('❌ PROBLEMA: Clicar no segundo KPI desmarcou o primeiro!');
            } else {
              console.log('❌ PROBLEMA: Comportamento inesperado na seleção!');
            }
            
            // Testar desmarcar
            console.log('👆 Testando desmarcar o primeiro KPI...');
            await kpiCards[0].click();
            await page.waitForTimeout(500);
            
            const firstAfterUnselect = await kpiCards[0].locator('[class*="text-green-600"]').count();
            const secondAfterUnselect = await kpiCards[1].locator('[class*="text-green-600"]').count();
            
            console.log(`🔍 Estado após desmarcar o primeiro:`);
            console.log(`   - Primeiro KPI selecionado: ${firstAfterUnselect > 0}`);
            console.log(`   - Segundo KPI ainda selecionado: ${secondAfterUnselect > 0}`);
          }
        }
      } else {
        console.log('❌ Seção de KPIs não encontrada');
        
        // Verificar se há mensagens de erro ou debug no console
        const logs = [];
        page.on('console', msg => logs.push(msg.text()));
        await page.waitForTimeout(1000);
        
        console.log('📝 Logs do console:');
        logs.forEach(log => console.log(`   ${log}`));
      }
    } else {
      console.log('❌ Campo de função não encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
}

testKPIInterface().catch(console.error);