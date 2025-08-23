// Simple Netlify function for testing
exports.handler = async (event, context) => {
  console.log('Function called with path:', event.path);
  console.log('Function called with method:', event.httpMethod);
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }
  
  // Get the path after removing /.netlify/functions/api
  const path = event.path.replace('/.netlify/functions/api', '') || '/';
  console.log('Clean path:', path);
  
  // Handle health check
  if (path === '/api/health' || path === '/health') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        path: path,
        originalPath: event.path
      })
    };
  }
  
  // Default response
  return {
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      error: 'Not Found',
      path: path,
      originalPath: event.path,
      availableRoutes: ['/api/health']
    })
  };
};
