import { Handler } from '@netlify/functions';
import { Hono } from 'hono';
import { handle } from 'hono/netlify';

// Import your existing Hono app
import app from '../../src/worker/index';

// Create Netlify function handler
const handler: Handler = handle(app);

export { handler };