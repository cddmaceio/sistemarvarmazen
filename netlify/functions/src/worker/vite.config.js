"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const vite_plugin_1 = require("@cloudflare/vite-plugin");
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, vite_plugin_1.cloudflare)()],
    server: {
        allowedHosts: true,
        // No proxy configuration for the worker
    },
});
