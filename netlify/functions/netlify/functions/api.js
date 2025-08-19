"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const netlify_1 = require("hono/netlify");
// Import your existing Hono app
const index_1 = __importDefault(require("../../src/worker/index"));
// Create Netlify function handler
const handler = (0, netlify_1.handle)(index_1.default);
exports.handler = handler;
