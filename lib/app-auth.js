(function attachMusgoAppAuth(globalScope) {
  let authReadyListenerAttached = false;
  let authStateChangeListenerAttached = false;

  function getAppAuthContext() {
    const getContext = globalScope.__musgoAppAuthContext;
    if (typeof getContext !== 'function') {
      throw new Error('musgo_app_auth_context_unavailable');
    }
    return getContext();
  }

  function getStateSnapshot() {
    return getAppAuthContext().getState();
  }

  function getAuthApi() {
    return globalScope.supabaseAuth;
  }

  function isAuthConfigured(authApi = getAuthApi()) {
    return Boolean(authApi && authApi.isConfigured && authApi.isConfigured());
  }

  function resetCloudState(state) {
    state.cloud = {
      loading: false,
      syncedUserId: null,
      error: '',
    };
    state.sections = [];
    state.plants = [];
  }

  function applyAuthState({ session = null, user = null, configured, error = '' } = {}) {
    const { reconcileNavigationWithAuth, render, loadCloudGarden } = getAppAuthContext();
    const state = getStateSnapshot();
    const previousUserId = state.auth.user?.id || null;
    const resolvedConfigured = configured ?? state.auth.configured;

    state.auth = {
      ...state.auth,
      ready: true,
      configured: resolvedConfigured,
      session,
      user,
      error,
    };

    const nextUserId = user?.id || null;
    const navigationAdjusted = reconcileNavigationWithAuth();

    if (!navigationAdjusted) {
      render();
    }

    if (nextUserId && nextUserId !== previousUserId) {
      loadCloudGarden();
      return;
    }

    if (!nextUserId && previousUserId) {
      resetCloudState(state);
      render();
    }
  }

  function ensureAuthReadyListener() {
    if (authReadyListenerAttached) return;
    authReadyListenerAttached = true;

    globalScope.addEventListener('musgo:supabase-auth-ready', () => {
      authReadyListenerAttached = false;
      initAuth();
    }, { once: true });
  }

  async function initAuth() {
    const state = getStateSnapshot();
    const authApi = getAuthApi();

    if (!authApi) {
      state.auth = {
        ...state.auth,
        ready: false,
        configured: false,
        session: null,
        user: null,
        error: '',
      };
      ensureAuthReadyListener();
      return;
    }

    const configured = isAuthConfigured(authApi);
    applyAuthState({
      configured,
      error: configured ? '' : 'Falta configurar SUPABASE_ANON_KEY en runtime.',
    });

    if (!configured) return;

    try {
      const { session, user } = await authApi.getSessionData();
      applyAuthState({ configured: true, session, user, error: '' });
    } catch (error) {
      applyAuthState({
        configured: true,
        session: null,
        user: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    if (authStateChangeListenerAttached) return;
    authStateChangeListenerAttached = true;

    authApi.onAuthStateChange(({ session, user }) => {
      applyAuthState({ configured: true, session, user, error: '' });
    });
  }

  function requireConfiguredAuth() {
    const authApi = getAuthApi();
    if (!isAuthConfigured(authApi)) {
      const { showToast } = getAppAuthContext();
      showToast('⚠️ Supabase Auth no está configurado');
      return null;
    }
    return authApi;
  }

  async function handleGoogleSignIn() {
    const authApi = requireConfiguredAuth();
    if (!authApi) return;

    try {
      await authApi.signInWithGoogle();
    } catch (error) {
      getAppAuthContext().showToast('⚠️ No pudimos iniciar sesión con Google');
    }
  }

  function setAuthFormMode(mode) {
    const { render } = getAppAuthContext();
    const state = getStateSnapshot();
    state.authForm.mode = mode === 'signup' ? 'signup' : 'signin';
    state.authForm.error = '';
    state.authForm.success = '';
    render();
  }

  function updateAuthFormField(field, value) {
    const state = getStateSnapshot();
    if (!state.authForm) return;
    state.authForm[field] = value;
  }

  /**
   * Checks if a password appears in known data breaches using the
   * HaveIBeenPwned k-anonymity API. Only the first 5 chars of the SHA-1
   * hash are ever sent — the full password never leaves the browser.
   * Returns true if breached, false if safe or if the check fails.
   */
  async function isPasswordBreached(password) {
    try {
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(password));
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();

      const prefix = hashHex.slice(0, 5);
      const suffix = hashHex.slice(5);

      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { 'Add-Padding': 'true' },
      });
      if (!res.ok) return false;

      const text = await res.text();
      for (const line of text.split('\r\n')) {
        const [lineSuffix, count] = line.split(':');
        if (lineSuffix === suffix && Number(count) > 0) return true;
      }
      return false;
    } catch {
      // If the check fails for any reason, don't block signup
      return false;
    }
  }

  async function submitEmailAuth() {
    const { render, showToast } = getAppAuthContext();
    const state = getStateSnapshot();
    const authApi = requireConfiguredAuth();
    if (!authApi) return;

    const email = (state.authForm.email || '').trim();
    const password = state.authForm.password || '';

    if (!email) {
      state.authForm.error = 'Escribe tu email.';
      state.authForm.success = '';
      render();
      return;
    }

    if (password.length < 6) {
      state.authForm.error = 'La contraseña debe tener al menos 6 caracteres.';
      state.authForm.success = '';
      render();
      return;
    }

    state.authForm.loading = true;
    state.authForm.error = '';
    state.authForm.success = '';
    render();

    try {
      if (state.authForm.mode === 'signup') {
        const breached = await isPasswordBreached(password);
        if (breached) {
          state.authForm.error = 'Esta contraseña apareció en filtraciones de datos conocidas. Por tu seguridad, elige una contraseña diferente.';
          return;
        }
        await authApi.signUpWithEmail({ email, password });
        state.authForm.success = 'Cuenta creada. Ya puedes usar Musgo con tu email.';
        showToast('🌱 Cuenta creada');
      } else {
        await authApi.signInWithEmail({ email, password });
        state.authForm.success = '';
        showToast('👋 Sesión iniciada');
      }
      state.authForm.password = '';
    } catch (error) {
      state.authForm.error = error instanceof Error ? error.message : 'No pudimos completar la operación.';
    } finally {
      state.authForm.loading = false;
      render();
    }
  }

  async function handleSignOut() {
    const authApi = requireConfiguredAuth();
    if (!authApi) return;

    try {
      await authApi.signOut();
      getAppAuthContext().showToast('👋 Sesión cerrada');
    } catch (error) {
      getAppAuthContext().showToast('⚠️ No pudimos cerrar la sesión');
    }
  }

  function getUserInitial(user) {
    const source = user?.user_metadata?.full_name || user?.email || '?';
    return source.trim().charAt(0).toUpperCase();
  }

  function getUserName(user) {
    return user?.user_metadata?.full_name || user?.user_metadata?.name || 'Sesión iniciada';
  }

  globalScope.musgoAppAuth = {
    applyAuthState,
    initAuth,
    handleGoogleSignIn,
    setAuthFormMode,
    updateAuthFormField,
    submitEmailAuth,
    handleSignOut,
    getUserInitial,
    getUserName,
  };

  globalScope.handleGoogleSignIn = handleGoogleSignIn;
  globalScope.setAuthFormMode = setAuthFormMode;
  globalScope.updateAuthFormField = updateAuthFormField;
  globalScope.submitEmailAuth = submitEmailAuth;
  globalScope.handleSignOut = handleSignOut;
})(window);
