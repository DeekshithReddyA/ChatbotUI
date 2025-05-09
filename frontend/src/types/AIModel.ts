// Model capabilities
export type Capability = "vision" | "search" | "pdfs" | "reasoning" | "effort";

// Model types/families
export type ModelFamily = "gemini" | "gpt" | "claude" | "other";


export interface AIModel {
    id: string;
    name: string;
    family: ModelFamily;
    isPinned?: boolean;
    isPro?: boolean;
    isLocked?: boolean;
    capabilities: Capability[];
    icon?: string;
    description: string;
    tokens?: number;
    speed?: "Fast" | "Balanced" | "Thorough";
  }

  // Tooltip component
export interface TooltipProps {
    model: AIModel;
    isVisible: boolean;
    position: { x: number; y: number };
    isMobile: boolean;
  }


export interface ModelSelectorProps {
    models: AIModel[];
    setModels: any
  }