const { Handler } = require('@netlify/functions');
const { handle } = require('hono/netlify');

// Import your existing Hono app
const app = require('../../src/worker/index').default;

// Create Netlify function handler
const handler = handle(app);

module.exports = { handler };