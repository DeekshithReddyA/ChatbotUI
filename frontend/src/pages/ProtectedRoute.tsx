import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Session } from "@supabase/supabase-js";
import { CustomAuth } from "../components/CustomAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import axios from "axios";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRegistered, setUserRegistered] = useState(false);

  useEffect(() => {
    const setupAuth = async () => {
      try {
        // Get initial session
        const { data: sessionData } = await supabase.auth.getSession();
        setSession(sessionData.session);
        
        if (sessionData.session) {
          // We have a session, check if user is registered with backend
          await ensureUserRegistered(sessionData.session.user);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Auth setup error:", error);
        setLoading(false);
      }
    };
    
    setupAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event);
      setSession(session);
      
      if (event === 'SIGNED_IN' && session) {
        // User signed in, ensure they're registered with backend
        await ensureUserRegistered(session.user);
      } else if (event === 'SIGNED_OUT') {
        // User signed out, clear registration status
        localStorage.removeItem('userId');
        setUserRegistered(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Ensure user is registered with the backend
  const ensureUserRegistered = async (user: any) => {
    try {
      // First check if userId exists in localStorage
      const storedUserId = localStorage.getItem('userId');
      
      if (storedUserId === user.id) {
        // We already have the correct userId, verify with backend
        try {
          const response = await axios.get(`${BACKEND_URL}/api/user/get`, {
            headers: { 'userId': user.id }
          });
          
          if (response.data) {
            console.log("User already registered with backend");
            setUserRegistered(true);
            return;
          }
        } catch (error) {
          // User might not be in backend, continue to registration
          console.log("User not found in backend, will register");
        }
      }
      
      // Register user with backend
      const response = await axios.post(`${BACKEND_URL}/api/user/signup`, {
        userId: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url || '',
      });

      console.log("User registered with backend:", response.data);
      localStorage.setItem('userId', user.id);
      setUserRegistered(true);
    } catch (error) {
      console.error("Failed to register user with backend:", error);
      // We'll show the auth component again to retry
      setUserRegistered(false);
    }
  };

  // Handle when authentication is complete via our custom auth component
  const handleAuthComplete = () => {
    console.log("Auth complete callback triggered");
    setUserRegistered(true);
  };

  // Show loading spinner while checking auth
  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }
  
  // If no session, show auth component
  if (!session) {
    return <CustomAuth onAuthComplete={handleAuthComplete} />;
  }
  
  // If session exists but user not registered with backend
  if (session && !userRegistered) {
    return <LoadingSpinner message="Setting up your account..." />;
  }
  
  // When session exists and user is registered, render children
  return <>{children}</>;
};
