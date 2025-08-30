// Netlify Function handler for Hono app with Supabase
// Netlify function handler (ESM)
const handler = async (event, context) => {
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
        const headers = {};
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
        const env = {
            SUPABASE_URL: supabaseUrl,
            SUPABASE_ANON_KEY: supabaseAnonKey
        };
        // Import do app Hono usando import dinâmico
        console.log('Loading app module...');
        const { default: app } = await import('./src/worker/supabase-worker.js');
        console.log('App module loaded:', !!app);
        // Call Hono app with environment
        console.log('Calling app.fetch with:', request.url, request.method);
        const response = await app.fetch(request, env);
        console.log('Response status:', response.status);
        // Convert Response to Netlify format
        const responseBody = await response.text();
        return {
            statusCode: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseBody,
        };
    }
    catch (error) {
        console.error('Handler error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
        };
    }
};
export { handler };
