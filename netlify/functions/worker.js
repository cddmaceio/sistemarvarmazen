// Handler para a função worker com Supabase
import app from '../../src/worker/index.js';

// Verificar variáveis de ambiente do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY');
  console.error('Please configure these in your Netlify site settings.');
}

// Create Netlify function handler manually
const handler = async (event, context) => {
  try {
    console.log('Worker Event path:', event.path);
    console.log('Worker Event method:', event.httpMethod);
    
    // Remove the /.netlify/functions/worker prefix from the path
    const cleanPath = event.path.replace('/.netlify/functions/worker', '');
    console.log('Worker Clean path:', cleanPath);
    
    // Create a proper Request object from Netlify event
    const url = new URL(cleanPath, `https://${event.headers.host || 'localhost'}`);
    
    // Add query parameters
    if (event.queryStringParameters) {
      Object.entries(event.queryStringParameters).forEach(([key, value]) => {
        if (value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }
    
    console.log('Worker Final URL:', url.toString());
    
    // Create Request object
    const request = new Request(url.toString(), {
      method: event.httpMethod,
      headers: event.headers,
      body: event.body ? event.body : undefined,
    });
    
    // Create context with Supabase environment variables
     const env = {
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
    console.error('Worker Handler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    };
  }
};

export { handler };