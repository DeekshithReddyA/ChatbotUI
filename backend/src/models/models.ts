import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from '@ai-sdk/google'; 

// Define valid OpenAI model names as a constant object
export const openaiModels = {
    "gpt-4o-mini": "gpt-4o-mini",
    "gpt-4o": "gpt-4o",
    "gpt-3.5-turbo": "gpt-3.5-turbo",
    "gpt-3.5-turbo-0125": "gpt-3.5-turbo-0125",
    "gemini-1.5-flash": "gemini-1.5-flash",
    "gemini-1.5-pro": "gemini-1.5-pro",
    "gemini-2.0-flash": "gemini-2.0-flash",
    "gemini-2.0-flash-lite": "gemini-2.0-flash-lite"
} as const;

// Type for allowed model values
type OpenAIModel = (typeof openaiModels)[keyof typeof openaiModels];

// Create a Set of valid model names for fast lookup
const validModelValues = new Set<OpenAIModel>(Object.values(openaiModels));

export async function* generateStreamText(messages: any, model: string) {
    let MODEL;
    const family = model.split("-")[0];
    
    try {
        switch(family){
            case "gpt":
                MODEL = openai(model as OpenAIModel);
                break;
            case "gemini":
                MODEL = google(model as OpenAIModel);
                break;
            default:
                MODEL = google("gemini-2.0-flash");
                break;
        }
        // Validate the model
        if (!validModelValues.has(model as OpenAIModel)) {
            throw new Error(
                `Invalid model name: "${model}". Valid models are: ${Array.from(validModelValues).join(", ")}`
            );
        }

        // Ensure messages are properly formatted for multimodal content
        const formattedMessages = messages.map((msg: any) => {
            // Some models handle multimodal content differently
            // Make sure the content format is correct for each provider
            if (Array.isArray(msg.content)) {
                // Check for oversized content and provide warning
                const totalSize = JSON.stringify(msg.content).length;
                if (totalSize > 20 * 1024 * 1024) { // 20MB limit
                    console.warn(`Warning: Very large message detected (${Math.round(totalSize/1024/1024)}MB). This may cause issues.`);
                }
                
                // If using Google models, ensure image URLs use the correct format
                if (family === "gemini") {
                    return {
                        ...msg,
                        content: msg.content.map((part: any) => {
                            if (part.type === 'image' && part.image) {
                                // For data URLs, Google models require the base64 portion only, without the prefix
                                if (typeof part.image === 'string' && part.image.startsWith('data:')) {
                                    const base64Data = part.image.split(',')[1];
                                    return { ...part, image: base64Data };
                                }
                            }
                            return part;
                        })
                    };
                }
                // For OpenAI models, the format should be correct as is
                return msg;
            }
            return msg;
        });

        const { textStream } = streamText({
            model: MODEL,
            messages: formattedMessages,
            maxTokens: 4096 // Set a reasonable limit to prevent overflows
        });

        for await (const textPart of textStream) {
            yield textPart;
        }
    } catch (error) {
        console.error("Error in generateStreamText:", error);
        yield `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
    }
}