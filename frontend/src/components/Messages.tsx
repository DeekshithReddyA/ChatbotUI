import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "../lib/utils";
import { ScrollArea } from "./ui/ScrollArea";
import { Bot, Sparkles, Cpu, FileIcon } from "lucide-react";
import LatexText from "./Latex";
import { AnimatePresence, motion } from "framer-motion";
import { AIModel } from "../types/AIModel";

interface Message {
  id: string;
  content: string | any[]; // Allow either string or array content
  sender: "user" | "ai";
  timestamp: Date;
  model?: string;
}

interface MessageThreadProps {
  messages?: Message[];
  currentModel?: string;
  onModelChange?: (model: string) => void;
  isLoading?: boolean;
  models?: AIModel[];
  onReplyWithContext?: (selectedText: string) => void;
  selectedText?: string;
  setSelectedText?: (text: string) => void;
  streamingResponse?: string;
}

// Utility to split streaming markdown into complete and incomplete blocks
function splitMarkdownAtIncompleteCodeBlock(text: string) {
  // Find all code block delimiters (```) in the text
  const codeBlockRegex = /```/g;
  let match;
  let count = 0;
  let lastIndex = 0;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    count++;
    lastIndex = match.index + 3;
  }
  // If odd number of code block delimiters, code block is open
  if (count % 2 === 1) {
    // Split at the last opening ```
    return {
      complete: text.slice(0, lastIndex),
      incomplete: text.slice(lastIndex)
    };
  } else {
    return {
      complete: text,
      incomplete: ''
    };
  }
}

// Helper function to check if a string is a JSON array with image content
function isJsonWithImages(str: string): boolean {
  try {
    if (!str.startsWith('[{') || !str.endsWith('}]')) return false;
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) && parsed.some(part => part.type === 'image' || part.type === 'file');
  } catch (e) {
    return false;
  }
}

// Helper function to extract text from multimodal content
function extractTextContent(contentArray: any[]): string {
  const textParts = contentArray.filter(part => part.type === 'text');
  return textParts.map(part => part.text).join('\n');
}

// Helper function to render multimodal content
function renderMultimodalContent(content: string) {
  try {
    const parsedContent = JSON.parse(content);
    if (!Array.isArray(parsedContent)) {
      return <LatexText content={content} />;
    }

    return (
      <div className="flex flex-col gap-3">
        {/* Render text parts first */}
        {parsedContent.filter(part => part.type === 'text').map((part, idx) => (
          <div key={`text-${idx}`}>
            <LatexText content={part.text} />
          </div>
        ))}
        
        {/* Render image parts */}
        <div className="flex flex-wrap gap-2 mt-1">
          {parsedContent.filter(part => part.type === 'image').map((part, idx) => (
            <div key={`img-${idx}`} className="relative group">
              <img 
                src={part.image} 
                alt="Attached image"
                className="max-w-[240px] max-h-[240px] rounded-md object-cover border border-border/60"
              />
            </div>
          ))}
        </div>
        
        {/* Render file attachments */}
        <div className="flex flex-wrap gap-2 mt-1">
          {parsedContent.filter(part => part.type === 'file').map((part, idx) => (
            <div 
              key={`file-${idx}`} 
              className="flex items-center gap-2 bg-background/50 rounded-md border border-border/60 px-3 py-2"
            >
              <FileIcon className="h-4 w-4 text-primary/70" />
              <span className="text-xs truncate max-w-[150px]">
                {part.filename || 'Attached file'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (e) {
    return <LatexText content={content} />;
  }
}

export const Messages = ({
  messages,
  currentModel = "gpt-4",
  onModelChange = () => {},
  isLoading = false,
  models,
  selectedText = "",
  setSelectedText = () => {},
  onReplyWithContext = () => {},
  streamingResponse = "",
}: MessageThreadProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const streamingMessageRef = useRef<HTMLDivElement>(null);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [renderedResponse, setRenderedResponse] = useState("");
  const streamingTimer = useRef<NodeJS.Timeout | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  useEffect(() => {
    if (streamingTimer.current) clearTimeout(streamingTimer.current);
    if (!isLoading && streamingResponse) {
      setRenderedResponse(streamingResponse);
      return;
    }
    if (!streamingResponse) {
      setRenderedResponse("");
      return;
    }
    if (renderedResponse.length < streamingResponse.length) {
      const charsToAdd = Math.min(5, streamingResponse.length - renderedResponse.length);
      streamingTimer.current = setTimeout(() => {
        setRenderedResponse(streamingResponse.slice(0, renderedResponse.length + charsToAdd));
      }, 10);
    }
  }, [streamingResponse, renderedResponse, isLoading]);

  // Helper to scroll to bottom
  const scrollToBottom = useCallback(() => {
    const viewport = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, []);

  // Listen for scroll events to detect if user is at bottom
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (!viewport) return;

    const handleScroll = () => {
      const threshold = 50; // px
      const atBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < threshold;
      setIsAtBottom(atBottom);
      if (!atBottom) {
        setAutoScrollEnabled(false);
      } else if (isLoading) {
        setAutoScrollEnabled(true);
      }
    };
    viewport.addEventListener("scroll", handleScroll);
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, [isLoading]);

  // Auto-scroll only if enabled
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (!viewport) return;
    if (autoScrollEnabled) {
      setTimeout(() => {
        viewport.scrollTop = viewport.scrollHeight;
      }, 10);
    }
  }, [messages, renderedResponse, autoScrollEnabled]);

  // When streaming stops, disable auto-scroll (user must click button to re-enable)
  useEffect(() => {
    if (!isLoading) {
      setAutoScrollEnabled(false);
    }
  }, [isLoading]);

  const formatTimestamp = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const getModelIcon = (modelName: string) =>
    modelName.toLowerCase().includes("gpt") ? <Sparkles className="h-3 w-3 text-accent" /> :
    modelName.toLowerCase().includes("claude") ? <Cpu className="h-3 w-3 text-accent" /> :
    <span />;

  const handleSelection = () => {
    // Only process selection if it's within the messages container
    if (!messagesContainerRef.current) return;

    const sel = window.getSelection();
    if (!sel || !sel.toString().trim()) {
      setSelectedText("");
      setSelectionPosition(null);
      return;
    }

    // Check if the selection is within the messages container
    const range = sel.getRangeAt(0);
    const selectedNode = range.commonAncestorContainer;
    
    // Check if the selected text is within the messages container
    if (!messagesContainerRef.current.contains(selectedNode)) {
      return;
    }

    const text = sel.toString().trim();
    const rect = range.getBoundingClientRect();
    setSelectedText(text);
    setSelectionPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
  };

  useEffect(() => {
    // Only add the selection listener to the messages container
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.addEventListener("mouseup", handleSelection);
    }
    
    return () => {
      if (messagesContainer) {
        messagesContainer.removeEventListener("mouseup", handleSelection);
      }
    };
  }, []);

  // Clear the selection when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (messagesContainerRef.current && !messagesContainerRef.current.contains(e.target as Node)) {
        setSelectedText("");
        setSelectionPosition(null);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (streamingTimer.current) {
        clearTimeout(streamingTimer.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden px-2 sm:px-4">
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 relative">
        {/* Scroll to Bottom Button */}
        {!isAtBottom && (
          <button
            className="fixed bottom-24 right-8 z-20 bg-accent text-accent-foreground px-4 py-2 rounded-full shadow-lg border border-border/40 transition-opacity hover:bg-accent/90"
            onClick={() => {
              scrollToBottom();
              setIsAtBottom(true);
              if (isLoading) {
                setAutoScrollEnabled(true);
              }
            }}
            aria-label="Scroll to bottom"
          >
            ↓ Scroll to Bottom
          </button>
        )}
        <div ref={messagesContainerRef} className="space-y-6 max-w-[900px] mx-auto">
          <AnimatePresence initial={false}>
            {messages && messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className={cn("flex", msg.sender === "user" ? "justify-end pr-[5%]" : "justify-start")}
              >
                <div className="max-w-[95%] overflow-hidden">
                  <div className={cn("rounded-2xl shadow-md overflow-hidden", msg.sender === "user" ? "bg-accent text-accent-foreground rounded-tr-none" : "bg-card border border-border/40 text-foreground rounded-tl-none")}>
                    <div className="leading-8 px-2 py-1 break-words text-sm overflow-wrap-anywhere">
                      {isJsonWithImages(typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)) ? renderMultimodalContent(typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)) : <LatexText content={typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)} />}
                    </div>
                  </div>
                  <div className={cn("flex mt-1.5 text-xs text-muted-foreground", msg.sender === "user" ? "justify-end" : "justify-start")}>
                    <span className="flex items-center gap-1">
                              {getModelIcon(msg.model || "")}
                              {models && models.find(m => m.id === msg.model)?.name || msg.model}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              ref={streamingMessageRef}
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.3 }} 
              className="flex justify-start"
            >
              <div className="max-w-[95%] overflow-hidden">
                <div className="rounded-2xl px-2 py-1 bg-card border border-border/40 text-foreground shadow-md text-sm leading-8 break-words overflow-wrap-anywhere">
                  {/* Split streaming response for correct rendering */}
                  {(() => {
                    // Check if the renderedResponse is a JSON string with multimodal content
                    if (isJsonWithImages(renderedResponse)) {
                      return renderMultimodalContent(renderedResponse);
                    }
                    
                    // Otherwise render as traditional markdown with potential code blocks
                    const { complete, incomplete } = splitMarkdownAtIncompleteCodeBlock(renderedResponse);
                    return <>
                      {complete && <LatexText content={complete} />}
                      {incomplete && (
                        <pre className="bg-transparent text-foreground whitespace-pre-wrap break-words mt-2">{incomplete}</pre>
                      )}
                    </>;
                  })()}
                  <span className="cursor-animation inline-block w-1 h-4 align-middle" />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
