import { Router } from "express";
import prisma from "../config";
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
        })

        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});

export default userRouter;