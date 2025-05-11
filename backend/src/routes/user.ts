import { Router } from "express";
import prisma from "../config";
import { createDefaultChat, fetchMessagesFromS3 } from "./convo";
import { v4 as uuidv4 } from "uuid";
const userRouter = Router();

userRouter.post('/signup', async (req, res) => {
    const { userId, name } = req.body;

    if (!userId || !name) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    try{
        const existingUser = await prisma.user.findUnique({
            where: { userId }
        })

        if (existingUser) {
            res.status(200).json({ message: 'User already exists' });
            return;
        }

        const user = await prisma.user.create({
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

        const fileUrl = await createDefaultChat(user.id);

        const conversation = await prisma.conversation.create({
            data: {
                id: uuidv4(),
                userId: user.id,
                fileUrl: fileUrl,
                title: "Welcome to TARS Chat",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        console.log("conversation created:");

        res.status(201).json({ user, conversation });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});

userRouter.get('/get', async (req, res) => {
    const userId = req.headers['userid'] as string;
    console.log("userID:",userId);

    if (!userId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    try{
        const user = await prisma.user.findUnique({
            where: { userId }
        });

        console.log("user:",user);

        const conversations = await prisma.conversation.findMany({
            where: { userId: user?.id }
        });

        console.log("conversations:",conversations);

        //fetch messages from s3
        const conversationsWithMessages = await fetchMessagesFromS3(conversations);

        console.log("conversationsWithMessages:",conversationsWithMessages);

        const models = await prisma.userPinnedModels.findUnique({
            where: { userId: user?.id }
        }); 

        console.log("models:",models);
        res.status(200).json({ user, conversations, models, conversationsWithMessages });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error });
        return;
    }
})

export default userRouter;