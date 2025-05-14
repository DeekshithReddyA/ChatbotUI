"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamText = void 0;
const client_1 = require("@prisma/client");
const ai_1 = require("ai");
Object.defineProperty(exports, "streamText", { enumerable: true, get: function () { return ai_1.streamText; } });
const primsa = new client_1.PrismaClient();
exports.default = primsa;
