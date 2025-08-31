async function testAPI() {
  try {
    const response = await fetch('http://localhost:8888/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        nome_atividade: "Prod Repack",
        funcao: "Ajudante de Armazém",
        turno: "Manhã",
        quantidade_produzida: 150,
        tempo_horas: 6,
        kpis_atingidos: ["Ressuprimento", "EFC"]
      })
    });

    console.log('Status:', response.status);
    const result = await response.json();
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();