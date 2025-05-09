import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Search, Globe, FileText, Brain, Zap, Eye, Pin, Info } from "lucide-react";
import { cn } from "../lib/utils";

// Model capabilities
type Capability = "vision" | "search" | "pdfs" | "reasoning" | "effort";

// Model types/families
type ModelFamily = "gemini" | "gpt" | "claude" | "other";

// Interface for model objects
interface AIModel {
  id: string;
  name: string;
  family: ModelFamily;
  isPinned?: boolean;
  isPro?: boolean;
  isLocked?: boolean;
  capabilities: Capability[];
  icon?: React.ReactNode;
  description: string;
  tokens?: number;
  speed?: "Fast" | "Balanced" | "Thorough";
}

// Tooltip component
interface TooltipProps {
  model: AIModel;
  isVisible: boolean;
  position: { x: number; y: number };
}

const ModelTooltip: React.FC<TooltipProps> = ({ model, isVisible, position }) => {
  if (!isVisible) return null;
  
  return (
    <div 
      className="fixed z-[100] bg-card border border-border/40 rounded-lg shadow-lg p-3 w-72 text-sm"
      style={{ 
        top: `${position.y}px`,
        left: `${position.x}px`,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out'
      }}
    >
      <div className="flex items-center mb-2">
        <div className="mr-2">{model.icon}</div>
        <div className="font-medium">{model.name}</div>
      </div>
      <p className="text-muted-foreground mb-2">{model.description}</p>
      <div className="flex justify-between text-xs border-t border-border/40 pt-2 mt-2">
        {model.speed && (
          <div className="flex items-center">
            <Zap size={12} className="mr-1 text-accent" />
            <span>{model.speed}</span>
          </div>
        )}
        {model.tokens && (
          <div className="flex items-center">
            <Info size={12} className="mr-1 text-accent" />
            <span>{model.tokens.toLocaleString()} tokens</span>
          </div>
        )}
      </div>
      <div className="absolute left-0 top-1/2 w-2 h-2 bg-card border-l border-b border-border/40 transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
    </div>
  );
};

// Component for model selector dropdown
const ModelSelector: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [gridView, setGridView] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [screenSize, setScreenSize] = useState<"small" | "medium" | "large">("large");
  const [hoveredModel, setHoveredModel] = useState<AIModel | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [models, setModels] = useState<AIModel[]>([
    {
      id: "gemini-2-flash",
      name: "Gemini 2.0 Flash",
      family: "gemini",
      isPinned: true,
      capabilities: ["vision", "search", "pdfs"],
      icon: <span className="text-accent">✧</span>,
      description: "Google's fastest model optimized for quick responses and real-time interactions. Great for chat and creative tasks.",
      tokens: 32000,
      speed: "Fast",
    },
    {
      id: "gemini-2-flash-lite",
      name: "Gemini 2.0 Flash Lite",
      family: "gemini",
      isPinned: false,
      capabilities: ["vision", "pdfs"],
      icon: <span className="text-accent">✧</span>,
      description: "Lightweight version of Gemini Flash with reduced parameters but faster inference. Perfect for mobile devices.",
      tokens: 16000,
      speed: "Fast",
    },
    {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      family: "gemini",
      isPinned: false,
      isLocked: true,
      capabilities: ["vision", "search", "pdfs", "reasoning"],
      icon: <span className="text-accent">✧</span>,
      description: "Google's most advanced model with superior reasoning and multimodal capabilities. Handles complex tasks with ease.",
      tokens: 128000,
      speed: "Balanced",
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o-mini",
      family: "gpt",
      isPinned: false,
      capabilities: ["vision"],
      icon: <span className="text-accent">⚄</span>,
      description: "Smaller version of GPT-4o with excellent performance-to-cost ratio. Great for everyday tasks and creative writing.",
      tokens: 16000,
      speed: "Fast",
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      family: "gpt",
      isPinned: false,
      isLocked: true,
      capabilities: ["vision"],
      icon: <span className="text-accent">⚄</span>,
      description: "OpenAI's flagship multimodal model with exceptional reasoning and vision capabilities. Best for complex tasks.",
      tokens: 128000,
      speed: "Balanced",
    },
    {
      id: "gpt-4.1",
      name: "GPT-4.1",
      family: "gpt",
      isPinned: false,
      isLocked: true,
      capabilities: ["vision"],
      icon: <span className="text-accent">⚄</span>,
      description: "Latest iteration of GPT-4 with improved knowledge cutoff and enhanced reasoning capabilities.",
      tokens: 128000,
      speed: "Thorough",
    },
    {
      id: "gpt-4.1-mini",
      name: "GPT-4.1 Mini",
      family: "gpt",
      isPinned: false,
      capabilities: ["vision"],
      icon: <span className="text-accent">⚄</span>,
      description: "Compact version of GPT-4.1 with reduced parameters but maintaining strong reasoning abilities.",
      tokens: 32000,
      speed: "Fast",
    },
    {
      id: "gpt-4.1-nano",
      name: "GPT-4.1 Nano",
      family: "gpt",
      isPinned: false,
      capabilities: ["vision"],
      icon: <span className="text-accent">⚄</span>,
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
      icon: <span className="text-accent">AI</span>,
      description: "Anthropic's latest model with exceptional writing quality and nuanced understanding of complex topics.",
      tokens: 200000,
      speed: "Thorough",
    },
  ]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update screen size based on window width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setScreenSize("small");
      } else if (window.innerWidth < 1024) {
        setScreenSize("medium");
      } else {
        setScreenSize("large");
      }
    };

    // Initialize on mount
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle model hover
  const handleModelHover = (model: AIModel, event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setHoveredModel(model);
    
    // Position tooltip to the right of the model card
    setTooltipPosition({ 
      x: rect.right + 15, // 15px to the right of the element
      y: rect.top + rect.height / 2 // Centered vertically
    });
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredModel(null);
  };

  // Toggle pin status for a model
  const togglePinModel = (modelId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering model selection
    setModels(prevModels => 
      prevModels.map(model => 
        model.id === modelId 
          ? { ...model, isPinned: !model.isPinned } 
          : model
      )
    );
  };

  // Filter models based on search query
  const filteredModels = models.filter(model => 
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get pinned and unpinned models
  const pinnedModels = filteredModels.filter(model => model.isPinned);
  const unpinnedModels = filteredModels.filter(model => !model.isPinned);
  
  // Get models to display based on expanded state
  const displayedUnpinnedModels = isExpanded ? unpinnedModels : unpinnedModels.slice(0, 6);

  // Toggle expansion
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  // Select a model
  const handleSelectModel = (model: AIModel) => {
    setSelectedModel(model);
    // On mobile, close dropdown after selection
    if (screenSize === "small") {
      setIsExpanded(false);
    }
  };

  // Determine grid columns based on screen size
  const getGridColumns = () => {
    switch (screenSize) {
      case "small":
        return "grid-cols-2";
      case "medium":
        return "grid-cols-2";
      case "large":
        return "grid-cols-3";
    }
  };

  // Determine dropdown width based on screen size
  const getDropdownWidth = () => {
    switch (screenSize) {
      case "small":
        return "w-full";
      case "medium":
        return "w-full max-w-md";
      case "large":
        return "w-full max-w-md";
    }
  };

  // Get dropdown max height based on screen size
  const getDropdownMaxHeight = () => {
    switch (screenSize) {
      case "small":
        return "max-h-[80vh]";
      case "medium":
        return "max-h-[70vh]";
      case "large":
        return "max-h-[70vh]";
    }
  };

  // Render capability icons for a model
  const renderCapabilityIcons = (capabilities: Capability[]) => {
    return (
      <div className="flex gap-1">
        {capabilities.includes("vision") && (
          <div className="bg-accent/20 p-1 rounded-md">
            <Eye size={16} className="text-accent" />
          </div>
        )}
        {capabilities.includes("search") && (
          <div className="bg-accent/20 p-1 rounded-md">
            <Globe size={16} className="text-accent" />
          </div>
        )}
        {capabilities.includes("pdfs") && (
          <div className="bg-accent/20 p-1 rounded-md">
            <FileText size={16} className="text-accent" />
          </div>
        )}
        {capabilities.includes("reasoning") && (
          <div className="bg-accent/20 p-1 rounded-md">
            <Brain size={16} className="text-accent" />
          </div>
        )}
      </div>
    );
  };

  // Render a model in list view
  const renderModelListItem = (model: AIModel) => {
    return (
      <div 
        key={model.id}
        className={`flex items-center justify-between py-2 pl-2 pr-4 hover:bg-accent/10 rounded-md cursor-pointer relative ${
          selectedModel?.id === model.id ? 'bg-accent/10 ring-1 ring-accent/30' : ''
        }`}
        onClick={() => handleSelectModel(model)}
        onMouseEnter={(e) => handleModelHover(model, e)}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center">
          <div className="mr-2">{model.icon}</div>
          <span className={`${model.isLocked ? 'text-gray-500' : 'text-foreground'} truncate`}>
            {model.name}
          </span>
          {model.isPro && 
            <span className="ml-2 bg-accent/20 text-accent text-xs px-1 rounded">
              PRO
            </span>
          }
        </div>
        <div className="flex items-center gap-2">
          <button
            className={cn(
              "p-1 rounded-full hover:bg-accent/20 transition-colors",
              model.isPinned ? "text-accent" : "text-muted-foreground"
            )}
            onClick={(e) => togglePinModel(model.id, e)}
            aria-label={model.isPinned ? "Unpin model" : "Pin model"}
          >
            <Pin size={14} className={model.isPinned ? "fill-accent" : ""} />
          </button>
          <div className="flex-shrink-0">
            {renderCapabilityIcons(model.capabilities)}
          </div>
        </div>
      </div>
    );
  };

  // Render a model in grid view
  const renderModelGridItem = (model: AIModel) => {
    return (
      <div 
        key={model.id}
        className={`bg-card border border-border/40 p-3 rounded-lg cursor-pointer hover:bg-accent/5 relative ${
          selectedModel?.id === model.id ? 'ring-1 ring-accent' : ''
        }`}
        onClick={() => handleSelectModel(model)}
        onMouseEnter={(e) => handleModelHover(model, e)}
        onMouseLeave={handleMouseLeave}
      >
        <button
          className={cn(
            "absolute top-2 right-2 p-1 rounded-full hover:bg-accent/20 transition-colors",
            model.isPinned ? "text-accent" : "text-muted-foreground"
          )}
          onClick={(e) => togglePinModel(model.id, e)}
          aria-label={model.isPinned ? "Unpin model" : "Pin model"}
        >
          <Pin size={14} className={model.isPinned ? "fill-accent" : ""} />
        </button>
        <div className="flex justify-center mb-2">
          <div className="text-xl">{model.icon}</div>
        </div>
        <div className={`text-center text-sm ${model.isLocked ? 'text-gray-500' : 'text-foreground'} truncate`}>
          {model.name}
        </div>
        <div className="flex justify-center mt-2 gap-1">
          {renderCapabilityIcons(model.capabilities)}
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${getDropdownWidth()}`}>
      {/* Currently selected model (trigger for dropdown) */}
      <div 
        className="flex items-center justify-between bg-card p-2 border border-border/40 rounded-md cursor-pointer hover:bg-accent/5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center overflow-hidden">
          {selectedModel ? (
            <>
              <span className="mr-2 flex-shrink-0">{selectedModel.icon}</span>
              <span className="truncate">{selectedModel.name}</span>
            </>
          ) : (
            <>
              <span className="mr-2 flex-shrink-0 text-accent">✧</span>
              <span className="truncate">Gemini 2.0 Flash</span>
            </>
          )}
        </div>
        <ChevronDown size={16} className="flex-shrink-0 ml-2 text-muted-foreground" />
      </div>

      {/* Tooltip */}
      {hoveredModel && (
        <ModelTooltip 
          model={hoveredModel} 
          isVisible={!!hoveredModel} 
          position={tooltipPosition} 
        />
      )}

      {/* Dropdown panel */}
      {isExpanded && (
        <div 
          ref={dropdownRef}
          className={`${screenSize === "small" 
            ? "fixed inset-x-0 bottom-0 rounded-t-md" 
            : "absolute top-full left-0 w-full mt-1 rounded-md"} 
            bg-background border border-border/40 shadow-lg z-50 ${getDropdownMaxHeight()}`}
          style={{ 
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent'
          }}
        >
          {/* Search input */}
          <div className="p-3 border-b border-border/40 sticky top-0 bg-background z-10">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search models..."
                className="w-full bg-card py-2 pl-8 pr-4 rounded-md text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent border border-border/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Premium upgrade banner */}
          <div className="mx-3 my-3 px-4 py-3 bg-accent/10 rounded-lg border border-accent/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <div>
                <div className="text-foreground font-medium">Unlock all models + higher limits</div>
                <div className="text-accent text-2xl font-bold">$8 <span className="text-sm text-muted-foreground">/month</span></div>
              </div>
              <button className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-md w-full sm:w-auto">
                Upgrade now
              </button>
            </div>
          </div>

          {/* Pinned Models Section */}
          {pinnedModels.length > 0 && (
            <>
              <div className="flex justify-between items-center px-3 py-2">
                <div className="text-accent text-sm font-medium flex items-center">
                  <Pin size={14} className="mr-2 fill-accent" /> Pinned Models
                </div>
              </div>
              
              <div className="px-3 pb-3">
                {gridView ? (
                  <div className={`grid ${getGridColumns()} gap-2`}>
                    {pinnedModels.map(renderModelGridItem)}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {pinnedModels.map(renderModelListItem)}
                  </div>
                )}
              </div>
              
              <div className="border-t border-border/40 my-2"></div>
            </>
          )}

          {/* All Models Section */}
          <div className="flex justify-between items-center px-3 py-2">
            <div className="text-muted-foreground text-sm font-medium">
              All Models
            </div>
            <div className="flex gap-2">
              <button 
                className={`p-1 rounded ${gridView ? 'bg-accent/20 text-accent' : 'text-muted-foreground'}`}
                onClick={() => setGridView(true)}
                aria-label="Grid view"
              >
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                </div>
              </button>
              <button 
                className={`p-1 rounded ${!gridView ? 'bg-accent/20 text-accent' : 'text-muted-foreground'}`}
                onClick={() => setGridView(false)}
                aria-label="List view"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="w-4 h-1 bg-current rounded-sm"></div>
                  <div className="w-4 h-1 bg-current rounded-sm"></div>
                  <div className="w-4 h-1 bg-current rounded-sm"></div>
                </div>
              </button>
            </div>
          </div>

          {/* Models list */}
          <div className="px-3 pb-16">
            {gridView ? (
              <div className={`grid ${getGridColumns()} gap-2`}>
                {displayedUnpinnedModels.map(renderModelGridItem)}
              </div>
            ) : (
              <div className="space-y-1">
                {displayedUnpinnedModels.map(renderModelListItem)}
              </div>
            )}
          </div>

          {/* Expand/collapse button */}
          <div className="flex items-center justify-center px-4 py-3 border-t border-border/40 sticky bottom-0 bg-background">
            <button 
              className="flex items-center hover:bg-accent/10 cursor-pointer px-4 py-1.5 rounded-md"
              onClick={toggleExpansion}
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={16} className="mr-2 text-muted-foreground" />
                  <span className="text-sm">Show less</span>
                </>
              ) : (
                <>
                  <ChevronDown size={16} className="mr-2 text-muted-foreground" />
                  <span className="text-sm">Show all</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;