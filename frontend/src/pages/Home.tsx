import { useEffect, useState } from "react";
import { ChatInterface } from "../components/ChatInterface";
import axios from "axios";
import { supabase } from "../../supabaseClient";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom";

export const Home = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [models, setModels] = useState([]);
  const navigate = useNavigate();

  // Function to handle conversation deletion
  const handleDeleteConversation = async (id: string) => {
    try {
      // First remove from local state (optimistic update)
      setConversations((prevConversations) => 
        prevConversations.filter((conv: any) => conv.id !== id)
      );
      
      // Then make the API call to delete on the server
      const userId = localStorage.getItem('userId');
      await axios.delete(`${BACKEND_URL}/api/convo/${id}`, {
        headers: { 'userId': userId }
      });
      
      console.log(`Conversation ${id} successfully deleted`);
    } catch (error) {
      console.error(`Error deleting conversation ${id}:`, error);
      
      // If there's an error, reload the conversations to ensure UI is in sync
      const userId = localStorage.getItem('userId');
      try {
        const response = await axios.get(`${BACKEND_URL}/api/convo/list?limit=10`, {
          headers: { 'userId': userId }
        });
        // Ensure conversations are sorted by updatedAt in descending order
        const sortedConversations = response.data ? 
          [...response.data].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) : [];
        setConversations(sortedConversations);
      } catch (reloadError) {
        console.error("Error reloading conversations:", reloadError);
      }
    }
  };

  // Function to navigate to a specific conversation
  const handleSelectConversation = (id: string) => {
    navigate(`/chat/${id}`);
  };

  // Create a handleNewConversation function to ensure proper initialization
  const handleNewConversation = () => {
    // When starting a new conversation from Home, just reset the UI and navigate to root
    navigate('/');
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
  }, [BACKEND_URL, navigate]);

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
        <LoadingSpinner message="Loading your dashboard..." /> : 
        <ChatInterface 
          conversations={conversations} 
          models={models} 
          setConversations={setConversations} 
          setModels={setModels}
          onDeleteConversation={handleDeleteConversation}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          isLandingPage={true}
        />
      }
    </div>
  );
};