import { useState } from "react";
import { supabase } from "../../supabaseClient";
import axios from "axios";
import { LoadingSpinner } from "./LoadingSpinner";

interface CustomAuthProps {
  onAuthComplete: () => void;
}

export const CustomAuth = ({ onAuthComplete }: CustomAuthProps) => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle email/password authentication
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Sign up or sign in based on mode
      let authResponse;
      
      if (authMode === "signup") {
        authResponse = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin,
          }
        });
      } else {
        authResponse = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
      }

      const { data, error } = authResponse;

      if (error) throw error;
      
      // For sign up, we should check if email confirmation is required
      if (authMode === "signup" && data?.user?.identities?.length === 0) {
        setSuccessMessage("Please check your email for a confirmation link");
        setIsLoading(false);
        return;
      }

      // If we have a user, register with backend
      if (data.user) {
        await registerUserWithBackend(data.user);
      } else {
        throw new Error("Authentication successful but no user data returned");
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      setErrorMessage(error.message || "Authentication failed");
      setIsLoading(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        }
      });

      if (error) throw error;
      
      // For OAuth, we'll register the user in the onAuthStateChange in ProtectedRoute
      // since we get redirected
      console.log("Google auth initiated:", data);
    } catch (error: any) {
      console.error("Google auth error:", error);
      setErrorMessage(error.message || "Google authentication failed");
      setIsLoading(false);
    }
  };

  // Register user with backend
  const registerUserWithBackend = async (user: any) => {
    try {
      console.log("Registering user with backend:", user.id);
      
      // Make API call to register user in backend
      const response = await axios.post(`${BACKEND_URL}/api/user/signup`, {
        userId: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url || '',
      });

      console.log("Backend registration response:", response.data);
      
      // Set user ID in localStorage
      localStorage.setItem("userId", user.id);
      
      // Notify parent component that auth is complete
      onAuthComplete();
    } catch (error: any) {
      console.error("Backend registration error:", error);
      setErrorMessage("Authentication successful, but failed to register with the application. Please try again.");
      // Sign out the user since we couldn't complete registration
      await supabase.auth.signOut();
      setIsLoading(false);
    }
  };

  // Toggle between sign in and sign up
  const toggleAuthMode = () => {
    setAuthMode(authMode === "signin" ? "signup" : "signin");
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  if (isLoading) {
    return <LoadingSpinner message="Processing authentication..." />;
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">
        {authMode === "signin" ? "Sign In" : "Create Account"}
      </h2>
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleEmailAuth} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {authMode === "signin" ? "Sign In" : "Sign Up"}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleGoogleAuth}
            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <div className="flex items-center justify-center">
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.79-1.677-4.184-2.702-6.735-2.702-5.515 0-10 4.486-10 10s4.486 10 10 10c5.689 0 9.932-4.125 9.932-9.967 0-0.791-0.098-1.530-0.252-2.255l-9.68 0.556z"
                  fill="#4285F4"
                />
                <path
                  d="M12.545 10.239l9.675-0.577c-0.155-0.825-0.465-1.624-0.893-2.378l-8.786 0.493v2.462z"
                  fill="#34A853"
                />
                <path
                  d="M7.223 14.238c-0.248-0.746-0.393-1.537-0.393-2.366 0-0.829 0.146-1.62 0.393-2.366v-2.843h-3.404c-0.962 1.566-1.523 3.405-1.523 5.381s0.561 3.815 1.523 5.381l3.404-3.186v-0z"
                  fill="#FBBC05"
                />
                <path
                  d="M12.545 7.106c1.576 0 2.988 0.634 4.011 1.706l2.511-2.511c-1.791-1.677-4.183-2.7-6.734-2.7-3.957 0-7.359 2.304-8.996 5.643l3.404 2.599c0.844-2.514 3.394-4.422 6.033-4.422z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </div>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={toggleAuthMode}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {authMode === "signin"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}; 