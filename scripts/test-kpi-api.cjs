async function testKpiApi() {
  const fetch = (await import('node-fetch')).default;
  const url = 'http://localhost:8888/api/kpis/available?funcao=CONFERENTE&turno=Manha';
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('API Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log(`Response status: ${response.status}`);
  } catch (error) {
    console.error('Error fetching API:', error);
  }
}

testKpiApi();