"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateText = void 0;
const ai_1 = require("ai");
const openai_1 = require("@ai-sdk/openai");
const generateText = (prompt) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    const { textStream } = (0, ai_1.streamText)({
        model: (0, openai_1.openai)("gpt-4o-mini-search-preview"),
        prompt: prompt,
        tools: {
            web_search_preview: openai_1.openai.tools.webSearchPreview({
                searchContextSize: 'medium',
                userLocation: {
                    type: 'approximate',
                    city: 'Hyderabad',
                    country: 'India',
                }
            })
        },
        toolChoice: { type: 'tool', toolName: 'web_search_preview', }
    });
    try {
        for (var _d = true, textStream_1 = __asyncValues(textStream), textStream_1_1; textStream_1_1 = yield textStream_1.next(), _a = textStream_1_1.done, !_a; _d = true) {
            _c = textStream_1_1.value;
            _d = false;
            const chunk = _c;
            console.log(chunk);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_d && !_a && (_b = textStream_1.return)) yield _b.call(textStream_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
});
exports.generateText = generateText;
