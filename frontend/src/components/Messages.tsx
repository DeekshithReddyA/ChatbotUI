

// import { useEffect, useRef, useState } from "react";
// import { cn } from "../lib/utils";
// import { ScrollArea } from "./ui/ScrollArea";
// import { Bot, User, Sparkles, Cpu } from "lucide-react";
// import { Avatar, AvatarFallback } from "./ui/Avatar";
// import { Badge } from "./ui/Badge";
// import LatexText from "./Latex";
// import { AnimatePresence, motion } from "framer-motion"; // Added framer-motion for smooth transitions

// interface Message {
//   id: string;
//   content: string;
//   sender: "user" | "ai";
//   timestamp: Date;
//   model?: string;
// }

// interface MessageThreadProps {
//   messages?: Message[];
//   currentModel?: string;
//   onModelChange?: (model: string) => void;
//   isLoading?: boolean;
//   availableModels?: Array<{ id: string; name: string }>;
//   onReplyWithContext?: (selectedText: string) => void;
//   selectedText?: string;
//   setSelectedText?: (text: string) => void;
//   streamingResponse?: string; // Prop for streaming response
// }

// export const Messages = ({
//   messages = [
//     {
//       id: "1",
//       content: "Hello! How can I help you today?",
//       sender: "ai",
//       timestamp: new Date(),
//       model: "gpt-4",
//     },
//     {
//       id: "2",
//       content: "I need help with a coding problem.",
//       sender: "user",
//       timestamp: new Date(Date.now() - 60000),
//     },
//     {
//       id: "3",
//       content:
//         "Sure, I can help with that. What programming language are you working with and what specific issue are you facing?",
//       sender: "ai",
//       timestamp: new Date(Date.now() - 30000),
//       model: "gpt-4",
//     },
//   ],
//   currentModel = "gpt-4",
//   onModelChange = () => {},
//   isLoading = false,
//   availableModels = [
//     { id: "gpt-4", name: "GPT-4" },
//     { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
//     { id: "claude-3", name: "Claude 3" },
//     { id: "llama-3", name: "Llama 3" },
//   ],
//   selectedText = "",
//   setSelectedText = () => {},
//   onReplyWithContext = () => {},
//   streamingResponse = "",
// }: MessageThreadProps) => {
//   const scrollAreaRef = useRef<HTMLDivElement>(null);
//   const [selectionPosition, setSelectionPosition] = useState<{
//     x: number;
//     y: number;
//   } | null>(null);
  
//   // Added for smooth character rendering
//   const [renderedResponse, setRenderedResponse] = useState("");
//   const streamingTimer = useRef<NodeJS.Timeout | null>(null);
  
//   // Handle smooth rendering of streaming text
//   useEffect(() => {
//     if (streamingTimer.current) {
//       clearTimeout(streamingTimer.current);
//     }
//     if (!isLoading && streamingResponse) {
//       setRenderedResponse(streamingResponse);
//       return;
//     }
//     if (!streamingResponse) {
//       setRenderedResponse("");
//       return;
//     }
//     if (renderedResponse.length < streamingResponse.length) {
//       const charsToAdd = Math.min(
//         5,
//         streamingResponse.length - renderedResponse.length
//       );
//       streamingTimer.current = setTimeout(() => {
//         setRenderedResponse(streamingResponse.substring(0, renderedResponse.length + charsToAdd));
//       }, 10);
//     }
//   }, [streamingResponse, renderedResponse, isLoading]);

//   useEffect(() => {
//     if (scrollAreaRef.current) {
//       const scrollContainer = scrollAreaRef.current.querySelector(
//         "[data-radix-scroll-area-viewport]"
//       );
//       if (scrollContainer) {
//         scrollContainer.scrollTop = scrollContainer.scrollHeight;
//       }
//     }
//   }, [messages, renderedResponse]);

//   const formatTimestamp = (date: Date) => {
//     return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
//   };

//   const getModelIcon = (modelName: string) => {
//     if (modelName.toLowerCase().includes("gpt")) {
//       return <Sparkles className="h-3 w-3 text-accent" />;
//     } else if (modelName.toLowerCase().includes("claude")) {
//       return <Cpu className="h-3 w-3 text-accent" />;
//     } else {
//       return <Bot className="h-3 w-3 text-accent" />;
//     }
//   };

//   const handleSelection = () => {
//     const selection = window.getSelection();
//     if (!selection || selection.toString().trim() === "") {
//       setSelectedText("");
//       setSelectionPosition(null);
//       return;
//     }

//     const selectedStr = selection.toString().trim();
//     if (selectedStr) {
//       const range = selection.getRangeAt(0);
//       const rect = range.getBoundingClientRect();
//       setSelectedText(selectedStr);
//       setSelectionPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
//     }
//   };

//   const handleReplyWithContext = () => {
//     if (selectedText) {
//       onReplyWithContext(selectedText);
//       setSelectedText("");
//       setSelectionPosition(null);
//     }
//   };

//   useEffect(() => {
//     const handleClickOutside = () => {
//       setSelectedText("");
//       setSelectionPosition(null);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   useEffect(() => {
//     document.addEventListener("selectionchange", handleSelection);
//     return () => {
//       document.removeEventListener("selectionchange", handleSelection);
//     };
//   }, []);

//   useEffect(() => {
//     return () => {
//       if (streamingTimer.current) {
//         clearTimeout(streamingTimer.current);
//       }
//     };
//   }, []);

//   return (
//     <div className="flex flex-col h-full bg-background overflow-hidden px-2 sm:px-4">
//       <ScrollArea className="flex-1 p-4 bg-background" ref={scrollAreaRef}>
//         <div className="w-full max-w-[900px] mx-auto">
//           <div className="space-y-6">
//             <AnimatePresence initial={false}>
//               {messages.map((message, index) => (
//                 <motion.div
//                   key={message.id}
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.2, delay: 0.05 * index }}
//                   className={cn(
//                     "flex",
//                     message.sender === "user" ? "justify-end" : "justify-start"
//                   )}
//                 >
//                   <div
//                     className={cn(
//                       "flex gap-3 w-full max-w-[80%]",
//                       message.sender === "user" ? "flex-row-reverse" : "flex-row"
//                     )}
//                   >
//                     <Avatar
//                       className={cn(
//                         "h-9 w-9 shadow-md",
//                         message.sender === "user"
//                           ? "bg-accent ring-2 ring-accent/20"
//                           : "bg-card ring-2 ring-border"
//                       )}
//                     >
//                       {message.sender === "user" ? (
//                         <User className="h-5 w-5 text-accent-foreground" />
//                       ) : (
//                         <Bot className="h-5 w-5 text-accent" />
//                       )}
//                       <AvatarFallback>
//                         {message.sender === "user" ? "U" : "AI"}
//                       </AvatarFallback>
//                     </Avatar>
//                     <div className="flex flex-col">
//                       <div
//                         className={cn(
//                           "rounded-2xl shadow-md w-full overflow-hidden p-4",
//                           message.sender === "user"
//                             ? "bg-accent text-accent-foreground rounded-tr-none"
//                             : "bg-card border border-border/40 text-foreground rounded-tl-none"
//                         )}
//                       >
//                         <div className="leading-8 break-words text-sm">
//                           <LatexText content={message.content} />
//                         </div>
//                       </div>
//                       <div
//                         className={cn(
//                           "flex mt-1.5 text-xs text-muted-foreground",
//                           message.sender === "user" ? "justify-end" : "justify-start"
//                         )}
//                       >
//                         <span>{formatTimestamp(message.timestamp)}</span>
//                         {message.model && message.sender === "ai" && (
//                           <>
//                             <span className="mx-1">•</span>
//                             <Badge
//                               variant="outline"
//                               className="text-xs h-4 px-1.5 bg-accent/20 text-accent-foreground border-accent/30 font-medium"
//                             >
//                               <span className="flex items-center gap-1">
//                                 {getModelIcon(message.model)}
//                                 {availableModels.find(m => m.id === message.model)?.name || message.model}
//                               </span>
//                             </Badge>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </motion.div>
//               ))}
//             </AnimatePresence>

//             <AnimatePresence>
//               {isLoading && (
//                 <motion.div
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0 }}
//                   transition={{ duration: 0.3 }}
//                   className="flex justify-start"
//                 >
//                   <div className="flex gap-3 max-w-[80%]">
//                     <Avatar className="h-9 w-9 bg-card ring-2 ring-border shadow-md">
//                       <Bot className="h-5 w-5 text-accent" />
//                       <AvatarFallback>AI</AvatarFallback>
//                     </Avatar>
//                     <div className="flex flex-col">
//                       <motion.div 
//                         className="rounded-2xl rounded-tl-none p-4 bg-card border border-border/40 text-foreground shadow-md"
//                         layout
//                       >
//                         {streamingResponse ? (
//                           <div className="leading-8 break-words text-sm relative">
//                             <LatexText content={renderedResponse} />
//                             <motion.span 
//                               className="inline-block w-1 h-4 ml-0.5 align-middle cursor-animation"
//                               animate={{ opacity: [0, 1, 0] }}
//                               transition={{ repeat: Infinity, duration: 1 }}
//                               style={{ backgroundColor: 'currentColor' }}
//                             />
//                           </div>
//                         ) : (
//                           <div className="flex space-x-3 text-xl">...
//                           </div>
//                         )}
//                       </motion.div>
//                       <div className="flex mt-1.5 text-xs text-muted-foreground">
//                         <span>{formatTimestamp(new Date())}</span>
//                         <span className="mx-1">•</span>
//                         <Badge
//                           variant="outline"
//                           className="text-xs h-4 px-1.5 bg-accent/20 text-accent-foreground border-accent/30 font-medium"
//                         >
//                           <span className="flex items-center gap-1">
//                             {getModelIcon(currentModel)}
//                             {availableModels.find(m => m.id === currentModel)?.name || currentModel}
//                           </span>
//                         </Badge>
//                       </div>
//                     </div>
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </div>
//         </div>
//       </ScrollArea>
//     </div>
//   );
// };


import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";
import { ScrollArea } from "./ui/ScrollArea";
import { Bot, User, Sparkles, Cpu } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import LatexText from "./Latex";
import { AnimatePresence, motion } from "framer-motion";

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
  availableModels?: Array<{ id: string; name: string }>;
  onReplyWithContext?: (selectedText: string) => void;
  selectedText?: string;
  setSelectedText?: (text: string) => void;
  streamingResponse?: string;
}

export const Messages = ({
  messages = [],
  currentModel = "gpt-4",
  onModelChange = () => {},
  isLoading = false,
  availableModels = [],
  selectedText = "",
  setSelectedText = () => {},
  onReplyWithContext = () => {},
  streamingResponse = "",
}: MessageThreadProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [renderedResponse, setRenderedResponse] = useState("");
  const streamingTimer = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [messages, renderedResponse]);

  const formatTimestamp = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const getModelIcon = (modelName: string) =>
    modelName.toLowerCase().includes("gpt") ? <Sparkles className="h-3 w-3 text-accent" /> :
    modelName.toLowerCase().includes("claude") ? <Cpu className="h-3 w-3 text-accent" /> :
    <Bot className="h-3 w-3 text-accent" />;

  const handleSelection = () => {
    const sel = window.getSelection();
    if (!sel || !sel.toString().trim()) {
      setSelectedText("");
      setSelectionPosition(null);
      return;
    }
    const text = sel.toString().trim();
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelectedText(text);
    setSelectionPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
  };

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, []);

  useEffect(() => {
    () => streamingTimer.current && clearTimeout(streamingTimer.current)
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden px-2 sm:px-4">
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-6 max-w-[900px] mx-auto">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}
              >
                <div className={cn("flex gap-3 max-w-[80%]", msg.sender === "user" ? "flex-row-reverse" : "flex-row")}>
                  <Avatar className={cn("h-9 w-9 shadow-md", msg.sender === "user" ? "bg-accent ring-2 ring-accent/20" : "bg-card ring-2 ring-border")}>
                    {msg.sender === "user" ? <User className="h-5 w-5 text-accent-foreground" /> : <Bot className="h-5 w-5 text-accent" />}
                    <AvatarFallback>{msg.sender === "user" ? "U" : "AI"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className={cn("rounded-2xl p-3 shadow-md overflow-hidden", msg.sender === "user" ? "bg-accent text-accent-foreground rounded-tr-none" : "bg-card border border-border/40 text-foreground rounded-tl-none")}>
                     <div className="leading-8 break-words text-sm">
                         <LatexText content={msg.content} />
                       </div>
                    </div>
                    <div className={cn("flex mt-1.5 text-xs text-muted-foreground", msg.sender === "user" ? "justify-end" : "justify-start")}>
                      <span>{formatTimestamp(msg.timestamp)}</span>
                      {msg.model && msg.sender === "ai" && (
                        <><span className="mx-1">•</span><Badge variant="outline" className="h-4 px-1.5 text-xs bg-accent/20 text-accent-foreground border-accent/30"><span className="flex items-center gap-1">{getModelIcon(msg.model)}{availableModels.find(m => m.id === msg.model)?.name || msg.model}</span></Badge></>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <Avatar className="h-9 w-9 bg-card ring-2 ring-border shadow-md">
                  <Bot className="h-5 w-5 text-accent" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div>
                  <div className="rounded-2xl p-3 bg-card border border-border/40 text-foreground shadow-md text-sm leading-8 break-words">
                    <LatexText content={renderedResponse} />
                    <span className="cursor-animation inline-block w-1 h-4 align-middle" />
                  </div>
                  <div className="flex mt-1.5 text-xs text-muted-foreground">
                    <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="mx-1">•</span>
                    <Badge variant="outline" className="h-4 px-1.5 text-xs bg-accent/20 text-accent-foreground border-accent/30">
                      <span className="flex items-center gap-1">
                        {getModelIcon(currentModel)}
                        {availableModels.find(m => m.id === currentModel)?.name || currentModel}
                      </span>
                    </Badge>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
