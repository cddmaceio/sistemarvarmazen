// Import your existing Hono app
const workerModule = require('../../src/worker/index');
const app = workerModule.default || workerModule;

// Create Netlify function handler manually
const handler = async (event, context) => {
  try {
    // Create a proper Request object from Netlify event
    const url = new URL(event.path, `https://${event.headers.host || 'localhost'}`);
    
    // Add query parameters
    if (event.queryStringParameters) {
      Object.entries(event.queryStringParameters).forEach(([key, value]) => {
        if (value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }
    
    // Create Request object
    const request = new Request(url.toString(), {
      method: event.httpMethod,
      headers: event.headers,
      body: event.body ? event.body : undefined,
    });
    
    // Call Hono app
    const response = await app.fetch(request);
    
    // Convert Response to Netlify format
    const responseBody = await response.text();
    
    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody,
    };
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    };
  }
};

module.exports = { handler };