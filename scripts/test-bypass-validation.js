// Test bypassing zValidator completely
// Using native fetch (Node.js 18+)

async function testBypassValidation() {
  console.log('=== TESTING BYPASS VALIDATION ===');
  
  // Test with GET request first to make sure server is responding
    try {
      console.log('Testing GET /api/lancamentos...');
      const getResponse = await fetch('http://localhost:8888/api/lancamentos');
      console.log('GET status:', getResponse.status);
      
      if (getResponse.status !== 200) {
        console.log('❌ Server not responding properly to GET');
        const errorText = await getResponse.text();
        console.log('GET Error:', errorText);
        // Continue anyway to test POST
      } else {
        console.log('✅ Server is responding to GET\n');
      }
    
    // Now let's test POST with minimal data to see where it fails
    console.log('\nTesting POST with minimal data...');
    const minimalPayload = {
      data_lancamento: '2025-01-22',
      user_id: 1,
      calculator_data: {
        funcao: 'Operador de Empilhadeira',
        turno: 'Manhã'
      },
      calculator_result: {
        subtotalAtividades: 0,
        bonusKpis: 0,
        remuneracaoTotal: 0,
        kpisAtingidos: []
      }
    };
    
    console.log('Minimal payload:');
    console.log(JSON.stringify(minimalPayload, null, 2));
    
    const response = await fetch('http://localhost:8888/api/lancamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(minimalPayload)
    });
    
    console.log('\nPOST Response status:', response.status);
    const responseText = await response.text();
    console.log('POST Response body:', responseText);
    
    // Try to parse as JSON to see if there's debug info
    try {
      const responseData = JSON.parse(responseText);
      console.log('\n🔍 FULL RESPONSE DATA:');
      console.log(JSON.stringify(responseData, null, 2));
      
      if (responseData.debug_info) {
        console.log('\n🔍 DEBUG INFO FOUND:');
        console.log(JSON.stringify(responseData.debug_info, null, 2));
      } else {
        console.log('\n❌ No debug_info in response');
      }
    } catch (e) {
      console.log('\n❌ Response is not valid JSON:', e.message);
      console.log('Raw response:', responseText);
    }
    
  } catch (error) {
    console.error('\n❌ FETCH ERROR:', error.message);
  }
}

testBypassValidation();