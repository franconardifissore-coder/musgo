import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFAULT_SUPABASE_URL = "https://hbojzifhocxygdojzqjn.supabase.co";

function getSupabaseConfig() {
  const runtimeConfig = window.__MUSGO_CONFIG__ || {};

  return {
    url: runtimeConfig.SUPABASE_URL || window.SUPABASE_URL || DEFAULT_SUPABASE_URL,
    anonKey: runtimeConfig.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || "",
  };
}

function createAuthApi() {
  const { url, anonKey } = getSupabaseConfig();
  const isConfigured = Boolean(url && anonKey);

  if (!isConfigured) {
    return {
      isConfigured: () => false,
      getSessionData: async () => ({ session: null, user: null }),
      signInWithGoogle: async () => {
        throw new Error("missing_supabase_config");
      },
      signOut: async () => {
        throw new Error("missing_supabase_config");
      },
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe() {} } },
      }),
    };
  }

  const client = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return {
    isConfigured: () => true,
    getClient: () => client,
    getSessionData: async () => {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return {
        session: data.session,
        user: data.session?.user || null,
      };
    },
    signInWithGoogle: async () => {
      const redirectTo = `${window.location.origin}${window.location.pathname}`;
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
      if (error) throw error;
    },
    signOut: async () => {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },
    onAuthStateChange: (callback) =>
      client.auth.onAuthStateChange((_event, session) => {
        callback({
          session,
          user: session?.user || null,
        });
      }),
  };
}

window.supabaseAuth = createAuthApi();
window.dispatchEvent(new CustomEvent("musgo:supabase-auth-ready"));
