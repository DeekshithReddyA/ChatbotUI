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
import { v4 as uuidv4 } from 'uuid';

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
  createdAt: Date;
  updatedAt: Date;
  messages: {
    id: string;
    title: string;
    messages: Message[];
  };
  model: string;
}

interface ChatInterfaceProps {
  conversations: Conversation[];
  models: AIModel[];
  setConversations: any;
  setModels: any;
}

export const ChatInterface = (props: ChatInterfaceProps) => {

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  // Mock data for conversations
//   const [conversations, setConversations] = useState<Conversation[]>([
//     {
//       id: "1",
//       title: "Welcome to TARS Chat",
//       lastMessage:
//         "What about a recipe app that uses AI to suggest meals based on ingredients?",
//       timestamp: new Date("2023-06-15T14:30:00"),
//       model: "gpt-4",
//       messages: [
//         {
//           id: "1-1",
//           content: "What is TARS Chat?",
//           sender: "user",
//           timestamp: new Date("2023-06-15T14:28:00"),
//         },
//         {
//           id: "1-2",
//           content:
//             `### TARS Chat is the all in one AI Chat. 

// 1. **Blazing Fast, Model-Packed.**\n 
//     We're not just fast — we're **2x faster than ChatGPT**, **10x faster than DeepSeek**. With **20+ models** (Claude, DeepSeek, ChatGPT-4o, and more), you'll always have the right AI for the job — and new ones arrive *within hours* of launch.

// 2. **Flexible Payments.**\n
//    Tired of rigid subscriptions? TARS Chat lets you choose *your* way to pay.\n
//    • Just want occasional access? Buy credits that last a full **year**.\n
//    • Want unlimited vibes? Subscribe for **$10/month** and get **2,000+ messages**.

// 3. **No Credit Card? No Problem.**\n
//    Unlike others, we welcome everyone.
//    **UPI, debit cards, net banking, credit cards — all accepted.**
//    Students, you're not locked out anymore.




// Reply here to get started, or click the little "chat" icon up top to make a new chat. Or you can [check out the FAQ](/chat/faq)`,
//           sender: "ai",
//           timestamp: new Date("2023-06-15T14:29:00"),
//           model: "gpt-4",
//         },
        
//       ],
//     },
//   ]);


  const [activeConversation, setActiveConversation] = useState<string>(
    props.conversations[0].id,
  );
  
  // New state variable to track if we're awaiting the first message in a new conversation
  const [awaitingFirstMessage, setAwaitingFirstMessage] = useState(false);
  // Temporary conversation ID to use before backend sync
  const [tempConversationId, setTempConversationId] = useState<string | null>(null);

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

  // Has to be converted to request models along with the user data.
  // Next task 
  useEffect(() => {
    const fetchModels = async () => {
      const response = await axios.get(`${BACKEND_URL}/api/models`,{
        headers: {
          'userId': `${localStorage.getItem('userId')}`,
        },
      });
      const data = response.data;
      setModels(data);
    };
    fetchModels();
  }, []);

  // Find the current active conversation
  const currentConversation = awaitingFirstMessage 
    ? null
    : props.conversations.find((conv) => conv.id === activeConversation) ||
      props.conversations[0];

  console.log("Current conversation: ", currentConversation);

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

  // Generate a title from the user's message (3-4 words)
  const generateTitleFromMessage = (message: string) => {
    // Remove any non-alphanumeric characters and split into words
    const words = message.replace(/[^\w\s]/gi, '').split(/\s+/);
    
    // Take up to 4 words for the title
    const titleWords = words.slice(0, 4);
    
    // If the result is empty or too short, use a default title
    if (titleWords.length === 0) {
      return "New Conversation";
    }
    
    return titleWords.join(' ');
  };

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

    // Handle first message in a new conversation
    if (awaitingFirstMessage) {
      // Generate a temporary ID for the new conversation
      const tempId = tempConversationId || uuidv4();
      
      // Create a title from the first few words of the message
      const title = generateTitleFromMessage(messageContent);
      
      // Create the message
      const newMessage: Message = {
        id: `${tempId}-1`,
        content: messageContent,
        sender: "user",
        timestamp: new Date(),
      };
      
      // Create a temporary conversation
      const newConversation: Conversation = {
        id: tempId,
        title: title,
        lastMessage: messageContent,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: {
          id: tempId,
          title: title,
          messages: [newMessage]
        },
        model: "gpt-4o", // Default model
      };
      
      // Update conversations and set this as active
      props.setConversations([newConversation, ...props.conversations]);
      setActiveConversation(tempId);
      
      // No longer awaiting first message
      setAwaitingFirstMessage(false);
      setTempConversationId(null);
      
      // Reset AI response
      setAiResponse("");
      
      // Show loading state
      setIsLoading(true);
      
      try {
        // Create an array of messages for the API
        const messagesForAPI = [{
          role: "user",
          content: messageContent
        }];
        
        // Create a new SSE connection for a new conversation
        streamSource.current = new SSE("http://localhost:3000/api/chat", {
          headers: {
            "Content-Type": "application/json",
            // Don't pass conversationId for new conversations yet, as it doesn't exist on backend
          },
          payload: JSON.stringify({
            messages: messagesForAPI,
            model: "gpt-4o" // Default model for new conversations
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
              id: `${tempId}-2`,
              content: accumulatedResponse,
              sender: "ai",
              timestamp: new Date(),
              model: "gpt-4o",
            };
            
            // Update the conversation with AI response
            props.setConversations((prevConversations: Conversation[]) => 
              prevConversations.map(conv => {
                if (conv.id === tempId) {
                  return {
                    ...conv,
                    messages: {
                      ...conv.messages,
                      messages: [...conv.messages.messages, aiMessageObj]
                    },
                    lastMessage: accumulatedResponse.substring(0, 50) + (accumulatedResponse.length > 50 ? "..." : ""),
                    timestamp: new Date(),
                  };
                }
                return conv;
              })
            );
            
            // Create the conversation in the backend
            axios.post(`${BACKEND_URL}/api/convo/create`, {
              userId: localStorage.getItem('userId'),
              title: title,
              firstMessage: messageContent,
              aiResponse: accumulatedResponse,
              model: "gpt-4o"
            })
              .then(response => {
                // Update the conversation with the real ID from backend
                const { id: backendId } = response.data;
                console.log(`Conversation created on backend with ID: ${backendId}`);
                if (backendId && backendId !== tempId) {
                  props.setConversations((prevConversations: Conversation[]) => 
                    prevConversations.map(conv => {
                      if (conv.id === tempId) {
                        return {
                          ...conv,
                          id: backendId,
                          messages: {
                            ...conv.messages,
                            id: backendId
                          }
                        };
                      }
                      return conv;
                    })
                  );
                  setActiveConversation(backendId);
                }
              })
              .catch(error => {
                console.error("Error creating conversation in backend:", error);
              });
            
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
          
          // If error occurs with first message, reset state
          if (awaitingFirstMessage) {
            setAwaitingFirstMessage(false);
            setTempConversationId(null);
          }
        });
        
        streamSource.current.stream();
      } catch (error) {
        console.error("Error sending message:", error);
        setIsLoading(false);
        
        // If error occurs with first message, reset state
        if (awaitingFirstMessage) {
          setAwaitingFirstMessage(false);
          setTempConversationId(null);
        }
      }
      
      return;
    }

    // Regular message handling for existing conversations
    if (!currentConversation) {
      console.error("Cannot send message: No active conversation");
      return;
    }

    const newMessage: Message = {
      id: `${currentConversation.id}-${currentConversation.messages.messages.length + 1}`,
      content: messageContent,
      sender: "user",
      timestamp: new Date(),
    };

    // Update the conversation with the user message
    const updatedConversationsWithUserMessage = props.conversations.map((conv) => {
      if (conv.id === activeConversation) {
        return {
          ...conv,
          messages: {
            ...conv.messages,
            messages: [...conv.messages.messages, newMessage]
          },
          lastMessage: messageContent,
          timestamp: new Date(),
        };
      }
      return conv;
    });
    props.setConversations(updatedConversationsWithUserMessage);

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
      const messagesForAPI = currentConversation.messages.messages.map(msg => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content
      }));
      
      // Add the new user message
      messagesForAPI.push({
        role: "user",
        content: messageContent
      });

      // Create a new SSE connection for existing conversation
      streamSource.current = new SSE("http://localhost:3000/api/chat", {
        headers: {
          "Content-Type": "application/json",
          "conversationid": currentConversation.id, // Pass the conversation ID
          "userid": localStorage.getItem('userId') || '' // Also pass the user ID
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
            id: `${currentConversation.id}-${currentConversation.messages.messages.length + 2}`,
            content: accumulatedResponse,
            sender: "ai",
            timestamp: new Date(),
            model: currentConversation.model,
          };

          props.setConversations((prevConversations: Conversation[]) => 
            prevConversations.map(conv => {
              if (conv.id === activeConversation) {
                return {
                  ...conv,
                  messages: {
                    ...conv.messages,
                    messages: [...conv.messages.messages, aiMessageObj]
                  },
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

  const handleNewConversation = async () => {
    // Instead of creating a conversation immediately, set the state to await first message
    setAwaitingFirstMessage(true);
    
    // Generate a temporary ID for reference
    const tempId = uuidv4();
    setTempConversationId(tempId);
    
    // Clear active conversation selection
    setActiveConversation("");
  };

  // Handle selecting a conversation
  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
  };

  const handleDeleteConversation = (id: string) => {
    const filteredConversations = props.conversations.filter(
      (conv) => conv.id !== id,
    );
    props.setConversations(filteredConversations);
    if (
      activeConversation === id &&
      filteredConversations.length > 0
    ) {
      setActiveConversation(filteredConversations[0].id);
    }
  }

  // Handle changing the model for the current conversation
  const handleModelChange = (modelId: string) => {
    const updatedConversations = props.conversations.map((conv) => {
      if (conv.id === activeConversation) {
        return {
          ...conv,
          model: modelId,
        };
      }
      return conv;
    });

    props.setConversations(updatedConversations);
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
          conversations={props.conversations.map((conv) => ({
            id: conv.id,
            title: conv.title,
            date: conv.updatedAt.toLocaleDateString,
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
          {!awaitingFirstMessage ? (
            <Messages
              messages={currentConversation?.messages.messages || []}
              currentModel={currentConversation?.model || "gpt-4o"}
              models={models}
              onModelChange={handleModelChange}
              isLoading={isLoading}
              selectedText={selectedText}
              setSelectedText={setSelectedText}
              streamingResponse={aiResponse}
              onReplyWithContext={handleReplyWithContext}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h3 className="text-xl font-medium mb-2">New Conversation</h3>
              <p className="text-muted-foreground max-w-md">
                Type your first message below to start a new conversation
              </p>
            </div>
          )}
        </div>
        <MessageInput
          selectedContext={selectedText}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          placeholder={awaitingFirstMessage ? "Type your first message..." : "Type a message or ask a question..."}
        />
      </div>
    </div>
  );
};