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
  const [conversations, setConversations] = useState([]);
  const [models, setModels] = useState([]);
  const navigate = useNavigate();

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

        // Load user data from backend
        const response = await axios.get(`${BACKEND_URL}/api/user/get`, {
          headers: { 'userId': userId }
        });
        
        console.log("User data loaded:", response.data);
        
        // Here you could load conversations and models
        // setConversations(response.data.conversations || []);
        // setModels(response.data.models || []);
        
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
        />
      }
    </div>
  );
};