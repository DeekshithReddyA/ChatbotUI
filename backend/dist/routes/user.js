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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const config_1 = __importDefault(require("../config"));
const convo_1 = require("./convo");
const uuid_1 = require("uuid");
const userRouter = (0, express_1.Router)();
userRouter.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, name } = req.body;
    if (!userId || !name) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    try {
        const existingUser = yield config_1.default.user.findUnique({
            where: { userId }
        });
        if (existingUser) {
            res.status(200).json({ message: 'User already exists' });
            return;
        }
        const user = yield config_1.default.user.create({
            data: {
                userId,
                name,
                isPro: false,
                messagesLeft: 5,
                pinnedModels: {
                    create: {
                        models: []
                    }
                }
            }
        });
        const fileUrl = yield (0, convo_1.createDefaultChat)(user.id);
        const conversation = yield config_1.default.conversation.create({
            data: {
                id: (0, uuid_1.v4)(),
                userId: user.id,
                fileUrl: fileUrl,
                title: "Welcome to TARS Chat",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
        console.log("conversation created:");
        res.status(201).json({ user, conversation });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}));
userRouter.get('/get', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.headers['userid'];
    console.log("userID:", userId);
    if (!userId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    try {
        const user = yield config_1.default.user.findUnique({
            where: { userId }
        });
        console.log("user:", user);
        const conversations = yield config_1.default.conversation.findMany({
            where: { userId: user === null || user === void 0 ? void 0 : user.id }
        });
        console.log("conversations:", conversations);
        //fetch messages from s3
        const conversationsWithMessages = yield (0, convo_1.fetchMessagesFromS3)(conversations);
        console.log("conversationsWithMessages:", conversationsWithMessages);
        const models = yield config_1.default.userPinnedModels.findUnique({
            where: { userId: user === null || user === void 0 ? void 0 : user.id }
        });
        console.log("models:", models);
        res.status(200).json({ user, conversations, models, conversationsWithMessages });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error });
        return;
    }
}));
exports.default = userRouter;
