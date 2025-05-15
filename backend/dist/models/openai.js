"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openaiModels = void 0;
exports.isValidOpenAIModel = isValidOpenAIModel;
exports.generateOpenAIStreamText = generateOpenAIStreamText;
const ai_1 = require("ai");
const openai_1 = require("@ai-sdk/openai");
const config_1 = require("../config");
// Define valid OpenAI model names as a constant object
exports.openaiModels = {
    // "gpt-4o-mini": "gpt-4o-mini",
    "gpt-4o-mini": "gpt-4o-mini",
    "gpt-4o": "gpt-4o",
    "gpt-3.5-turbo": "gpt-3.5-turbo",
    "gpt-3.5-turbo-0125": "gpt-3.5-turbo-0125",
    "gpt-4.1-nano": "gpt-4.1-nano",
    "o4-mini": "o4-mini"
};
// Create a Set of valid model names for fast lookup
const validOpenAIModelValues = new Set(Object.values(exports.openaiModels));
// Helper function to validate OpenAI model
function isValidOpenAIModel(model) {
    return validOpenAIModelValues.has(model);
}
// Function to format messages for OpenAI
function formatMessagesForOpenAI(messages) {
    return messages.map((msg) => {
        if (Array.isArray(msg.content)) {
            // Check for oversized content and provide warning
            const totalSize = JSON.stringify(msg.content).length;
            if (totalSize > 20 * 1024 * 1024) { // 20MB limit
                console.warn(`Warning: Very large message detected (${Math.round(totalSize / 1024 / 1024)}MB). This may cause issues.`);
            }
            // For OpenAI models, the format should be correct as is
            return msg;
        }
        return msg;
    });
}
// Function to generate stream text for OpenAI models
function generateOpenAIStreamText(messages, modelName) {
    return __asyncGenerator(this, arguments, function* generateOpenAIStreamText_1() {
        var _a, e_1, _b, _c;
        try {
            // Validate the model
            if (!isValidOpenAIModel(modelName)) {
                throw new Error(`Invalid OpenAI model name: "${modelName}". Valid models are: ${Array.from(validOpenAIModelValues).join(", ")}`);
            }
            // Format messages for OpenAI
            const formattedMessages = formatMessagesForOpenAI(messages);
            // Initialize the model
            const MODEL = (0, openai_1.openai)(modelName);
            const { textStream } = (0, ai_1.streamText)({
                model: MODEL,
                system: config_1.prompt,
                messages: formattedMessages,
            });
            try {
                for (var _d = true, textStream_1 = __asyncValues(textStream), textStream_1_1; textStream_1_1 = yield __await(textStream_1.next()), _a = textStream_1_1.done, !_a; _d = true) {
                    _c = textStream_1_1.value;
                    _d = false;
                    const textPart = _c;
                    console.log(textPart);
                    yield yield __await(textPart);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = textStream_1.return)) yield __await(_b.call(textStream_1));
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        catch (error) {
            console.error("Error in generateOpenAIStreamText:", error);
            yield yield __await(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
        }
    });
}
