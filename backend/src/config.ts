import { PrismaClient } from "@prisma/client";
import { streamText } from "ai";

const primsa = new PrismaClient();

export default primsa;
export { streamText };