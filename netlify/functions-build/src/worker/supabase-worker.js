"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const cors_1 = require("hono/cors");
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const activities_1 = __importDefault(require("./routes/activities"));
const kpis_1 = __importDefault(require("./routes/kpis"));
const calculator_1 = __importDefault(require("./routes/calculator"));
const lancamentos_1 = __importDefault(require("./routes/lancamentos"));
const wms_tasks_1 = __importDefault(require("./routes/wms-tasks"));
const app = new hono_1.Hono();
// CORS middleware
app.use('*', (0, cors_1.cors)());
// Mount routes
app.route('/api/auth', auth_1.default);
app.route('/api/usuarios', users_1.default);
app.route('/api', activities_1.default);
app.route('/api', kpis_1.default);
app.route('/api', calculator_1.default);
app.route('/api', lancamentos_1.default);
app.route('/api/wms-tasks', wms_tasks_1.default);
// Health check endpoint
app.get('/api/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});
exports.default = app;
