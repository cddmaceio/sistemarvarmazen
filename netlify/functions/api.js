// Função Netlify usando módulos ES6
export const handler = async (event, context) => {
  const { httpMethod, path, queryStringParameters, body, headers } = event;
  
  // Configurar CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };
  
  // Responder a requisições OPTIONS (preflight)
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  
  try {
    // Extrair o caminho da API
    const apiPath = path.replace('/api', '') || '/';
    
    // Roteamento simples
    if (apiPath === '/health') {
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          path: apiPath,
          originalPath: path
        })
      };
    }
    
    // Rota não encontrada
    return {
      statusCode: 404,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Route not found',
        path: apiPath,
        availableRoutes: ['/health']
      })
    };
    
  } catch (error) {
    console.error('Error in Netlify function:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};