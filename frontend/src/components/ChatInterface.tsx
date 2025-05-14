import { useRef, useState, useEffect, useMemo, useCallback } from "react";
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
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  content: string | any[]; // Allow either string or array of content parts
  sender: "user" | "ai";
  timestamp: Date;
  model?: string;
  stopped?: boolean; // Indicates if response streaming was stopped early
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
  onDeleteConversation?: (id: string) => void;
  onSelectConversation?: (id: string) => void;
  onNewConversation?: () => void;
  activeConversationId?: string;
  isLandingPage?: boolean;
}

export const ChatInterface = (props: ChatInterfaceProps) => {

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  // State for conversation pagination
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const [activeConversation, setActiveConversation] = useState<string>(
    props.activeConversationId || (props.conversations.length > 0 ? props.conversations[0].id : "")
  );
  
  useEffect(() => {
    // Update active conversation when prop changes
    if (props.activeConversationId) {
      setActiveConversation(props.activeConversationId);
    }
  }, [props.activeConversationId]);
  
  // New state variable to track if we're awaiting the first message in a new conversation
  const [awaitingFirstMessage, setAwaitingFirstMessage] = useState(props.isLandingPage || false);
  // Temporary conversation ID to use before backend sync
  const [tempConversationId, setTempConversationId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedText, setSelectedText] = useState<string>("");
  const [aiResponse, setAiResponse] = useState("");
  
  // Stream control state
  const [streamPaused, setStreamPaused] = useState(false);
  const streamSource = useRef<SSE | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // For loading a specific conversation
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

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

  // Memoize the current conversation to reduce re-renders
  const currentConversation = useMemo(() => {
    return props.conversations.find((conv) => conv.id === activeConversation);
  }, [props.conversations, activeConversation]);

  // Memoize formatted conversation data for sidebar
  const sidebarConversations = useMemo(() => {
    return props.conversations.map((conv) => ({
      id: conv.id,
      title: conv.title || 'Untitled Conversation',
      date: conv.updatedAt ? conv.updatedAt.toLocaleDateString : '',
      model: conv.model || 'gpt-4o',
      selected: conv.id === activeConversation,
      lastMessage: conv.lastMessage || ''
    }));
  }, [props.conversations, activeConversation]);

  // Cancel streaming response
  const cancelStreaming = useCallback(() => {
    if (streamSource.current) {
      streamSource.current.close();
      streamSource.current = null;
      setIsLoading(false);
    }
  }, []);

  // Memoized callback for creating a new conversation
  const handleNewConversation = useCallback(() => {
    cancelStreaming();
    
    // Reset active state
    setActiveConversation("");
    setAwaitingFirstMessage(true);
    
    // If external handler provided, use it
    if (props.onNewConversation) {
      props.onNewConversation();
    } else {
      navigate('/');
    }
  }, [cancelStreaming, props.onNewConversation, navigate]);

  // Memoized callback for selecting a conversation
  const handleSelectConversation = useCallback((id: string) => {
    setIsLoadingConversation(true);
    
    // Skip loading if we're already on this conversation
    if (id === activeConversation) {
      setIsLoadingConversation(false);
      return;
    }
    
    setActiveConversation(id);
    
    // Let external handler know of the selection if provided
    if (props.onSelectConversation) {
      props.onSelectConversation(id);
    } else {
      // Direct navigation
      navigate(`/chat/${id}`);
    }
    
    // Reset loading state after a short delay
    setTimeout(() => {
      setIsLoadingConversation(false);
    }, 300);
  }, [activeConversation, props.onSelectConversation, navigate]);

  // Memoized callback for deleting a conversation
  const handleDeleteConversation = useCallback((id: string) => {
    // If an external handler is provided, use it
    if (props.onDeleteConversation) {
      props.onDeleteConversation(id);
      
      // Reset active state after deletion if this was the active conversation
      if (activeConversation === id) {
        setActiveConversation("");
        setAwaitingFirstMessage(true);
      }
      return;
    }
    
    // Otherwise use the internal implementation
    // Optimistically remove from UI
    const filteredConversations = props.conversations.filter(
      (conv) => conv.id !== id,
    );
    props.setConversations(filteredConversations);
    
    // Set active conversation to another one if the deleted was active
    if (activeConversation === id) {
      if (filteredConversations.length > 0) {
        const newActiveId = filteredConversations[0].id;
        setActiveConversation(newActiveId);
        navigate(`/chat/${newActiveId}`);
      } else {
        setAwaitingFirstMessage(true);
        setActiveConversation("");
        navigate('/');
      }
    }
    
    // Make API call to delete the conversation on the server
    axios.delete(`${BACKEND_URL}/api/convo/${id}`, {
      headers: {
        'userId': localStorage.getItem('userId'),
      }
    })
    .then(response => {
      console.log(`Conversation ${id} successfully deleted on server`);
    })
    .catch(error => {
      console.error(`Error deleting conversation ${id} on server:`, error);
      // If there's an error, revert the UI change by reloading the conversations
      axios.get(`${BACKEND_URL}/api/convo/list`, {
        headers: {
          'userId': localStorage.getItem('userId'),
        }
      })
      .then(response => {
        props.setConversations(response.data);
        
        // Re-evaluate the active conversation after reloading
        if (activeConversation === id && response.data.length > 0) {
          const newActiveId = response.data[0].id;
          setActiveConversation(newActiveId);
          navigate(`/chat/${newActiveId}`);
        }
      })
      .catch(listError => {
        console.error("Error reloading conversations:", listError);
      });
    });
  }, [activeConversation, BACKEND_URL, navigate, props]);

  // Memoized callback for loading more conversations
  const loadMoreConversations = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await axios.get(`${BACKEND_URL}/api/convo/list?page=${nextPage}&limit=10`, {
        headers: { 'userId': userId }
      });
      
      const newConversations = response.data;
      if (newConversations && newConversations.length > 0) {
        props.setConversations((prevConversations: Conversation[]) => {
          // Combine existing and new conversations
          const combined = [...prevConversations, ...newConversations];
          // Sort by updatedAt in descending order
          return combined.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more conversations:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, page, BACKEND_URL, props]);

  // Function to load a specific conversation's messages
  const loadConversationMessages = async (conversationId: string) => {
    if (!conversationId) return;
    
    // Check if we already have the conversation with messages loaded
    const existingConvo = props.conversations.find(c => c.id === conversationId);
    if (existingConvo && existingConvo.messages && existingConvo.messages.messages.length > 0) {
      // Already loaded
      return;
    }
    
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    setIsLoadingConversation(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/convo/${conversationId}`, {
        headers: { 'userId': userId }
      });
      
      if (response.data) {
        // Update the conversation in the list with the fetched messages
        props.setConversations((prevConversations: Conversation[]) => 
          prevConversations.map(conv => 
            conv.id === conversationId ? response.data : conv
          )
        );
      }
    } catch (error) {
      console.error(`Error loading conversation ${conversationId}:`, error);
      
      // Try to retrieve from localStorage as a fallback
      try {
        const savedConvo = localStorage.getItem(`convo_${conversationId}`);
        if (savedConvo) {
          const convoData = JSON.parse(savedConvo);
          console.log("Retrieving conversation data from localStorage:", convoData);
          
          // If we have an existing conversation record but no messages, add the messages from localStorage
          const existingConvo = props.conversations.find(c => c.id === conversationId);
          if (existingConvo) {
            props.setConversations((prevConversations: Conversation[]) => 
              prevConversations.map(conv => {
                if (conv.id === conversationId) {
                  return {
                    ...conv,
                    messages: {
                      id: conversationId,
                      title: conv.title,
                      messages: convoData.messages || []
                    }
                  };
                }
                return conv;
              })
            );
          }
        }
      } catch (localStorageError) {
        console.error("Error retrieving from localStorage:", localStorageError);
      }
    } finally {
      setIsLoadingConversation(false);
    }
  };

  // Load conversation messages when active conversation changes
  useEffect(() => {
    if (activeConversation && !awaitingFirstMessage) {
      loadConversationMessages(activeConversation);
    }
  }, [activeConversation]);

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

  // Function to check if a model supports image/file inputs
  const supportsMultimodal = (modelId: string) => {
    // Models that don't support images
    const incompatibleModels = ['gpt-4', 'o3-mini', 'o3', 'o4-mini', 'o1-preview'];
    return !incompatibleModels.includes(modelId);
  };

  // Function to convert a file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Function to resize and compress an image before upload
  const optimizeImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round(height * maxWidth / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round(width * maxHeight / height);
              height = maxHeight;
            }
          }
          
          // Create canvas and resize
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress image
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression
          const dataUrl = canvas.toDataURL(file.type, quality);
          resolve(dataUrl);
        };
        
        img.onerror = () => {
          reject(new Error('Error loading image'));
        };
      };
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
    });
  };

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;

    let messageContent: string | any[] = content;
    
    // Handle files if present and convert to multimodal format
    if (files && files.length > 0) {
      const messageContentParts: any[] = [];
      
      // Add text content if provided
      if (content.trim()) {
        messageContentParts.push({ type: 'text', text: content });
      }
      
      // Process files and add them to content parts
      const selectedModel = currentConversation?.model || "gpt-4o";
      const isMultimodalSupported = supportsMultimodal(selectedModel);
      
      try {
        // Check if model supports multimodal
        if (isMultimodalSupported) {
          // Process each file
          for (const file of files) {
            let base64Data;
            
            if (file.type.startsWith('image/')) {
              // Optimize and resize images to avoid "request entity too large" errors
              try {
                base64Data = await optimizeImage(file, 1200, 1200, 0.7);
              } catch (error) {
                console.error("Error optimizing image:", error);
                // Fallback to regular conversion if optimization fails
                base64Data = await fileToBase64(file);
              }
              
              // Handle image files
              messageContentParts.push({
                type: 'image',
                image: base64Data
              });
            } else {
              // For non-image files, limit size to 5MB to prevent payload issues
              if (file.size > 5 * 1024 * 1024) {
                console.warn(`File ${file.name} is too large (${Math.round(file.size/1024/1024)}MB), max size is 5MB`);
                const fileErrorMessage = `[Error: File ${file.name} exceeds maximum size of 5MB]`;
                if (messageContentParts.length > 0 && messageContentParts[0].type === 'text') {
                  messageContentParts[0].text += `\n\n${fileErrorMessage}`;
                } else {
                  messageContentParts.unshift({ type: 'text', text: fileErrorMessage });
                }
                continue;
              }
              
              // Handle other file types
              base64Data = await fileToBase64(file);
              messageContentParts.push({
                type: 'file',
                mimeType: file.type,
                data: base64Data,
                filename: file.name
              });
            }
          }
          
          // Update the message content to use the parts array
          messageContent = messageContentParts;
        } else {
          // If model doesn't support files, just append file names to the text
          const fileNames = files.map(file => file.name).join(", ");
          const fileDescription = `[Note: Attached files (${fileNames}) couldn't be processed with the selected model. Please switch to a multimodal model like gpt-4o to view images.]`;
          
          if (content.trim()) {
            messageContent = `${content}\n\n${fileDescription}`;
          } else {
            messageContent = fileDescription;
          }
        }
      } catch (error) {
        console.error("Error processing files:", error);
        // Fallback to text-only if there's an error with files
        const fileNames = files.map(file => file.name).join(", ");
        messageContent = content.trim() 
          ? `${content}\n\n[Failed to process attached files: ${fileNames}]` 
          : `[Failed to process attached files: ${fileNames}]`;
      }
    }

    // Handle first message in a new conversation
    if (awaitingFirstMessage) {
      // Generate a temporary ID for the new conversation
      const tempId = tempConversationId || uuidv4();
      
      // Create a title from the first few words of the message
      const titleText = typeof messageContent === 'string' 
        ? messageContent
        : messageContent.find((part: any) => part.type === 'text')?.text || 'New Conversation with Images';
      const title = generateTitleFromMessage(titleText);
      
      // For multimodal content, generate a preview for lastMessage
      const lastMessagePreview = typeof messageContent === 'string' 
        ? messageContent 
        : getTextPreviewFromMultimodal(messageContent);
      
      // Create the message
      const newMessage: Message = {
        id: `${tempId}-1`,
        content: typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent),
        sender: "user",
        timestamp: new Date(),
      };
      
      // Create a temporary conversation
      const newConversation: Conversation = {
        id: tempId,
        title: title,
        lastMessage: lastMessagePreview,
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
        streamSource.current = new SSE(`${BACKEND_URL}/api/chat`, {
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
            
            console.log("AI Message Object", aiMessageObj);
            // Update the conversation with AI response
            props.setConversations((prevConversations: Conversation[]) => 
              prevConversations.map(conv => {
                if (conv.id === tempId) {
                  // Create a preview for the lastMessage
                  const aiPreview = accumulatedResponse.substring(0, 50) + (accumulatedResponse.length > 50 ? "..." : "");
                  
                  return {
                    ...conv,
                    messages: {
                      ...conv.messages,
                      messages: [...conv.messages.messages, aiMessageObj]
                    },
                    lastMessage: aiPreview,
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
              firstMessage: typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent),
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
                  
                  // Store the conversation data in localStorage as a fallback
                  try {
                    const convoData = {
                      id: backendId,
                      title: title,
                      messages: [
                        { id: `${backendId}-1`, content: typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent), sender: "user", timestamp: new Date().toISOString() },
                        { id: `${backendId}-2`, content: accumulatedResponse, sender: "ai", timestamp: new Date().toISOString(), model: "gpt-4o" }
                      ]
                    };
                    localStorage.setItem(`convo_${backendId}`, JSON.stringify(convoData));
                  } catch (err) {
                    console.error("Error storing conversation in localStorage:", err);
                  }
                  
                  setActiveConversation(backendId);
                  
                  // Update URL with the new conversation ID
                  navigate(`/chat/${backendId}`);
                }
              })
              .catch(error => {
                console.error("Error creating conversation in backend:", error);
                
                // Try to save locally in case the backend is failing
                try {
                  const localConvoData = {
                    id: tempId,
                    title: title,
                    messages: [
                      { id: `${tempId}-1`, content: typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent), sender: "user", timestamp: new Date().toISOString() },
                      { id: `${tempId}-2`, content: accumulatedResponse, sender: "ai", timestamp: new Date().toISOString(), model: "gpt-4o" }
                    ]
                  };
                  localStorage.setItem(`convo_${tempId}`, JSON.stringify(localConvoData));
                  
                  // Try again after a short delay (backend might still be starting up)
                  setTimeout(() => {
                    axios.post(`${BACKEND_URL}/api/convo/create`, {
                      userId: localStorage.getItem('userId'),
                      title: title,
                      firstMessage: typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent),
                      aiResponse: accumulatedResponse,
                      model: "gpt-4o"
                    })
                    .then(retryResponse => {
                      console.log("Retry successful, conversation created:", retryResponse.data);
                      const { id: retryBackendId } = retryResponse.data;
                      if (retryBackendId) {
                        // Update the URL to use the new ID
                        navigate(`/chat/${retryBackendId}`);
                        // Update the conversation ID in state
                        props.setConversations((prevConversations: Conversation[]) => 
                          prevConversations.map(conv => {
                            if (conv.id === tempId) {
                              return {
                                ...conv,
                                id: retryBackendId,
                                messages: {
                                  ...conv.messages,
                                  id: retryBackendId
                                }
                              };
                            }
                            return conv;
                          })
                        );
                      }
                    })
                    .catch(retryError => {
                      console.error("Retry failed:", retryError);
                    });
                  }, 2000); // 2-second delay before retry
                } catch (localSaveError) {
                  console.error("Failed to save conversation locally:", localSaveError);
                }
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
      content: typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent),
      sender: "user",
      timestamp: new Date(),
    };

    // Update the conversation with the user message
    const updatedConversationsWithUserMessage = props.conversations.map((conv) => {
      if (conv.id === activeConversation) {
        // Generate appropriate last message preview
        const lastMessagePreview = typeof messageContent === 'string' 
          ? messageContent 
          : getTextPreviewFromMultimodal(messageContent);
          
        return {
          ...conv,
          messages: {
            ...conv.messages,
            messages: [...conv.messages.messages, newMessage]
          },
          lastMessage: lastMessagePreview,
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
      const messagesForAPI = currentConversation.messages.messages.map(msg => {
        // If the content is a JSON string of multimodal content, parse it
        let content = msg.content;
        if (typeof content === 'string' && content.startsWith('[{') && content.endsWith('}]')) {
          try {
            content = JSON.parse(content);
          } catch (e) {
            // If parsing fails, just use the string as is
            console.error("Error parsing message content:", e);
          }
        }
        
        return {
          role: msg.sender === "user" ? "user" : "assistant",
          content: content
        };
      });
      
      // Add the new user message
      messagesForAPI.push({
        role: "user",
        content: messageContent
      });

      // Create a new SSE connection for existing conversation
      streamSource.current = new SSE(`${BACKEND_URL}/api/chat`, {
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
                // Create a preview for the lastMessage
                const aiPreview = accumulatedResponse.substring(0, 50) + (accumulatedResponse.length > 50 ? "..." : "");
                
                return {
                  ...conv,
                  messages: {
                    ...conv.messages,
                    messages: [...conv.messages.messages, aiMessageObj]
                  },
                  lastMessage: aiPreview,
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
  
  // Stop streaming and save the response so far
  const stopStreaming = async () => {
    if (streamSource.current && isLoading && aiResponse) {
      // Close the stream
      streamSource.current.close();
      streamSource.current = null;
      
      // Get current state before we change it
      const currentResponse = aiResponse;
      const currentConversationId = currentConversation?.id || tempConversationId;
      
      // Update UI state
      setIsLoading(false);
      
      if (!currentConversationId) {
        console.error("No conversation ID available to save stopped response");
        return;
      }
      
      if (awaitingFirstMessage) {
        // Handle stopping stream for first message in a new conversation
        // This is similar to the code in the message event handler, but uses the current response
        const tempId = tempConversationId!;
        
        // Add AI response to conversation
        const aiMessageObj: Message = {
          id: `${tempId}-2`,
          content: currentResponse,
          sender: "ai",
          timestamp: new Date(),
          model: "gpt-4o",
        };
        
        // Update the conversation with AI response
        props.setConversations((prevConversations: Conversation[]) => 
          prevConversations.map(conv => {
            if (conv.id === tempId) {
              // Create a preview for the lastMessage
              const aiPreview = currentResponse.substring(0, 50) + (currentResponse.length > 50 ? "..." : "");
              
              return {
                ...conv,
                messages: {
                  ...conv.messages,
                  messages: [...conv.messages.messages, aiMessageObj]
                },
                lastMessage: aiPreview,
                timestamp: new Date(),
              };
            }
            return conv;
          })
        );
        
        // Save to backend (first message case)
        const title = props.conversations.find(c => c.id === tempId)?.title || "New Conversation";
        const firstMessage = props.conversations.find(c => c.id === tempId)?.messages.messages[0].content;
        
        try {
          const response = await axios.post(`${BACKEND_URL}/api/convo/create`, {
            userId: localStorage.getItem('userId'),
            title,
            firstMessage,
            aiResponse: currentResponse,
            model: "gpt-4o",
            stopped: true
          });
          
          const { id: backendId } = response.data;
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
            navigate(`/chat/${backendId}`);
          }
        } catch (error) {
          console.error("Error saving stopped conversation:", error);
          
          // Save locally as fallback
          localStorage.setItem(`convo_${tempId}`, JSON.stringify({
            id: tempId,
            title,
            messages: [
              props.conversations.find(c => c.id === tempId)?.messages.messages[0],
              {
                id: `${tempId}-2`,
                content: currentResponse,
                sender: "ai",
                timestamp: new Date().toISOString(),
                model: "gpt-4o"
              }
            ]
          }));
        }
        
        // Reset states
        setAwaitingFirstMessage(false);
        setTempConversationId(null);
      } else {
        // For existing conversations, add the partial response
        const aiMessageObj: Message = {
          id: `${currentConversationId}-${currentConversation!.messages.messages.length + 2}`,
          content: currentResponse,
          sender: "ai",
          timestamp: new Date(),
          model: currentConversation!.model,
          stopped: true
        };
        
        // Update the conversation with the partial response
        props.setConversations((prevConversations: Conversation[]) => 
          prevConversations.map(conv => {
            if (conv.id === currentConversationId) {
              // Create a preview for the lastMessage
              const aiPreview = currentResponse.substring(0, 50) + (currentResponse.length > 50 ? "..." : "") + " [stopped]";
              
              return {
                ...conv,
                messages: {
                  ...conv.messages,
                  messages: [...conv.messages.messages, aiMessageObj]
                },
                lastMessage: aiPreview,
                timestamp: new Date(),
              };
            }
            return conv;
          })
        );
        
        // Save to backend (existing conversation case)
        try {
          await axios.post(`${BACKEND_URL}/api/chat/save-stopped`, {
            conversationId: currentConversationId,
            content: currentResponse,
            model: currentConversation?.model || "gpt-4o"
          }, {
            headers: {
              'userId': localStorage.getItem('userId')
            }
          });
        } catch (error) {
          console.error("Error saving stopped response:", error);
        }
      }
      
      // Reset AI response
      setAiResponse("");
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

  // Helper to extract text preview from multimodal content
  const getTextPreviewFromMultimodal = (content: any[]): string => {
    const textParts = content.filter(part => part.type === 'text');
    const imageParts = content.filter(part => part.type === 'image');
    const fileParts = content.filter(part => part.type === 'file');
    
    let preview = textParts.length > 0 ? textParts[0].text : '';
    
    // Truncate if too long
    if (preview.length > 50) {
      preview = preview.substring(0, 50) + '...';
    }
    
    // Add attachment indicators
    if (imageParts.length > 0 || fileParts.length > 0) {
      const attachments = [];
      if (imageParts.length > 0) {
        attachments.push(`${imageParts.length} image${imageParts.length > 1 ? 's' : ''}`);
      }
      if (fileParts.length > 0) {
        attachments.push(`${fileParts.length} file${fileParts.length > 1 ? 's' : ''}`);
      }
      
      if (preview) {
        preview += ` [${attachments.join(', ')}]`;
      } else {
        preview = `[${attachments.join(', ')}]`;
      }
    }
    
    return preview || 'New message';
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
          conversations={sidebarConversations}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
          onCloseSidebar={toggleSidebar}
          onDeleteConversation={handleDeleteConversation}
          activeConversation={activeConversation}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={loadMoreConversations}
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
            models={props.models}
            setModels={props.setModels}
            currentModel={currentConversation?.model}
            onModelChange={handleModelChange}
          />
        </div>
        <div className="flex-1 overflow-hidden mb-4">
          {isLoadingConversation ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading conversation...</p>
              </div>
            </div>
          ) : !awaitingFirstMessage ? (
            <Messages
              messages={currentConversation?.messages.messages || []}
              currentModel={currentConversation?.model || "gpt-4o"}
              models={props.models}
              onModelChange={handleModelChange}
              isLoading={isLoading}
              selectedText={selectedText}
              setSelectedText={setSelectedText}
              streamingResponse={aiResponse}
              onReplyWithContext={handleReplyWithContext}
              onStopStreaming={stopStreaming}
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
          onStopGeneration={stopStreaming}
        />
      </div>
    </div>
  );
};