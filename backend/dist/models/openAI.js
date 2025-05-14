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
exports.generateStreamText = generateStreamText;
const ai_1 = require("ai");
const openai_1 = require("@ai-sdk/openai");
const google_1 = require("@ai-sdk/google");
// Define valid OpenAI model names as a constant object
exports.openaiModels = {
    "gpt-4o-mini": "gpt-4o-mini",
    "gpt-4o": "gpt-4o",
    "gpt-3.5-turbo": "gpt-3.5-turbo",
    "gpt-3.5-turbo-0125": "gpt-3.5-turbo-0125",
    "gemini-1.5-flash": "gemini-1.5-flash",
    "gemini-1.5-pro": "gemini-1.5-pro",
    "gemini-2.0-flash": "gemini-2.0-flash",
    "gemini-2.0-flash-lite": "gemini-2.0-flash-lite"
};
// Create a Set of valid model names for fast lookup
const validModelValues = new Set(Object.values(exports.openaiModels));
function generateStreamText(messages, model) {
    return __asyncGenerator(this, arguments, function* generateStreamText_1() {
        var _a, e_1, _b, _c;
        let MODEL;
        const family = model.split("-")[0];
        switch (family) {
            case "gpt":
                MODEL = (0, openai_1.openai)(model);
                break;
            case "gemini":
                MODEL = (0, google_1.google)(model);
                break;
            default:
                MODEL = (0, google_1.google)("gemini-2.0-flash");
                break;
        }
        // Validate the model
        if (!validModelValues.has(model)) {
            throw new Error(`Invalid model name: "${model}". Valid models are: ${Array.from(validModelValues).join(", ")}`);
        }
        const { textStream } = (0, ai_1.streamText)({
            model: MODEL,
            messages: messages,
        });
        try {
            for (var _d = true, textStream_1 = __asyncValues(textStream), textStream_1_1; textStream_1_1 = yield __await(textStream_1.next()), _a = textStream_1_1.done, !_a; _d = true) {
                _c = textStream_1_1.value;
                _d = false;
                const textPart = _c;
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
    });
}
