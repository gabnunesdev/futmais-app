import { type Session } from "@supabase/supabase-js"; //
import { createContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../services/supabase";
import type { AuthContextType } from "../types";

//
// Adicionamos esta linha abaixo para dizer ao Linter: "Eu sei o que estou fazendo, pode ignorar o refresh aqui".
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    // O Supabase retorna { data, error }, nós retornamos apenas o erro tratado
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
