import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Search, Globe, FileText, Brain, Eye, Pin } from "lucide-react";
import { cn } from "../lib/utils";
import { AIModel, Capability, ModelSelectorProps } from "../types/AIModel";
import { ModelTooltip } from "./ModelDescription";
import OpenAI from '../assets/OpenAI.svg';
import Claude from '../assets/Claude.svg';
import Gemini from '../assets/Gemini.svg';
import axios from "axios";


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Component for model selector dropdown
const ModelSelector: React.FC<ModelSelectorProps> = ({models, setModels}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [gridView, setGridView] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [screenSize, setScreenSize] = useState<"small" | "medium" | "large">("large");
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<AIModel | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update screen size based on window width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      
      if (width < 640) {
        setScreenSize("small");
        // Default to list view on mobile for better UX
        setGridView(false);
      } else if (width < 1024) {
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


  // Memoize the call so it only fires when dropdown transitions from open to closed
  // and only if pinnedModels have changed
  const prevIsExpandedRef = useRef(isExpanded);
  const prevPinnedModelsRef = useRef<string[]>([]);

  useEffect(() => {
    // Only call when dropdown transitions from open (true) to closed (false)
    if (prevIsExpandedRef.current && !isExpanded) {
      const currentPinnedModels = models.filter(model => model.isPinned).map(model => model.id);
      // Compare arrays shallowly (order matters)
      const prevPinnedModels = prevPinnedModelsRef.current;
      const arraysAreEqual = (
        currentPinnedModels.length === prevPinnedModels.length &&
        currentPinnedModels.every((id, idx) => id === prevPinnedModels[idx])
      );
      if (!arraysAreEqual) {
        axios.post(`${BACKEND_URL}/api/pinnedModels`, {
          pinnedModels: currentPinnedModels
        },{
          headers: {
            'userid': `${localStorage.getItem('userId')}`
          }
        }).then(response => {
          console.log(response.data);
        });
        prevPinnedModelsRef.current = currentPinnedModels;
      }
    }
    prevIsExpandedRef.current = isExpanded;
  }, [isExpanded, models]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setHoveredModel(null);
         // Also close any open tooltips
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle model hover
  const handleModelHover = (model: AIModel, event: React.MouseEvent) => {
    if (isMobile) {
      // On mobile, just set the hovered model without positioning
      setHoveredModel(model);
      return;
    }
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setHoveredModel(model);
    
    // Check if there's enough space on the right
    const spaceOnRight = window.innerWidth - rect.right;
    
    if (spaceOnRight < 300) {
      // Not enough space on right, position to the left
      setTooltipPosition({ 
        x: rect.left - 15,
        y: rect.top + rect.height / 2
      });
    } else {
      // Position to the right
      setTooltipPosition({ 
        x: rect.right + 15,
        y: rect.top + rect.height / 2
      });
    }
  };

  // Handle model tap on mobile
  const handleModelTap = (model: AIModel) => {
    if (isMobile) {
      if (hoveredModel && hoveredModel.id === model.id) {
        // If tapping the same model again, select it and close tooltip
        handleSelectModel(model);
        setHoveredModel(null);
      } else {
        // First tap shows tooltip
        setHoveredModel(model);
      }
    } else {
      // On desktop, directly select the model
      handleSelectModel(model);
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (!isMobile) {
      setHoveredModel(null);
    }
  };

  // Toggle pin status for a model
  const togglePinModel = (modelId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering model selection
    setModels((prevModels: AIModel[])=> 
      prevModels.map((model: AIModel) => 
        model.id === modelId 
          ? { ...model, isPinned: !model.isPinned } 
          : model
      )
    );
    
    // On mobile, also close any open tooltip
    if (isMobile) {
      setHoveredModel(null);
    }
  };

  // Filter models based on search query
  const filteredModels = models.filter(model => 
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get pinned and unpinned models
  const pinnedModels = filteredModels.filter(model => model.isPinned);
  const unpinnedModels = filteredModels.filter(model => !model.isPinned);
  
  // Get models to display based on expanded state
  const displayedUnpinnedModels = isExpanded ? unpinnedModels : unpinnedModels.slice(0, isMobile ? 4 : 6);

  // Toggle expansion
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
    // Close any open tooltip when expanding/collapsing
    setHoveredModel(null);
  };

  // Select a model
  const handleSelectModel = (model: AIModel) => {
    setSelectedModel(model);
    // On mobile, close dropdown after selection
    if (isMobile) {
      setIsExpanded(false);
    }
  };

  // Determine grid columns based on screen size
  const getGridColumns = () => {
    switch (screenSize) {
      case "small":
        return "grid-cols-1";
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
    // For mobile, limit to 2 icons to save space
    const displayCapabilities = isMobile 
      ? capabilities.slice(0, 2) 
      : capabilities;
      
    return (
      <div className="flex gap-1">
        {displayCapabilities.includes("vision") && (
          <div className="bg-accent/20 p-1 rounded-md">
            <Eye size={isMobile ? 14 : 16} className="text-accent" />
          </div>
        )}
        {displayCapabilities.includes("search") && (
          <div className="bg-accent/20 p-1 rounded-md">
            <Globe size={isMobile ? 14 : 16} className="text-accent" />
          </div>
        )}
        {displayCapabilities.includes("pdfs") && (
          <div className="bg-accent/20 p-1 rounded-md">
            <FileText size={isMobile ? 14 : 16} className="text-accent" />
          </div>
        )}
        {displayCapabilities.includes("reasoning") && (
          <div className="bg-accent/20 p-1 rounded-md">
            <Brain size={isMobile ? 14 : 16} className="text-accent" />
          </div>
        )}
        {isMobile && capabilities.length > 2 && (
          <div className="bg-accent/20 p-1 rounded-md flex items-center justify-center">
            <span className="text-accent text-xs">+{capabilities.length - 2}</span>
          </div>
        )}
      </div>
    );
  };

  const getModelIcon = (icon: string) => {
    switch (icon) {
      case "Gemini":
        return Gemini;
      case "OpenAI":
        return OpenAI;
      case "Claude":
        return Claude;
      default:
        return Gemini;
    }
  }

  // Render a model in list view
  const renderModelListItem = (model: AIModel) => {
    const isLocked = model.isLocked;
    return (
      <div 
        key={model.id}
        className={`flex items-center justify-between py-2 pl-2 pr-4 hover:bg-accent/10 rounded-md relative ${
          selectedModel?.id === model.id ? 'bg-accent/10 ring-1 ring-accent/30' : ''
        } ${hoveredModel?.id === model.id && isMobile ? 'bg-accent/10' : ''} ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => { if (!isLocked) handleModelTap(model); }}
        onMouseEnter={(e) => handleModelHover(model, e)}
        onMouseLeave={handleMouseLeave}
        aria-disabled={isLocked}
      >
        <div className="flex items-center">
          <div className="mr-2 text-white">
            <img src={getModelIcon(model.icon || "ai")} alt={model.name} className={`w-6 h-6 ${isLocked ? 'grayscale opacity-60' : ''}`} />
          </div>
          <span className={`${isLocked ? 'text-gray-500' : 'text-foreground'} truncate`}>
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
    const isLocked = model.isLocked;
    return (
      <div 
        key={model.id}
        className={`bg-card border border-border/40 p-3 rounded-lg relative ${
          selectedModel?.id === model.id ? 'ring-1 ring-accent' : ''
        } ${hoveredModel?.id === model.id && isMobile ? 'ring-1 ring-accent/50' : ''} ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => { if (!isLocked) handleModelTap(model); }}
        onMouseEnter={(e) => handleModelHover(model, e)}
        onMouseLeave={handleMouseLeave}
        aria-disabled={isLocked}
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
          <div className="text-xl">
            <img src={getModelIcon(model.icon || "")} alt={model.name} className={`w-7 h-7 ${isLocked ? 'grayscale opacity-60' : ''}`} />
          </div>
        </div>
        <div className={`text-center text-sm ${isLocked ? 'text-gray-500' : 'text-foreground'} truncate`}>
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
              <span className="mr-2 flex-shrink-0">
                <img src={getModelIcon(selectedModel.icon || "")} alt={selectedModel.name} className="w-4 h-4" />
              </span>
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
          isMobile={isMobile}
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