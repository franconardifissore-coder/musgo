/**
 * Provider de sesión Supabase para toda la app.
 *
 * Lee la sesión inicial al montar y se suscribe a cambios. Expone:
 * - session, user: estado actual
 * - loading: true mientras se resuelve la sesión inicial
 * - useAuth(): hook para consumir desde componentes
 *
 * El root layout (app/_layout.tsx) usa esto para decidir si redirige
 * a (auth) o a (tabs).
 */

import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { clearGarden, loadGarden } from './garden-store';
import { registerForPushNotifications } from './notifications/register';
import { getCurrentSession, onAuthStateChange } from './supabase/auth';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let lastUserId: string | null = null;

    function handleSession(s: Session | null) {
      if (!mounted) return;
      setSession(s);
      const userId = s?.user?.id ?? null;
      if (userId && userId !== lastUserId) {
        // Nueva sesión (login o refresh tras restart): cargar garden +
        // intentar registrar push token. El registro falla silencioso
        // si el usuario denegó permisos o si estamos en simulador.
        lastUserId = userId;
        void loadGarden();
        void registerForPushNotifications();
      } else if (!userId && lastUserId) {
        // Logout: limpiar todo.
        lastUserId = null;
        clearGarden();
      }
    }

    getCurrentSession()
      .then((s) => {
        if (!mounted) return;
        handleSession(s);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });
    const unsubscribe = onAuthStateChange((s) => {
      handleSession(s);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, user: session?.user ?? null, loading }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
