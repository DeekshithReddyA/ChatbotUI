import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Search, Globe, FileText, Brain, Zap, Eye, Filter } from "lucide-react";

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
}

// Component for model selector dropdown
const ModelSelector: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [gridView, setGridView] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [screenSize, setScreenSize] = useState<"small" | "medium" | "large">("large");
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown and filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        filterRef.current && 
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
        setShowFilterMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sample model data
  const models: AIModel[] = [
    {
      id: "gemini-2-flash",
      name: "Gemini 2.0 Flash",
      family: "gemini",
      isPinned: true,
      capabilities: ["vision", "search", "pdfs"],
      icon: <span className="text-purple-400">✧</span>,
    },
    {
      id: "gemini-2-flash-lite",
      name: "Gemini 2.0 Flash Lite",
      family: "gemini",
      isPinned: true,
      capabilities: ["vision", "pdfs"],
      icon: <span className="text-purple-400">✧</span>,
    },
    {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      family: "gemini",
      isPinned: true,
      isLocked: true,
      capabilities: ["vision", "search", "pdfs", "reasoning"],
      icon: <span className="text-purple-400">✧</span>,
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o-mini",
      family: "gpt",
      capabilities: ["vision"],
      icon: <span className="text-pink-500">⚄</span>,
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      family: "gpt",
      isLocked: true,
      capabilities: ["vision"],
      icon: <span className="text-pink-500">⚄</span>,
    },
    {
      id: "gpt-4.1",
      name: "GPT-4.1",
      family: "gpt",
      isLocked: true,
      capabilities: ["vision"],
      icon: <span className="text-pink-500">⚄</span>,
    },
    {
      id: "gpt-4.1-mini",
      name: "GPT-4.1 Mini",
      family: "gpt",
      capabilities: ["vision"],
      icon: <span className="text-pink-500">⚄</span>,
    },
    {
      id: "gpt-4.1-nano",
      name: "GPT-4.1 Nano",
      family: "gpt",
      capabilities: ["vision"],
      icon: <span className="text-pink-500">⚄</span>,
    },
    {
      id: "claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet",
      family: "claude",
      isPro: true,
      isLocked: true,
      capabilities: ["vision", "pdfs", "reasoning"],
      icon: <span className="text-gray-300">AI</span>,
    },
  ];

  // Filter models based on search query
  const filteredModels = models.filter(model => 
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get pinned models
  const pinnedModels = models.filter(model => model.isPinned);
  
  // Get models to display based on expanded state
  const displayedModels = isExpanded ? filteredModels : filteredModels.slice(0, 8);

  // Toggle expansion
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
    if (showFilterMenu) setShowFilterMenu(false);
  };

  // Toggle filter menu
  const toggleFilterMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFilterMenu(!showFilterMenu);
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

  // Adjust filter menu position based on screen size
  const getFilterMenuPosition = () => {
    switch (screenSize) {
      case "small":
        return "absolute bottom-16 right-2";
      case "medium":
        return "absolute top-96 mt-56 left-full ml-1";
      case "large":
        return "absolute top-96 left-full ml-2";
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

  // Render capability icons for a model
  const renderCapabilityIcons = (capabilities: Capability[]) => {
    return (
      <div className="flex gap-1">
        {capabilities.includes("vision") && (
          <div className="bg-gray-800 p-1 rounded-md">
            <Eye size={16} className="text-gray-300" />
          </div>
        )}
        {capabilities.includes("search") && (
          <div className="bg-gray-800 p-1 rounded-md">
            <Globe size={16} className="text-gray-300" />
          </div>
        )}
        {capabilities.includes("pdfs") && (
          <div className="bg-gray-800 p-1 rounded-md">
            <FileText size={16} className="text-gray-300" />
          </div>
        )}
        {capabilities.includes("reasoning") && (
          <div className="bg-gray-800 p-1 rounded-md">
            <Brain size={16} className="text-gray-300" />
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
        className={`flex items-center justify-between py-2 pl-2 pr-4 hover:bg-gray-800 rounded-md cursor-pointer ${
          selectedModel?.id === model.id ? 'bg-gray-800' : ''
        }`}
        onClick={() => handleSelectModel(model)}
      >
        <div className="flex items-center">
          <div className="mr-2">{model.icon}</div>
          <span className={`${model.isLocked ? 'text-gray-500' : 'text-white'} truncate`}>
            {model.name}
          </span>
          {model.isPro && 
            <span className="ml-2 bg-purple-900 text-purple-300 text-xs px-1 rounded">
              PRO
            </span>
          }
        </div>
        <div className="ml-2 flex-shrink-0">
          {renderCapabilityIcons(model.capabilities)}
        </div>
      </div>
    );
  };

  // Render a model in grid view
  const renderModelGridItem = (model: AIModel) => {
    return (
      <div 
        key={model.id}
        className={`bg-gray-900 p-3 rounded-lg cursor-pointer hover:bg-gray-800 ${
          selectedModel?.id === model.id ? 'ring-1 ring-purple-500' : ''
        }`}
        onClick={() => handleSelectModel(model)}
      >
        <div className="flex justify-center mb-2">
          <div className="text-xl">{model.icon}</div>
        </div>
        <div className={`text-center text-sm ${model.isLocked ? 'text-gray-500' : 'text-white'} truncate`}>
          {model.name}
        </div>
        <div className="flex justify-center mt-2 gap-1">
          {renderCapabilityIcons(model.capabilities)}
        </div>
      </div>
    );
  };

  // Filter options
  const filterOptions = [
    { label: "Fast", icon: <Zap size={16} /> },
    { label: "Vision", icon: <Eye size={16} /> },
    { label: "Search", icon: <Globe size={16} /> },
    { label: "PDFs", icon: <FileText size={16} /> },
    { label: "Reasoning", icon: <Brain size={16} /> },
    { label: "Effort Control", icon: <div className="text-sm">≈</div> },
  ];

  return (
    <div className={`relative ${getDropdownWidth()}`}>
      {/* Currently selected model (trigger for dropdown) */}
      <div 
        className="flex items-center justify-between bg-gray-900 p-2 border border-gray-800 rounded-md cursor-pointer"
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
              <span className="mr-2 flex-shrink-0">✧</span>
              <span className="truncate">Gemini 2.0 Flash</span>
            </>
          )}
        </div>
        <ChevronDown size={16} className="flex-shrink-0 ml-2" />
      </div>

      {/* Dropdown panel */}
      {isExpanded && (
        <div 
          ref={dropdownRef}
          className={`${screenSize === "small" ? "fixed inset-x-0 bottom-0 rounded-t-md max-h-[80vh]" : "absolute top-full left-0 w-full mt-1 rounded-md"} 
            bg-black border border-gray-800 shadow-lg z-50 overflow-y-auto overflow-x-hidden`}
        >
          {/* Search input */}
          <div className="p-3 border-b border-gray-800 sticky top-0 bg-black z-10">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search models..."
                className="w-full bg-gray-900 py-2 pl-8 pr-4 rounded-md text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Premium upgrade banner */}
          <div className="mx-3 my-3 px-4 py-3 bg-gray-900 rounded-lg border border-gray-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <div>
                <div className="text-white font-medium">Unlock all models + higher limits</div>
                <div className="text-pink-500 text-2xl font-bold">$8 <span className="text-sm text-gray-400">/month</span></div>
              </div>
              <button className="bg-purple-900 hover:bg-purple-800 text-white px-4 py-2 rounded-md w-full sm:w-auto">
                Upgrade now
              </button>
            </div>
          </div>

          {/* View switcher and filter buttons */}
          <div className="flex justify-between items-center px-3 py-2">
            <div className="flex items-center">
              {gridView ? (
                <div className="text-purple-400 text-sm font-medium flex items-center">
                  <span className="mr-2">⏧</span> Pinned
                </div>
              ) : (
                <div className="text-purple-400 text-sm font-medium">
                  Favorites
                </div>
              )}
            </div>
          </div>

          {/* Models list */}
          <div className="px-3 pb-3">
            {gridView ? (
              <div className={`grid ${getGridColumns()} gap-2`}>
                {(isExpanded ? filteredModels : pinnedModels).map(renderModelGridItem)}
              </div>
            ) : (
              <div className="space-y-1">
                {displayedModels.map(renderModelListItem)}
              </div>
            )}
          </div>

          {/* Expand/collapse and filter buttons */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 sticky bottom-0 bg-black">
            <div 
              className="flex items-center hover:bg-gray-900 cursor-pointer px-2 py-1 rounded-md"
              onClick={toggleExpansion}
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={16} className="mr-2" />
                  <span className="text-sm">Show less</span>
                </>
              ) : (
                <>
                  <ChevronDown size={16} className="mr-2" />
                  <span className="text-sm">Show all</span>
                </>
              )}
            </div>
            <button
              className="bg-gray-900 hover:bg-gray-800 p-2 rounded-md"
              onClick={toggleFilterMenu}
            >
              <Filter size={16} className="text-gray-300" />
            </button>
          </div>
        </div>
      )}

      {/* Filter menu (conditionally rendered) */}
      {showFilterMenu && (
        <div 
          ref={filterRef}
          className={`${getFilterMenuPosition()} bg-gray-900 p-3 rounded-lg border border-gray-800 w-48 shadow-lg z-50`}
        >
          <div className="grid grid-cols-1 gap-2">
            {filterOptions.map((option) => (
              <div key={option.label} className="flex items-center p-2 hover:bg-gray-800 rounded-md cursor-pointer">
                <div className="mr-3 text-gray-400">{option.icon}</div>
                <span className="text-sm text-white">{option.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;