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
exports.allModels = void 0;
exports.generateStreamText = generateStreamText;
const google_1 = require("./google");
const openai_1 = require("./openai");
// Combine both model types for validation
exports.allModels = Object.assign(Object.assign({}, openai_1.openaiModels), google_1.googleModels);
// Create a Set of valid model names for fast lookup
const validModelValues = new Set(Object.values(exports.allModels));
// Unified generator function that routes to the appropriate implementation
function generateStreamText(messages, model) {
    return __asyncGenerator(this, arguments, function* generateStreamText_1() {
        var _a, e_1, _b, _c, _d, e_2, _e, _f, _g, e_3, _h, _j;
        try {
            // Determine the model family from the model name
            const family = model.split("-")[0];
            // Validate that this is a known model
            if (!validModelValues.has(model)) {
                throw new Error(`Invalid model name: "${model}". Valid models are: ${Array.from(validModelValues).join(", ")}`);
            }
            // Route to the appropriate implementation based on model family
            if (family === "gpt") {
                // Route to OpenAI implementation
                const openaiTextStream = (0, openai_1.generateOpenAIStreamText)(messages, model);
                try {
                    for (var _k = true, openaiTextStream_1 = __asyncValues(openaiTextStream), openaiTextStream_1_1; openaiTextStream_1_1 = yield __await(openaiTextStream_1.next()), _a = openaiTextStream_1_1.done, !_a; _k = true) {
                        _c = openaiTextStream_1_1.value;
                        _k = false;
                        const text = _c;
                        yield yield __await(text);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_k && !_a && (_b = openaiTextStream_1.return)) yield __await(_b.call(openaiTextStream_1));
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            else if (family === "gemini") {
                // Route to Google implementation
                const googleTextStream = (0, google_1.generateGoogleStreamText)(messages, model);
                try {
                    for (var _l = true, googleTextStream_1 = __asyncValues(googleTextStream), googleTextStream_1_1; googleTextStream_1_1 = yield __await(googleTextStream_1.next()), _d = googleTextStream_1_1.done, !_d; _l = true) {
                        _f = googleTextStream_1_1.value;
                        _l = false;
                        const text = _f;
                        yield yield __await(text);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (!_l && !_d && (_e = googleTextStream_1.return)) yield __await(_e.call(googleTextStream_1));
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            else {
                // Use a default model as fallback (Google in this case)
                console.warn(`Unknown model family "${family}", defaulting to Google model`);
                const defaultModelName = "gemini-2.0-flash";
                const googleTextStream = (0, google_1.generateGoogleStreamText)(messages, defaultModelName);
                try {
                    for (var _m = true, googleTextStream_2 = __asyncValues(googleTextStream), googleTextStream_2_1; googleTextStream_2_1 = yield __await(googleTextStream_2.next()), _g = googleTextStream_2_1.done, !_g; _m = true) {
                        _j = googleTextStream_2_1.value;
                        _m = false;
                        const text = _j;
                        yield yield __await(text);
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (!_m && !_g && (_h = googleTextStream_2.return)) yield __await(_h.call(googleTextStream_2));
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            }
        }
        catch (error) {
            console.error("Error in generateStreamText:", error);
            yield yield __await(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
        }
    });
}
