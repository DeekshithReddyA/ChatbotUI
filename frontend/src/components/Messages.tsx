//Message.tsx
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";
import { ScrollArea } from "./ui/ScrollArea";
import { Bot, User, Sparkles, Cpu, SendIcon} from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import  LatexText  from "./Latex";


interface Message {
    id: string;
    content: string;
    sender: "user" | "ai";
    timestamp: Date;
    model?: string;
  }
  
  interface MessageThreadProps {
    messages?: Message[];
    currentModel?: string;
    onModelChange?: (model: string) => void;
    isLoading?: boolean;
    model?: string;
    availableModels?: Array<{ id: string; name: string }>;
    onReplyWithContext?: (selectedText: string) => void;
    selectedText?: string;
    setSelectedText?: (text: string) => void;
  }

export const Messages = ({
    messages = [
        {
          id: "1",
          content: "Hello! How can I help you today?",
          sender: "ai",
          timestamp: new Date(),
          model: "gpt-4",
        },
        {
          id: "2",
          content: "I need help with a coding problem.",
          sender: "user",
          timestamp: new Date(Date.now() - 60000),
        },
        {
          id: "3",
          content:
            "Sure, I can help with that. What programming language are you working with and what specific issue are you facing?",
          sender: "ai",
          timestamp: new Date(Date.now() - 30000),
          model: "gpt-4",
        },
      ],
      currentModel = "gpt-4",
      onModelChange = () => {},
      isLoading = false,
      model = "gpt-4",
      availableModels = [
        { id: "gpt-4", name: "GPT-4" },
        { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
        { id: "claude-3", name: "Claude 3" },
        { id: "llama-3", name: "Llama 3" },
      ],
      selectedText = "",
      setSelectedText = () => {},
      onReplyWithContext = () => {},
}: MessageThreadProps) => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [selectionPosition, setSelectionPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

    const formatTimestamp = (date: Date) => {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      };

      // Get model icon based on model name
  const getModelIcon = (modelName: string) => {
    if (modelName.toLowerCase().includes("gpt")) {
      return <Sparkles className="h-3 w-3 text-accent" />;
    } else if (modelName.toLowerCase().includes("claude")) {
      return <Cpu className="h-3 w-3 text-accent" />;
    } else {
      return <Bot className="h-3 w-3 text-accent" />;
    }
  };
  const handleSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === "") {
      setSelectedText("");
      setSelectionPosition(null);
      return;
    }

    const selectedStr = selection.toString().trim();
    if (selectedStr) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(selectedStr);
      setSelectionPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    }
  };

  // Handle click on reply with context button
  const handleReplyWithContext = () => {
    if (selectedText) {
      onReplyWithContext(selectedText);
      setSelectedText("");
      setSelectionPosition(null);
    }
  };

  // Clear selection when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setSelectedText("");
      setSelectionPosition(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

    return (
    <div className="flex flex-col h-full bg-background overflow-hidden px-2 sm:px-4">
        <ScrollArea className="flex-1 p-4 bg-background" ref={scrollAreaRef}>
        <div className="w-full max-w-[900px] mx-auto">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  "flex message-appear",
                  message.sender === "user" ? "justify-end" : "justify-start",
                  // Add animation delay based on index
                  `animation-delay-${index * 10}`,
                )}
                style={{ animationDelay: `${index * 0.01}s` }}
              >
                <div
                  className={cn(
                    "flex gap-3 w-full max-w-[80%]",
                    message.sender === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <Avatar
                    className={cn(
                      "h-9 w-9 shadow-md",
                      message.sender === "user"
                        ? "bg-accent ring-2 ring-accent/20"
                        : "bg-card ring-2 ring-border",
                    )}
                  >
                    {message.sender === "user" ? (
                      <User className="h-5 w-5 text-accent-foreground" />
                    ) : (
                      <Bot className="h-5 w-5 text-accent" />
                    )}
                    <AvatarFallback>
                      {message.sender === "user" ? "U" : "AI"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div
                      className={cn(
                        "rounded-2xl shadow-md w-full overflow-hidden",
                        message.sender === "user"
                          ? "bg-accent text-accent-foreground rounded-tr-none"
                          : "bg-card border border-border/40 text-foreground rounded-tl-none",
                      )}
                    >
                      <div className="leading-8 break-words text-sm">
                        <LatexText content={message.content} />
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex mt-1.5 text-xs text-muted-foreground",
                        message.sender === "user"
                          ? "justify-end"
                          : "justify-start",
                      )}
                    >
                      <span>{formatTimestamp(message.timestamp)}</span>
                      {message.model && message.sender === "ai" && (
                        <>
                          <span className="mx-1">•</span>
                          <Badge
                            variant="outline"
                            className="text-xs h-4 px-1.5 bg-accent/20 text-accent-foreground border-accent/30 font-medium"
                          >
                            <span className="flex items-center gap-1">
                              {getModelIcon(message.model)}
                              {message.model}
                            </span>
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* {isLoading && ( */}
            {false && (
              <div className="flex justify-start message-appear">
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="h-9 w-9 bg-card ring-2 ring-border shadow-md">
                    <Bot className="h-5 w-5 text-accent" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="rounded-2xl rounded-tl-none p-4 bg-card border border-border/40 text-foreground shadow-md">
                      <div className="flex space-x-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-accent/60 animate-pulse" />
                        <div className="h-2.5 w-2.5 rounded-full bg-accent/60 animate-pulse delay-150" />
                        <div className="h-2.5 w-2.5 rounded-full bg-accent/60 animate-pulse delay-300" />
                      </div>
                    </div>
                    <div className="flex mt-1.5 text-xs text-muted-foreground">
                      <span>{formatTimestamp(new Date())}</span>
                      <span className="mx-1">•</span>
                      <Badge
                        variant="outline"
                        className="text-xs h-4 px-1.5 bg-accent/20 text-accent-foreground border-accent/30 font-medium"
                      >
                        <span className="flex items-center gap-1">
                          {getModelIcon(currentModel)}
                          {currentModel}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
            
        </div>
    )
}