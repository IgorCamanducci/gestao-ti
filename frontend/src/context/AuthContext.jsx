import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient'; // Importa nosso cliente

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tenta pegar a sessão existente quando o app carrega
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Ouve mudanças no estado de autenticação (login, logout)
    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // CORREÇÃO: A função de limpeza agora chama o unsubscribe na propriedade 'subscription'
    return () => {
      data.subscription?.unsubscribe();
    };
  }, []);

  // Funções de login e logout que agora chamam o Supabase
  const value = {
    session,
    user,
    isAuthenticated: !!user,
    logout: () => supabase.auth.signOut(),
    login: (email, password) => supabase.auth.signInWithPassword({ email, password }),
  };

  // Não renderiza nada até que a verificação inicial da sessão seja concluída
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);