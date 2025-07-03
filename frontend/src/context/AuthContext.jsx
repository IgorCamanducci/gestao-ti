import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar o perfil do usuário no banco de dados
  const getProfile = async (sessionUser) => {
    if (sessionUser) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`full_name, avatar_url`)
          .eq('id', sessionUser.id)
          .single();

        if (error) throw error;
        setProfile(data || null);
      } catch (error) {
        console.error("Erro ao buscar perfil:", error.message);
        setProfile(null);
      }
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    const handleAuthChange = async (session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      await getProfile(sessionUser);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });

    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    logout: () => supabase.auth.signOut(),
    login: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    refreshProfile: () => getProfile(user), // <-- NOVA FUNÇÃO EXPOSTA
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);