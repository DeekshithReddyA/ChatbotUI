export const models = [
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      family: "gemini",
      isPinned: true,
      capabilities: ["vision", "search", "pdfs"],
      icon: "Gemini",
      description: "Google's fastest model optimized for quick responses and real-time interactions. Great for chat and creative tasks.",
      tokens: 32000,
      speed: "Fast",
    },
    {
      id: "gemini-2.0-flash-lite",
      name: "Gemini 2.0 Flash Lite",
      family: "gemini",
      isPinned: false,
      isLocked: false,
      capabilities: ["vision", "pdfs"],
      icon: "Gemini",
      description: "Lightweight version of Gemini Flash with reduced parameters but faster inference. Perfect for mobile devices.",
      tokens: 16000,
      speed: "Fast",
    },
    {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      family: "gemini",
      isPinned: false,
      isPro: true,
      isLocked: true,
      capabilities: ["vision", "search", "pdfs", "reasoning"],
      icon: "Gemini",
      description: "Google's most advanced model with superior reasoning and multimodal capabilities. Handles complex tasks with ease.",
      tokens: 128000,
      speed: "Balanced",
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o-mini",
      family: "gpt",
      isPinned: false,
      isLocked: false,
      capabilities: ["vision","pdfs"],
      icon: "OpenAI",
      description: "Smaller version of GPT-4o with excellent performance-to-cost ratio. Great for everyday tasks and creative writing.",
      tokens: 16000,
      speed: "Fast",
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      family: "gpt",
      isPinned: false,
      isLocked: false,
      capabilities: ["vision","pdfs"],
      icon: "OpenAI",
      description: "OpenAI's flagship multimodal model with exceptional reasoning and vision capabilities. Best for complex tasks.",
      tokens: 128000,
      speed: "Balanced",
    },
    {
      id: "gpt-4.1",
      name: "GPT-4.1",
      family: "gpt",
      isPinned: false,
      isPro: true,
      isLocked: true,
      capabilities: ["vision"],
      icon: "OpenAI",
      description: "Latest iteration of GPT-4 with improved knowledge cutoff and enhanced reasoning capabilities.",
      tokens: 128000,
      speed: "Thorough",
    },
    {
      id: "gpt-4.1-mini",
      name: "GPT-4.1 Mini",
      family: "gpt",
      isPinned: false,
      isPro: true,
      isLocked: true,
      capabilities: ["vision"],
      icon: "OpenAI",
      description: "Compact version of GPT-4.1 with reduced parameters but maintaining strong reasoning abilities.",
      tokens: 32000,
      speed: "Fast",
    },
    {
      id: "gpt-4.1-nano",
      name: "GPT-4.1 Nano",
      family: "gpt",
      isPinned: false,
      isPro: true,
      isLocked: true,
      capabilities: ["vision"],
      icon: "OpenAI",
      description: "Ultra-lightweight GPT model designed for edge devices and mobile applications with minimal latency.",
      tokens: 8000,
      speed: "Fast",
    },
    {
      id: "claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet",
      family: "claude",
      isPinned: false,
      isPro: true,
      isLocked: true,
      capabilities: ["vision", "pdfs", "reasoning"],
      icon: "Claude",
      description: "Anthropic's latest model with exceptional writing quality and nuanced understanding of complex topics.",
      tokens: 200000,
      speed: "Thorough",
    },
];

export const modifyPinnedModels = (newModels: any) => {
    return models.map((model) => {
        if (newModels.includes(model.id)) {
            return { ...model, isPinned: true };
        }
    });
}

export const modifyLockedModels = (isProMember: boolean) => {
    return models.map((model) => {
        if (isProMember) {
            return { ...model, isLocked: false };
        }
    });
}
