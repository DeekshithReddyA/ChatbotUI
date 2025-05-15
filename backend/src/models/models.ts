import { streamText } from "ai";
import { googleModels, isValidGoogleModel, generateGoogleStreamText } from './google';
import { openaiModels, isValidOpenAIModel, generateOpenAIStreamText } from './openai';

// Combine both model types for validation
export const allModels = {
    ...openaiModels,
    ...googleModels
} as const;

// Type for all allowed model values
export type AnyModel = (typeof allModels)[keyof typeof allModels];

// Create a Set of valid model names for fast lookup
const validModelValues = new Set<AnyModel>(Object.values(allModels));

// Unified generator function that routes to the appropriate implementation
export async function* generateStreamText(messages: any, model: string) {
    try {
        // Determine the model family from the model name
        const family = model.split("-")[0];
        
        // Validate that this is a known model
        if (!validModelValues.has(model as AnyModel)) {
            throw new Error(
                `Invalid model name: "${model}". Valid models are: ${Array.from(validModelValues).join(", ")}`
            );
        }

        // Route to the appropriate implementation based on model family
        if (family === "gpt") {
            // Route to OpenAI implementation
            const openaiTextStream = generateOpenAIStreamText(messages, model);
            for await (const text of openaiTextStream) {
                yield text;
            }
        } else if (family === "gemini") {
            // Route to Google implementation
            const googleTextStream = generateGoogleStreamText(messages, model);
            for await (const text of googleTextStream) {
                yield text;
            }
        } else {
            // Use a default model as fallback (Google in this case)
            console.warn(`Unknown model family "${family}", defaulting to Google model`);
            const defaultModelName = "gemini-2.0-flash";
            const googleTextStream = generateGoogleStreamText(messages, defaultModelName);
            for await (const text of googleTextStream) {
                yield text;
            }
        }
    } catch (error) {
        console.error("Error in generateStreamText:", error);
        yield `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
    }
}