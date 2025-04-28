import { useState } from "react";
import { ConversationSidebar } from "./ConversationSidebar"
import MessageInput from "./MessageInput";
import { Messages } from "./Messages";
import ModelSelector from "./ModelSelection";
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
      title: "Project Ideas",
      lastMessage:
        "What about a recipe app that uses AI to suggest meals based on ingredients?",
      timestamp: new Date("2023-06-15T14:30:00"),
      model: "gpt-4",
      messages: [
        {
          id: "1-1",
          content: "I need some project ideas for a portfolio.",
          sender: "user",
          timestamp: new Date("2023-06-15T14:28:00"),
        },
        {
          id: "1-2",
          content:
            "Here are some project ideas: \n\n1. A personal finance tracker that helps users manage expenses and set savings goals\n\n2. A weather app with historical data visualization and trend analysis\n\n3. A recipe app that uses AI to suggest meals based on ingredients you have at home",
          sender: "ai",
          timestamp: new Date("2023-06-15T14:29:00"),
          model: "gpt-4",
        },
        {
          id: "1-3",
          content:
            "What about a recipe app that uses AI to suggest meals based on ingredients?",
          sender: "user",
          timestamp: new Date("2023-06-15T14:30:00"),
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
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedText, setSelectedText] = useState<string>("");

  // Find the current active conversation
  const currentConversation =
    conversations.find((conv) => conv.id === activeConversation) ||
    conversations[0];
    
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

        // Update the conversation with the user message first
        const updatedConversationsWithUserMessage = conversations.map((conv) => {
          if (conv.id === activeConversation) {
            return {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: content,
              timestamp: new Date(),
            };
          }
          return conv;
        });
        setConversations(updatedConversationsWithUserMessage);
    
        // Show loading state
        setIsLoading(true);


        console.log("Sending message:", newMessage);

        const response = await axios.post("http://localhost:3000/api/message", newMessage);

        console.log(response);
    
    
    
        // Simulate AI response with a delay
          // Mock AI response
          const aiResponse: Message = {
            id: `${currentConversation.id}-${currentConversation.messages.length + 2}`,
            content: `${response.data.response}`,
            sender: "ai",
            timestamp: new Date(),
            model: currentConversation.model,
          };
    
          // Update the conversation with AI response
          const updatedConversationsWithAIResponse = conversations.map((conv) => {
            if (conv.id === activeConversation) {
              return {
                ...conv,
                messages: [...conv.messages, newMessage, aiResponse],
                lastMessage: content,
                timestamp: new Date(),
              };
            }
            return conv;
          });
    
          setConversations(updatedConversationsWithAIResponse);
          setIsLoading(false);

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
    return (
        <div className="flex h-screen bg-background text-foreground">
            <ConversationSidebar />
            <div className="flex flex-col flex-1 h-full p-1 bg-background">
                <div className="flex-1 overflow-hidden mb-4">
                    <ModelSelector />
                    <Messages 
                        messages={currentConversation.messages}
                        currentModel={currentConversation.model}
                        availableModels={availableModels}
                        onModelChange={handleModelChange}
                        isLoading={isLoading}
                        selectedText={selectedText}
                        setSelectedText={setSelectedText}/>
                </div>

                <MessageInput 
                    selectedContext={selectedText}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    placeholder="Type a message or ask a question..."/>
            </div>
        </div>
    )
}