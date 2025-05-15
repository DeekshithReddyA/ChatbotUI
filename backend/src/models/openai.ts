import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

// Define valid OpenAI model names as a constant object
export const openaiModels = {
    // "gpt-4o-mini": "gpt-4o-mini",
    "gpt-4o-mini": "gpt-4o-mini",
    "gpt-4o": "gpt-4o",
    "gpt-3.5-turbo": "gpt-3.5-turbo",
    "gpt-3.5-turbo-0125": "gpt-3.5-turbo-0125",
    "gpt-4.1-nano": "gpt-4.1-nano",
    "o4-mini": "o4-mini"
} as const;

// Type for allowed model values
export type OpenAIModel = (typeof openaiModels)[keyof typeof openaiModels];

// Create a Set of valid model names for fast lookup
const validOpenAIModelValues = new Set<OpenAIModel>(Object.values(openaiModels));

// Helper function to validate OpenAI model
export function isValidOpenAIModel(model: string): boolean {
    return validOpenAIModelValues.has(model as OpenAIModel);
}

// Function to format messages for OpenAI
function formatMessagesForOpenAI(messages: any[]): any[] {
    return messages.map((msg: any) => {
        if (Array.isArray(msg.content)) {
            // Check for oversized content and provide warning
            const totalSize = JSON.stringify(msg.content).length;
            if (totalSize > 20 * 1024 * 1024) { // 20MB limit
                console.warn(`Warning: Very large message detected (${Math.round(totalSize/1024/1024)}MB). This may cause issues.`);
            }
            
            // For OpenAI models, the format should be correct as is
            return msg;
        }
        return msg;
    });
}

// Function to generate stream text for OpenAI models
export async function* generateOpenAIStreamText(messages: any[], modelName: string) {
    try {
        // Validate the model
        if (!isValidOpenAIModel(modelName)) {
            throw new Error(
                `Invalid OpenAI model name: "${modelName}". Valid models are: ${Array.from(validOpenAIModelValues).join(", ")}`
            );
        }
        if(modelName === "gpt-4o-mini"){
            console.log("Using gpt-4o-mini-search-preview");
            modelName = "gpt-4o-mini-search-preview";
        }

        // Format messages for OpenAI
        const formattedMessages = formatMessagesForOpenAI(messages);
        
        // Initialize the model
        const MODEL = openai(modelName as OpenAIModel);

        const { textStream } = streamText({
            model: MODEL,
            messages: formattedMessages,
        });

        for await (const textPart of textStream) {
            console.log(textPart);
            yield textPart;
        }
    } catch (error) {
        console.error("Error in generateOpenAIStreamText:", error);
        yield `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
    }
} 