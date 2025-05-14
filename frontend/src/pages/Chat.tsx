import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChatInterface } from "../components/ChatInterface";
import axios from "axios";
import { supabase } from "../../supabaseClient";
import { LoadingSpinner } from "../components/LoadingSpinner";

export const Chat = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [models, setModels] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams(); // Get conversation ID from URL

  // Function to handle conversation deletion
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      // First remove from local state (optimistic update)
      setConversations((prevConversations) => 
        prevConversations.filter((conv: any) => conv.id !== conversationId)
      );
      
      // If we're deleting the current conversation, navigate to home
      if (conversationId === id) {
        navigate('/');
      }
      
      // Then make the API call to delete on the server
      const userId = localStorage.getItem('userId');
      await axios.delete(`${BACKEND_URL}/api/convo/${conversationId}`, {
        headers: { 'userId': userId }
      });
      
      console.log(`Conversation ${conversationId} successfully deleted`);
    } catch (error) {
      console.error(`Error deleting conversation ${conversationId}:`, error);
      
      // If there's an error, reload the conversations to ensure UI is in sync
      const userId = localStorage.getItem('userId');
      try {
        const response = await axios.get(`${BACKEND_URL}/api/user/get`, {
          headers: { 'userId': userId }
        });
        // Ensure conversations are sorted by updatedAt in descending order
        const sortedConversations = response.data.conversationsWithMessages ? 
          [...response.data.conversationsWithMessages].sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          ) : [];
        setConversations(sortedConversations);
      } catch (reloadError) {
        console.error("Error reloading conversations:", reloadError);
      }
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get current user
        const { data } = await supabase.auth.getUser();
        if (!data.user) {
          // No authenticated user, redirect to login
          navigate('/');
          return;
        }

        // Get userId from localStorage
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.error("No userId in localStorage");
          navigate('/');
          return;
        }

        // Load the initial set of conversations (for sidebar)
        const response = await axios.get(`${BACKEND_URL}/api/convo/list?limit=10`, {
          headers: { 'userId': userId }
        });
        
        console.log("Conversations loaded:", response.data);
        // Ensure conversations are sorted by updatedAt in descending order
        const sortedConversations = response.data ? 
          [...response.data].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) : [];
        setConversations(sortedConversations);
        
        // If we have a conversation ID in the URL, fetch that specific conversation
        if (id) {
          try {
            const conversationResponse = await axios.get(`${BACKEND_URL}/api/convo/${id}`, {
              headers: { 'userId': userId }
            });
            
            if (conversationResponse.data) {
              // Update or add the specific conversation with its messages
              setConversations(prevConversations => {
                const existingIndex = prevConversations.findIndex(c => c.id === id);
                let updatedConversations;
                
                if (existingIndex >= 0) {
                  // Replace existing conversation with full data
                  updatedConversations = [...prevConversations];
                  updatedConversations[existingIndex] = conversationResponse.data;
                } else {
                  // Add this conversation to the list
                  updatedConversations = [...prevConversations, conversationResponse.data];
                }
                
                // Sort by updatedAt in descending order to ensure consistent order
                return updatedConversations.sort((a, b) => 
                  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
              });
            }
          } catch (conversationError) {
            console.error(`Error fetching conversation ${id}:`, conversationError);
          }
        }
        
        // Load models
        const modelsResponse = await axios.get(`${BACKEND_URL}/api/models`, {
          headers: { 'userId': userId }
        });
        
        setModels(modelsResponse.data || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading user data:", error);
        setError("Failed to load your data. Please try again.");
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [BACKEND_URL, navigate, id]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    window.location.reload();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md w-full text-center">
          <p className="text-lg font-medium mb-4">{error}</p>
          <button 
            onClick={handleRetry}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {isLoading ? 
        <LoadingSpinner message="Loading your conversation..." /> : 
        <ChatInterface 
          conversations={conversations} 
          models={models} 
          setConversations={setConversations} 
          setModels={setModels}
          onDeleteConversation={handleDeleteConversation}
          activeConversationId={id}
        />
      }
    </div>
  );
}; 