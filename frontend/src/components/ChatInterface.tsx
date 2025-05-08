import { useRef, useState, useEffect } from "react";
import { ConversationSidebar } from "./ConversationSidebar"
import MessageInput from "./MessageInput";
import { Messages } from "./Messages";
import ModelSelector from "./ModelSelection";
import { SSE } from "sse.js";

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
    We’re not just fast — we’re **2x faster than ChatGPT**, **10x faster than DeepSeek**. With **20+ models** (Claude, DeepSeek, ChatGPT-4o, and more), you’ll always have the right AI for the job — and new ones arrive *within hours* of launch.

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
    {
      id: "2",
      title: "Travel Planning",
      lastMessage: "Thanks for the recommendations!",
      timestamp: new Date("2023-06-14T09:45:00"),
      model: "claude-3",
      messages: [
        {
          id: "2-1",
          content: "I'm planning a trip to Japan. Any recommendations?",
          sender: "user",
          timestamp: new Date("2023-06-14T09:42:00"),
        },
        {
          id: "2-2",
          content:
            "Japan is a wonderful destination! Here are some recommendations:\n\n🏙️ **Tokyo**\n- Explore Shibuya and see the famous crossing\n- Visit Senso-ji Temple in Asakusa\n- Experience the vibrant nightlife in Shinjuku\n\n🏯 **Kyoto**\n- See the iconic Fushimi Inari Shrine with thousands of torii gates\n- Visit the bamboo forest in Arashiyama\n- Experience a traditional tea ceremony\n\n🍜 **Must-try foods**\n- Fresh sushi at Tsukiji Outer Market\n- Authentic ramen in local shops\n- Takoyaki (octopus balls) as street food\n- Okonomiyaki (savory pancake)\n\nWould you like more specific recommendations based on your interests?",
          sender: "ai",
          timestamp: new Date("2023-06-14T09:44:00"),
          model: "claude-3",
        },
        {
          id: "2-3",
          content: "Thanks for the recommendations!",
          sender: "user",
          timestamp: new Date("2023-06-14T09:45:00"),
        },
      ],
    },
    {
      id: "3",
      title: "Learning React Hooks",
      lastMessage: "I'll try implementing useContext in my app.",
      timestamp: new Date("2023-06-13T16:45:00"),
      model: "gpt-3.5-turbo",
      messages: [
        {
          id: "3-1",
          content: "Can you explain React hooks to me? I'm new to React.",
          sender: "user",
          timestamp: new Date("2023-06-13T16:40:00"),
        },
        {
          id: "3-2",
          content:
            "React Hooks are functions that let you use state and other React features without writing a class component. Here are the most common hooks:\n\n**useState**\nManages state in functional components:\n```jsx\nconst [count, setCount] = useState(0);\n```\n\n**useEffect**\nHandles side effects like data fetching, subscriptions, or DOM manipulation:\n```jsx\nuseEffect(() => {\n  document.title = `You clicked ${count} times`;\n}, [count]); // Only re-run if count changes\n```\n\n**useContext**\nAccesses context without nesting components:\n```jsx\nconst theme = useContext(ThemeContext);\n```\n\n**useRef**\nCreates a mutable reference that persists across renders:\n```jsx\nconst inputRef = useRef(null);\n```\n\nWould you like me to explain any specific hook in more detail?",
          sender: "ai",
          timestamp: new Date("2023-06-13T16:43:00"),
          model: "gpt-3.5-turbo",
        },
        {
          id: "3-3",
          content: "I'll try implementing useContext in my app.",
          sender: "user",
          timestamp: new Date("2023-06-13T16:45:00"),
        },
      ],
    },
  ]);

  const [activeConversation, setActiveConversation] = useState<string>(
    conversations[0].id,
  );
  const [availableModels, setAvailableModels] = useState([
    { id: "gpt-4", name: "GPT-4" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
    { id: "claude-3", name: "Claude 3" },
    { id: "llama-3", name: "Llama 3" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedText, setSelectedText] = useState<string>("");
  const [aiResponse, setAiResponse] = useState("");
  
  // Stream control state
  const [streamPaused, setStreamPaused] = useState(false);
  const streamSource = useRef<SSE | null>(null);

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
    // Implement how you want to use the selected text
    // For example, you could:
    const contextPrompt = `Regarding this text: "${text}"\n\n`;
    // And then focus the input or auto-fill it with the context
    console.log("Replying with context:", contextPrompt);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <ConversationSidebar 
        conversations={conversations}
      />
      <div className="flex flex-col flex-1 h-full p-1 bg-background">
        <div className="flex-1 overflow-hidden mb-4">
          <ModelSelector 
          />
          <Messages
            messages={currentConversation.messages}
            currentModel={currentConversation.model}
            availableModels={availableModels}
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