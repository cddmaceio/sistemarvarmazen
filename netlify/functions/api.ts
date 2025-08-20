// Netlify Function handler for Hono app with Supabase
const app = require('../../src/worker/supabase-worker').default;

// Supabase Environment type
interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

// Netlify function handler
const handler = async (event: any, context: any) => {
  try {
    console.log('Event path:', event.path);
    console.log('Event method:', event.httpMethod);
    
    // Verificar variáveis de ambiente do Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY');
      console.error('Please configure these in your Netlify site settings.');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Server configuration error', 
          message: 'Missing Supabase environment variables' 
        }),
      };
    }
    
    // Remove the /.netlify/functions prefix from the path
    const cleanPath = event.path?.replace('/.netlify/functions', '') || '/';
    console.log('Clean path:', cleanPath);
    
    // Create a proper Request object from Netlify event
    const url = new URL(cleanPath, `https://${event.headers?.host || 'localhost'}`);
    
    // Add query parameters
    if (event.queryStringParameters) {
      Object.entries(event.queryStringParameters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && typeof value === 'string') {
          url.searchParams.append(key, value);
        }
      });
    }
    
    console.log('Final URL:', url.toString());
    
    // Create Request object
    const headers: Record<string, string> = {};
    if (event.headers) {
      Object.entries(event.headers).forEach(([key, value]) => {
        if (value !== null && value !== undefined && typeof value === 'string') {
          headers[key] = value;
        }
      });
    }
    
    const request = new Request(url.toString(), {
      method: event.httpMethod || 'GET',
      headers,
      body: event.body || undefined,
    });
    
    // Create context with Supabase environment variables
    const env: Env = {
      SUPABASE_URL: supabaseUrl,
      SUPABASE_ANON_KEY: supabaseAnonKey
    };
    
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
      body: JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
    }
  }
};

module.exports = { handler };