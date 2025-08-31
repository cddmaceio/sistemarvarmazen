// Using native fetch (Node.js 18+)

async function testTurnoSimple() {
  console.log('=== TESTING TURNO SIMPLE ===');
  
  // Test with complete required payload
  const payload = {
    "data_lancamento": "2025-01-22",
    "user_id": 1,
    "calculator_data": {
      "funcao": "Operador de Empilhadeira",
      "turno": "Manhã"
    },
    "calculator_result": {
      "subtotalAtividades": 0,
      "bonusKpis": 0,
      "remuneracaoTotal": 0,
      "kpisAtingidos": []
    }
  };
  
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/.netlify/functions/api/lancamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseText);
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log('\n🔍 PARSED RESPONSE:');
      console.log(JSON.stringify(responseJson, null, 2));
      
      if (responseJson.debug_info) {
        console.log('\n✅ Debug info found!');
        console.log('Debug info:', JSON.stringify(responseJson.debug_info, null, 2));
      } else {
        console.log('\n❌ No debug_info in response');
      }
    } catch (parseError) {
      console.log('\n❌ Failed to parse response as JSON:', parseError.message);
    }
    
  } catch (error) {
    console.error('❌ FETCH ERROR:', error.message);
  }
}

testTurnoSimple();