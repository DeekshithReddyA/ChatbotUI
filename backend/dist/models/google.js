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
exports.googleModels = void 0;
exports.isValidGoogleModel = isValidGoogleModel;
exports.generateGoogleStreamText = generateGoogleStreamText;
const ai_1 = require("ai");
const google_1 = require("@ai-sdk/google");
// Define valid Google model names as a constant object
exports.googleModels = {
    "gemini-1.5-flash": "gemini-1.5-flash",
    "gemini-1.5-pro": "gemini-1.5-pro",
    "gemini-2.0-flash": "gemini-2.0-flash",
    "gemini-2.0-flash-lite": "gemini-2.0-flash-lite",
};
// Create a Set of valid model names for fast lookup
const validGoogleModelValues = new Set(Object.values(exports.googleModels));
// Helper function to validate Google model
function isValidGoogleModel(model) {
    return validGoogleModelValues.has(model);
}
// Function to format messages for Google models
function formatMessagesForGoogle(messages) {
    return messages.map((msg) => {
        if (Array.isArray(msg.content)) {
            // Check for oversized content and provide warning
            const totalSize = JSON.stringify(msg.content).length;
            if (totalSize > 20 * 1024 * 1024) { // 20MB limit
                console.warn(`Warning: Very large message detected (${Math.round(totalSize / 1024 / 1024)}MB). This may cause issues.`);
            }
            // Format the content specifically for Google models
            return Object.assign(Object.assign({}, msg), { content: msg.content.map((part) => {
                    if (part.type === 'image' && part.image) {
                        // For data URLs, Google models require the base64 portion only, without the prefix
                        if (typeof part.image === 'string' && part.image.startsWith('data:')) {
                            const base64Data = part.image.split(',')[1];
                            return Object.assign(Object.assign({}, part), { image: base64Data });
                        }
                    }
                    return part;
                }) });
        }
        return msg;
    });
}
// Function to generate stream text for Google models
function generateGoogleStreamText(messages, modelName) {
    return __asyncGenerator(this, arguments, function* generateGoogleStreamText_1() {
        var _a, e_1, _b, _c;
        try {
            // Validate the model
            if (!isValidGoogleModel(modelName)) {
                throw new Error(`Invalid Google model name: "${modelName}". Valid models are: ${Array.from(validGoogleModelValues).join(", ")}`);
            }
            // Format messages for Google
            const formattedMessages = formatMessagesForGoogle(messages);
            // Initialize Google model with search capabilities
            const MODEL = (0, google_1.google)(modelName, {
                useSearchGrounding: true,
                dynamicRetrievalConfig: {
                    mode: 'MODE_DYNAMIC',
                    dynamicThreshold: 0.7
                }
            });
            const { textStream } = (0, ai_1.streamText)({
                model: MODEL,
                messages: formattedMessages,
                maxTokens: 4096 // Set a reasonable limit to prevent overflows
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
            console.error("Error in generateGoogleStreamText:", error);
            yield yield __await(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
        }
    });
}
