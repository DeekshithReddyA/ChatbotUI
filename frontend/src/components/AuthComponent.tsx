import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from '@supabase/auth-ui-shared';
import axios from "axios";
import { LoadingSpinner } from "./LoadingSpinner";

interface AuthComponentProps {
  onAuthComplete: () => void;
}

export const AuthComponent = ({ onAuthComplete }: AuthComponentProps) => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [isProcessing, setIsProcessing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Log backend URL for debugging
    console.log('Backend URL:', BACKEND_URL);
    
    // Check if user is already signed in
    const checkExistingUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        console.log("Found existing user:", data.user.id);
        handleUserSignIn(data.user);
      }
    };
    
    checkExistingUser();
    
    // Set up auth state change listener to detect when a user signs in
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event);
      
      if (event === 'SIGNED_IN' && session) {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          console.log("User signed in:", data.user.id);
          handleUserSignIn(data.user);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserSignIn = async (user: any) => {
    if (isProcessing) return; // Prevent multiple calls
    
    setIsProcessing(true);
    setAuthError(null);
    
    try {
      console.log('Processing user sign in:', user.id);
      console.log('User metadata:', user.user_metadata);
      console.log('User email:', user.email);
      
      // Make sure BACKEND_URL is not undefined or empty
      if (!BACKEND_URL) {
        throw new Error("Backend URL is not defined. Check your environment variables.");
      }
      
      const signupEndpoint = `${BACKEND_URL}/api/user/signup`;
      console.log('Sending user data to backend at:', signupEndpoint);
      
      // Register user in the backend with explicit await
      const response = await axios.post(signupEndpoint, {
        userId: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url || '',
      });
      
      console.log('Backend registration response:', response.data);
      
      if (!response.data || response.status !== 200) {
        throw new Error("Backend registration failed: " + JSON.stringify(response.data));
      }
      
      // Set userId in localStorage
      localStorage.setItem('userId', user.id);
      console.log('User ID saved to localStorage:', user.id);
      
      // Only proceed after successful backend registration
      console.log('Auth complete - notifying parent component');
      onAuthComplete();
    } catch (error: any) {
      console.error("Error during authentication process:", error);
      console.error("Error details:", error.response?.data || error.message);
      setAuthError(`Failed to register user with the backend: ${error.message}. Please check console for details.`);
      // Don't call onAuthComplete here - we need successful backend registration first
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      {isProcessing ? (
        <LoadingSpinner message="Setting up your account..." />
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-6 text-center">Sign In or Sign Up</h2>
          {authError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {authError}
              <div className="mt-2">
                <button 
                  className="bg-red-200 hover:bg-red-300 text-red-800 font-bold py-1 px-2 rounded text-xs"
                  onClick={() => setAuthError(null)}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
          <Auth 
            supabaseClient={supabase} 
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
            view="sign_in"
          />
        </>
      )}
    </div>
  );
}; 