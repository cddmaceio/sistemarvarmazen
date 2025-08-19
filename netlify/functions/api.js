const { handle } = require('hono/netlify');

// Import your existing Hono app
const workerModule = require('../../src/worker/index');
const app = workerModule.default || workerModule;

// Create Netlify function handler
const handler = handle(app);

module.exports = { handler };