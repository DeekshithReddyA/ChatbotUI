import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export const generateText = async (prompt: string) => {
  const {textStream} = streamText({
    model: openai("gpt-4o-mini"),
    prompt: prompt,
    tools: {
        web_search_preview: openai.tools.webSearchPreview({
            searchContextSize: 'medium',
            userLocation: {
                type: 'approximate',
                city: 'Hyderabad',
                country: 'India',
            }
        })
    },
    toolChoice: {type: 'tool', toolName: 'web_search_preview', }
  });

  for await (const chunk of textStream) {
    console.log(chunk);
  }
};