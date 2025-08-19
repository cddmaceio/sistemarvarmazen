// Import your existing Hono app
const workerModule = require('../../src/worker/index');
const app = workerModule.default || workerModule;

// Mock D1 Database for Netlify (temporary solution)
const mockDB = {
  prepare: (query) => {
    // Check if this is a query that should return direct results (not wrapped in .results)
    const isDirectResultQuery = query.includes('DISTINCT funcao_kpi') || 
                               query.includes('DISTINCT nome_atividade') ||
                               query.includes('SELECT * FROM activities');
    
    return {
      bind: (...values) => ({
        first: async () => null,
        all: async () => isDirectResultQuery ? [] : { results: [] },
        run: async () => ({ success: true, meta: { last_row_id: 1, changes: 1 } })
      }),
      first: async () => null,
      all: async () => isDirectResultQuery ? [] : { results: [] },
      run: async () => ({ success: true, meta: { last_row_id: 1, changes: 1 } })
    };
  },
  exec: async () => ({ count: 0, duration: 0 }),
  batch: async () => [],
  dump: async () => new ArrayBuffer(0)
};

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
    
    // Create context with mock environment
    const env = { DB: mockDB };
    
    // Call Hono app with environment
    const response = await app.fetch(request, env);
    
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