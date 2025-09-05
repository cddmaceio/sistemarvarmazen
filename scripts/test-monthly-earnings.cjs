const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:8888';

async function testMonthlyEarnings() {
  const endpoint = '/api/monthly-earnings';
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    console.log(`[TEST] ${endpoint}: ${response.status} ${response.statusText}`);
    if (response.status !== 200) {
      console.error(`[FAIL] Rota ${endpoint} retornou status ${response.status}`);
      const text = await response.text();
      console.error(`[FAIL] Body: ${text}`);
    }
  } catch (error) {
    console.error(`[FAIL] Erro ao testar a rota ${endpoint}:`, error);
  }
}

testMonthlyEarnings();