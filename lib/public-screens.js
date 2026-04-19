(function attachPublicScreens(global) {
  function renderLandingScreen() {
    return `
      <section class="screen landing-screen">
        <div class="landing-hero">
          <div class="landing-hero-content">
            <div class="landing-eyebrow"><img src="/resources/landing/ai-icon.svg" alt="" class="landing-eyebrow-icon">Identificaci&oacute;n con AI integrada</div>
            <h1 class="landing-title">Cuida tus plantas sin&nbsp;esfuerzo.</h1>
            <p class="landing-subtitle">Reconocimiento inteligente, calendario de riego y espacios organizados.<br>Todo lo que necesitas para que tu jard&iacute;n prospere.</p>
            <div class="landing-copy-actions">
              <button class="btn-primary landing-cta" type="button" onclick="window.navigateToView('auth')">Empezar gratis</button>
            </div>
          </div>
          <div class="landing-hero-media" aria-hidden="true">
            <img src="/resources/landing/plants-landing-compressed-vertical.png" alt="" class="landing-hero-photo">
          </div>
        </div>

        <div class="landing-story-list">
          <article class="landing-story landing-story--tinted">
            <div class="landing-story-copy">
              <h3 class="landing-story-title">Calendario de riego</h3>
              <p class="landing-story-text">Cada planta guarda su frecuencia de riego y Musgo la refleja en una vista de calendario para que sea f&aacute;cil anticipar qu&eacute; toca y cu&aacute;ndo.</p>
            </div>
            <div class="landing-story-visual">
              <img src="/resources/landing/landing-mockup-2.png" alt="" class="landing-story-image">
            </div>
          </article>

          <article class="landing-story">
            <div class="landing-story-copy">
              <h3 class="landing-story-title">Reconocimiento con AI</h3>
              <p class="landing-story-text">Puedes subir una imagen, recibir una coincidencia sugerida y usar ese resultado para arrancar una ficha de planta sin rellenar todo desde cero.</p>
            </div>
            <div class="landing-story-visual">
              <img src="/resources/landing/landing-mockup-1.png" alt="" class="landing-story-image">
            </div>
          </article>

          <article class="landing-story landing-story--tinted">
            <div class="landing-story-copy">
              <h3 class="landing-story-title">Agrupa tus plantas por espacio</h3>
              <p class="landing-story-text">Agrupa tus plantas por habitaci&oacute;n o rinc&oacute;n. Localiza r&aacute;pidamente qu&eacute; necesita atenci&oacute;n y mant&eacute;n tu hogar mejor organizado.</p>
            </div>
            <div class="landing-story-visual">
              <img src="/resources/landing/landing-mockup-3.png" alt="" class="landing-story-image">
            </div>
          </article>
        </div>

        <div class="landing-cta-band">
          <div class="landing-cta-icon">🌿</div>
          <h2 class="landing-cta-title">Tu jard&iacute;n te est&aacute; esperando</h2>
          <p class="landing-cta-copy">Empieza a registrar tus plantas y convierte el cuidado diario en una rutina mucho m&aacute;s clara.</p>
          <button class="btn-primary" type="button" onclick="window.navigateToView('auth')">Entrar en Musgo</button>
        </div>

        <footer class="landing-footer">
          <div class="landing-footer-bar">
            <div class="landing-footer-brand">
              <img src="/resources/logo vector.svg" alt="Musgo">
              <span>Musgo</span>
            </div>
          </div>
          <div class="landing-footer-bottom">
            <div>Cuida tus plantas con una experiencia serena y organizada.</div>
            <div class="landing-legal">
              <a href="/privacidad">Pol&iacute;tica de privacidad</a>
              <a href="/terminos-y-condiciones">T&eacute;rminos y condiciones</a>
            </div>
          </div>
        </footer>
      </section>
    `;
  }

  function renderAuthScreen() {
    const context = global.__musgoPublicScreenContext && global.__musgoPublicScreenContext();
    if (!context) {
      throw new Error('musgo_public_screen_context_unavailable');
    }

    const { state, escapeHtml } = context;
    const authModeLabel = state.authForm.mode === 'signup' ? 'Crear cuenta' : 'Entrar';

    return `
      <section class="screen auth-screen">
        <div class="screen-intro">
          <h1 class="screen-title">Ingresar</h1>
        </div>
        <div class="auth-panel">
          <button class="btn-secondary auth-google-button" type="button" onclick="handleGoogleSignIn()">
            <img src="/resources/icons8-google.svg" alt="">
            <span>Continuar con Google</span>
          </button>
          <div class="auth-divider">o con email</div>
          <div class="auth-mode-toggle">
            <button class="auth-mode-button ${state.authForm.mode === 'signin' ? 'active' : ''}" type="button" onclick="setAuthFormMode('signin')">Entrar</button>
            <button class="auth-mode-button ${state.authForm.mode === 'signup' ? 'active' : ''}" type="button" onclick="setAuthFormMode('signup')">Crear cuenta</button>
          </div>
          ${state.authForm.error ? `<div class="auth-feedback error">${escapeHtml(state.authForm.error)}</div>` : ''}
          ${state.authForm.success ? `<div class="auth-feedback success">${escapeHtml(state.authForm.success)}</div>` : ''}
          <div class="auth-form">
            <div class="form-group">
              <label>Email</label>
              <input class="editor-input" type="email" value="${escapeHtml(state.authForm.email)}" placeholder="tu@email.com" oninput="updateAuthFormField('email', this.value)">
            </div>
            <div class="form-group">
              <label>Contraseña</label>
              <input class="editor-input" type="password" value="${escapeHtml(state.authForm.password)}" placeholder="Mínimo 6 caracteres" oninput="updateAuthFormField('password', this.value)">
            </div>
              <button class="btn-primary" type="button" onclick="submitEmailAuth()" ${state.authForm.loading ? 'disabled' : ''}>${state.authForm.loading ? 'Procesando...' : authModeLabel}</button>
            </div>
        </div>
        <p class="auth-legal-copy">Al continuar, aceptas tanto nuestra <a href="/privacidad">política de privacidad</a> como los <a href="/terminos-y-condiciones">términos y condiciones</a> del servicio.</p>
      </section>
    `;
  }

  global.musgoPublicScreens = {
    renderLandingScreen,
    renderAuthScreen,
  };
})(window);
