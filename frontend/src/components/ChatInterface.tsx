import { useRef, useState, useEffect } from "react";
import { ConversationSidebar } from "./ConversationSidebar"
import MessageInput from "./MessageInput";
import { Messages } from "./Messages";
import ModelSelector from "./ModelSelection";
import { SSE } from "sse.js";
import { Menu as MenuIcon } from "lucide-react";
import { Button } from "./ui/Button";
import { AIModel } from "../types/AIModel";
import axios from "axios";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  model?: string;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
  model: string;
}

export const ChatInterface = () => {
  // Mock data for conversations
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "Welcome to TARS Chat",
      lastMessage:
        "What about a recipe app that uses AI to suggest meals based on ingredients?",
      timestamp: new Date("2023-06-15T14:30:00"),
      model: "gpt-4",
      messages: [
        {
          id: "1-1",
          content: "What is TARS Chat?",
          sender: "user",
          timestamp: new Date("2023-06-15T14:28:00"),
        },
        {
          id: "1-2",
          content:
            `### TARS Chat is the all in one AI Chat. 

1. **Blazing Fast, Model-Packed.**\n 
    We're not just fast — we're **2x faster than ChatGPT**, **10x faster than DeepSeek**. With **20+ models** (Claude, DeepSeek, ChatGPT-4o, and more), you'll always have the right AI for the job — and new ones arrive *within hours* of launch.

2. **Flexible Payments.**\n
   Tired of rigid subscriptions? TARS Chat lets you choose *your* way to pay.\n
   • Just want occasional access? Buy credits that last a full **year**.\n
   • Want unlimited vibes? Subscribe for **$10/month** and get **2,000+ messages**.

3. **No Credit Card? No Problem.**\n
   Unlike others, we welcome everyone.
   **UPI, debit cards, net banking, credit cards — all accepted.**
   Students, you're not locked out anymore.




Reply here to get started, or click the little "chat" icon up top to make a new chat. Or you can [check out the FAQ](/chat/faq)`,
          sender: "ai",
          timestamp: new Date("2023-06-15T14:29:00"),
          model: "gpt-4",
        },
        
      ],
    },
  ]);


  const [activeConversation, setActiveConversation] = useState<string>(
    conversations[0].id,
  );

  const [models, setModels] = useState<AIModel[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedText, setSelectedText] = useState<string>("");
  const [aiResponse, setAiResponse] = useState("");
  
  // Stream control state
  const [streamPaused, setStreamPaused] = useState(false);
  const streamSource = useRef<SSE | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Check screen size on initial render and when window resizes
  useEffect(() => {
    const checkScreenSize = () => {
      // Close sidebar by default on mobile screens
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    // Set initial state
    checkScreenSize();
    
    // Add listener for window resize
    window.addEventListener('resize', checkScreenSize);
    
    // Clean up
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const fetchModels = async () => {
      const response = await axios.get('http://localhost:3000/api/models');
      const data = response.data;
      setModels(data);
    };
    fetchModels();
  }, []);

  // Find the current active conversation
  const currentConversation =
    conversations.find((conv) => conv.id === activeConversation) ||
    conversations[0];

  // Improved SSE handling with proper cleanup
  useEffect(() => {
    return () => {
      // Cleanup function to close SSE connection when component unmounts
      if (streamSource.current) {
        streamSource.current.close();
        streamSource.current = null;
      }
    };
  }, []);

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;

    // Create message content with file information if present
    let messageContent = content;
    if (files && files.length > 0) {
      const fileNames = files.map((file) => file.name).join(", ");
      messageContent = content.trim()
        ? `${content}\n\n[Attached: ${fileNames}]`
        : `[Attached: ${fileNames}]`;
    }

    const newMessage: Message = {
      id: `${currentConversation.id}-${currentConversation.messages.length + 1}`,
      content: messageContent,
      sender: "user",
      timestamp: new Date(),
    };

    // Update the conversation with the user message
    const updatedConversationsWithUserMessage = conversations.map((conv) => {
      if (conv.id === activeConversation) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessage: messageContent,
          timestamp: new Date(),
        };
      }
      return conv;
    });
    setConversations(updatedConversationsWithUserMessage);

    // Reset AI response
    setAiResponse("");
    
    // Show loading state
    setIsLoading(true);

    try {
      // Clean up any existing SSE connection
      if (streamSource.current) {
        streamSource.current.close();
        streamSource.current = null;
      }

      // Create an array of messages for the API
      const messagesForAPI = currentConversation.messages.map(msg => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content
      }));
      
      // Add the new user message
      messagesForAPI.push({
        role: "user",
        content: messageContent
      });

      // Create a new SSE connection
      streamSource.current = new SSE("http://localhost:3000/api/chat", {
        headers: {
          "Content-Type": "application/json",
        },
        payload: JSON.stringify({
          messages: messagesForAPI,
          model: currentConversation.model
        }),
        method: "POST",
      });

      let accumulatedResponse = "";
      
      streamSource.current.addEventListener("message", (e: any) => {
        if (e.data === "[DONE]") {
          if (streamSource.current) {
            streamSource.current.close();
            streamSource.current = null;
          }
          
          // Add AI response to conversation only after streaming is complete
          const aiMessageObj: Message = {
            id: `${currentConversation.id}-${currentConversation.messages.length + 2}`,
            content: accumulatedResponse,
            sender: "ai",
            timestamp: new Date(),
            model: currentConversation.model,
          };

          setConversations(prevConversations => 
            prevConversations.map(conv => {
              if (conv.id === activeConversation) {
                return {
                  ...conv,
                  messages: [...conv.messages, aiMessageObj],
                  lastMessage: accumulatedResponse.substring(0, 50) + (accumulatedResponse.length > 50 ? "..." : ""),
                  timestamp: new Date(),
                };
              }
              return conv;
            })
          );
          
          setIsLoading(false);
          setAiResponse("");
          return;
        }

        if (streamPaused) return;

        try {
          // Parse the event data as JSON
          const parsed = JSON.parse(e.data);
          const delta = parsed.choices?.[0]?.delta?.content || "";
          
          if (delta) {
            accumulatedResponse += delta;
            setAiResponse(accumulatedResponse);
          }
        } catch (err) {
          console.error("Error parsing SSE message:", err);
        }
      });

      streamSource.current.addEventListener("error", (e: any) => {
        console.error("SSE error:", e);
        if (streamSource.current) {
          streamSource.current.close();
          streamSource.current = null;
        }
        setIsLoading(false);
      });

      streamSource.current.stream();
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: `${conversations.length + 1}`,
      title: `New Conversation ${conversations.length + 1}`,
      lastMessage: "",
      timestamp: new Date(),
      messages: [],
      model: "gpt-4o", // Default model
    };

    setConversations([newConversation, ...conversations]);
    setActiveConversation(newConversation.id);
  };

  // Handle selecting a conversation
  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
  };

  const handleDeleteConversation = (id: string) => {
    const filteredConversations = conversations.filter(
      (conv) => conv.id !== id,
    );
    setConversations(filteredConversations);
    if (
      activeConversation === id &&
      filteredConversations.length > 0
    ) {
      setActiveConversation(filteredConversations[0].id);
    }
  }

  // Handle changing the model for the current conversation
  const handleModelChange = (modelId: string) => {
    const updatedConversations = conversations.map((conv) => {
      if (conv.id === activeConversation) {
        return {
          ...conv,
          model: modelId,
        };
      }
      return conv;
    });

    setConversations(updatedConversations);
  };
  
  // Cancel streaming response
  const cancelStreaming = () => {
    if (streamSource.current) {
      streamSource.current.close();
      streamSource.current = null;
      setIsLoading(false);
    }
  };

  // Pause/resume streaming
  const toggleStreamPause = () => {
    setStreamPaused(!streamPaused);
  };

  // Handle reply with selected text context
  const handleReplyWithContext = (text: string) => {
    if (!text.trim()) return;
    
    // Create a contextual prompt with the selected text
    const contextPrompt = `Regarding this: "${text}"\n\n`;
    
    // Clear the selected text after using it
    setSelectedText("");
    
    // Focus the input or automatically start a reply with the context
    handleSendMessage(contextPrompt);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden" 
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      <div className={`fixed md:relative z-20 h-full transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden'}`}>
        <ConversationSidebar 
          conversations={conversations.map((conv) => ({
            id: conv.id,
            title: conv.title,
            date: conv.timestamp.toLocaleDateString(),
            model: conv.model,
            selected: conv.id === activeConversation
          }))}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
          onCloseSidebar={toggleSidebar}
          onDeleteConversation={handleDeleteConversation}
          activeConversation={activeConversation}
        />
      </div>
      <div className="flex flex-col flex-1 h-full p-1 bg-background">
        <div className="flex items-center mb-2">
          <Button 
            onClick={toggleSidebar}
            variant="ghost" 
            size="icon"
            className="mr-2 text-muted-foreground hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            <MenuIcon size={20} />
          </Button>
          <ModelSelector 
            models={models}
            setModels={setModels}
          />
        </div>
        <div className="flex-1 overflow-hidden mb-4">
          <Messages
            messages={currentConversation.messages}
            currentModel={currentConversation.model}
            models={models}
            onModelChange={handleModelChange}
            isLoading={isLoading}
            selectedText={selectedText}
            setSelectedText={setSelectedText}
            streamingResponse={aiResponse}
            onReplyWithContext={handleReplyWithContext}
          />
        </div>
        <MessageInput
        selectedContext={selectedText}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        placeholder="Type a message or ask a question..."
      />
    </div>
  </div>
);
};