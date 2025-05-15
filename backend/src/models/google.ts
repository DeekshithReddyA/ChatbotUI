import { streamText } from "ai";
import { google } from '@ai-sdk/google';

// Define valid Google model names as a constant object
export const googleModels = {
    "gemini-1.5-flash": "gemini-1.5-flash",
    "gemini-1.5-pro": "gemini-1.5-pro",
    "gemini-2.0-flash": "gemini-2.0-flash",
    "gemini-2.0-flash-lite": "gemini-2.0-flash-lite",
} as const;

// Type for allowed model values
export type GoogleModel = (typeof googleModels)[keyof typeof googleModels];

// Create a Set of valid model names for fast lookup
const validGoogleModelValues = new Set<GoogleModel>(Object.values(googleModels));

// Helper function to validate Google model
export function isValidGoogleModel(model: string): boolean {
    return validGoogleModelValues.has(model as GoogleModel);
}

// Function to format messages for Google models
function formatMessagesForGoogle(messages: any[]): any[] {
    return messages.map((msg: any) => {
        if (Array.isArray(msg.content)) {
            // Check for oversized content and provide warning
            const totalSize = JSON.stringify(msg.content).length;
            if (totalSize > 20 * 1024 * 1024) { // 20MB limit
                console.warn(`Warning: Very large message detected (${Math.round(totalSize/1024/1024)}MB). This may cause issues.`);
            }
            
            // Format the content specifically for Google models
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
        return msg;
    });
}

// Function to generate stream text for Google models
export async function* generateGoogleStreamText(messages: any[], modelName: string) {
    try {
        // Validate the model
        if (!isValidGoogleModel(modelName)) {
            throw new Error(
                `Invalid Google model name: "${modelName}". Valid models are: ${Array.from(validGoogleModelValues).join(", ")}`
            );
        }

        // Format messages for Google
        const formattedMessages = formatMessagesForGoogle(messages);
        
        // Initialize Google model with search capabilities
        const MODEL = google(modelName as GoogleModel, {
            useSearchGrounding: true, 
            dynamicRetrievalConfig: {
                mode: 'MODE_DYNAMIC',
                dynamicThreshold: 0.7
            }
        });

        const { textStream } = streamText({
            model: MODEL,
            messages: formattedMessages,
            maxTokens: 4096 // Set a reasonable limit to prevent overflows
        });

        for await (const textPart of textStream) {
            console.log(textPart);
            yield textPart;
        }
    } catch (error) {
        console.error("Error in generateGoogleStreamText:", error);
        yield `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
    }
}