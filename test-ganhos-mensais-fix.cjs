async function testMonthlyEarnings() {
  const { default: fetch } = await import('node-fetch');
  const url = 'http://localhost:5173/api/monthly-earnings';
  console.log(`Testing: ${url}`);

  try {
    const response = await fetch(url);
    const text = await response.text();
    console.log('API Response Text:', text);
    const data = JSON.parse(text);

    if (!response.ok) {
      console.error('Test Failed: API returned an error');
      console.error('Status:', response.status);
      console.error('Body:', data);
      process.exit(1);
    }

    if (!data.success || !Array.isArray(data.data)) {
      console.error('Test Failed: Invalid data structure in response');
      console.error('Response:', data);
      process.exit(1);
    }

    console.log('Test Passed: API returned a successful response.');
    console.log('Data sample:', data.data.slice(0, 2));

  } catch (error) {
    console.error('Test Failed: An unexpected error occurred');
    console.error(error);
    process.exit(1);
  }
}

testMonthlyEarnings();