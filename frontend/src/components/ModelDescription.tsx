import { Info, Zap } from "lucide-react";
import { TooltipProps } from "../types/AIModel";
import OpenAI from '../assets/OpenAI.svg';
import Claude from '../assets/Claude.svg';
import Gemini from '../assets/Gemini.svg';

export const ModelTooltip: React.FC<TooltipProps> = ({ model, isVisible, position, isMobile }) => {

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
    if (!isVisible) return null;
    
    // For mobile, show tooltip at a fixed position
    if (isMobile) {
      return (
        <div 
          className="fixed inset-x-4 bottom-20 z-[100] bg-card border border-border/40 rounded-lg shadow-lg p-3 text-sm"
          style={{ 
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          <div className="flex items-center mb-2">
            <div className="mr-2">
              <img src={getModelIcon(model.icon || "")} alt={model.name} className="w-4 h-4" />
            </div>
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
        </div>
      );
    }
    
    // For desktop, show tooltip next to the model
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
          <div className="mr-2">
            <img src={getModelIcon(model.icon || "")} alt={model.name} className="w-4 h-4" />
          </div>
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