
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Session } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from '@supabase/auth-ui-shared'
import axios from "axios";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    supabase.auth.getUser().then((e) => {
      axios.post(`${BACKEND_URL}/api/user/signup`, {
        userId: e.data.user?.id,
        name: e.data.user?.user_metadata.name,
        email: e.data.user?.email,
        avatar: e.data.user?.user_metadata.avatar_url,
      }).then((message) => {
        localStorage.setItem('userId', e.data.user?.id || '');
        console.log(message);
      });
    });
    
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;
  
  if (!session) {
    return <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />;
  }
  
  return <>{children}</>;
};
