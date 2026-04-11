(function attachPublicScreens(global) {
  function renderLandingScreen() {
    return `
      <section class="screen landing-screen">
        <div class="landing-hero">
          <div class="landing-copy">
            <div class="landing-eyebrow">Cuidado tranquilo para plantas reales</div>
            <h1 class="landing-title">Cuida tus plantas sin esfuerzo.</h1>
            <p class="landing-subtitle">Musgo te ayuda a organizar tus plantas, entender qu&eacute; toca regar y guardar cada ficha en una experiencia clara, ligera y pensada para usar todos los d&iacute;as.</p>
            <div class="landing-copy-actions">
              <button class="btn-primary landing-cta" type="button" onclick="setView('auth')">Empezar</button>
            </div>
            <div class="landing-note">Identificaci&oacute;n con AI, calendario de riego y espacios en una sola app.</div>
          </div>
          <div class="landing-artboard" aria-hidden="true">
            <div class="landing-art-badge">Vista previa del jard&iacute;n</div>
            <div class="landing-art-photo"></div>
          </div>
        </div>

        <div class="landing-section centered">
          <div class="landing-section-head">
            <div class="landing-section-kicker">Todo en un mismo lugar</div>
            <h2 class="landing-section-title">Todo para que tus plantas prosperen</h2>
            <p class="landing-section-copy">La app ya combina seguimiento, organizaci&oacute;n e identificaci&oacute;n para reducir fricci&oacute;n y hacer m&aacute;s simple el cuidado diario.</p>
          </div>
        </div>

        <div class="landing-story-list">
          <article class="landing-story">
            <div class="landing-story-visual">
              <div class="landing-story-ui">
                <div class="landing-story-screen">
                  <div class="landing-story-bar">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div class="landing-story-stat">3 plantas necesitan riego esta semana</div>
                  <div class="landing-story-grid">
                    <div class="landing-story-pill">Hoy</div>
                    <div class="landing-story-pill">Ma&ntilde;ana</div>
                    <div class="landing-story-pill">Viernes</div>
                    <div class="landing-story-pill">Domingo</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="landing-story-copy">
              <h3 class="landing-story-title">Calendario y recordatorio de riego</h3>
              <p class="landing-story-text">Cada planta guarda su frecuencia de riego y Musgo la refleja en una vista de calendario para que sea f&aacute;cil anticipar qu&eacute; toca y cu&aacute;ndo.</p>
            </div>
          </article>

          <article class="landing-story is-reverse">
            <div class="landing-story-visual">
              <div class="landing-story-ui reverse">
                <div class="landing-story-screen">
                  <div class="landing-story-bar">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div class="landing-story-stat">Reconocimiento sugerido con AI</div>
                  <div class="landing-story-grid">
                    <div class="landing-story-pill">Monstera deliciosa</div>
                    <div class="landing-story-pill">92% confianza</div>
                    <div class="landing-story-pill">Crear ficha</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="landing-story-copy">
              <h3 class="landing-story-title">Reconocimiento asistido con AI</h3>
              <p class="landing-story-text">Puedes subir una imagen, recibir una coincidencia sugerida y usar ese resultado para arrancar una ficha de planta sin rellenar todo desde cero.</p>
            </div>
          </article>

          <article class="landing-story">
            <div class="landing-story-visual">
              <div class="landing-story-ui">
                <div class="landing-story-screen">
                  <div class="landing-story-bar">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div class="landing-story-stat">Espacios organizados por ambiente</div>
                  <div class="landing-story-grid">
                    <div class="landing-story-pill">Balc&oacute;n</div>
                    <div class="landing-story-pill">Sal&oacute;n</div>
                    <div class="landing-story-pill">Dormitorio</div>
                    <div class="landing-story-pill">Estudio</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="landing-story-copy">
              <h3 class="landing-story-title">Agrupa tus plantas por espacio</h3>
              <p class="landing-story-text">La app permite crear espacios con nombre y emoji para encontrar m&aacute;s r&aacute;pido cada grupo de plantas y mantener mejor ordenada la colecci&oacute;n.</p>
            </div>
          </article>
        </div>

        <div class="landing-section centered">
          <div class="landing-section-head">
            <div class="landing-section-kicker">Tres pasos, cero complicaciones</div>
            <h2 class="landing-section-title">Una experiencia pensada para ser r&aacute;pida</h2>
          </div>
          <div class="landing-benefit-grid">
            <article class="landing-benefit-card">
              <div class="landing-benefit-head">01</div>
              <h3 class="landing-benefit-title">Crea o identifica</h3>
              <p class="landing-benefit-copy">A&ntilde;ade plantas manualmente o usa una foto para empezar con datos sugeridos.</p>
            </article>
            <article class="landing-benefit-card">
              <div class="landing-benefit-head">02</div>
              <h3 class="landing-benefit-title">Organiza por espacios</h3>
              <p class="landing-benefit-copy">Asigna cada planta a un rinc&oacute;n concreto para encontrarla sin pensar demasiado.</p>
            </article>
            <article class="landing-benefit-card">
              <div class="landing-benefit-head">03</div>
              <h3 class="landing-benefit-title">Consulta qu&eacute; toca hoy</h3>
              <p class="landing-benefit-copy">Revisa la vista de riego y actualiza el estado de cada planta desde un flujo simple.</p>
            </article>
          </div>
        </div>

        <div class="landing-section centered">
          <div class="landing-section-head">
            <div class="landing-section-kicker">Lo que dicen nuestros usuarios</div>
            <h2 class="landing-section-title">Una app que acompa&ntilde;a sin molestar</h2>
          </div>
          <div class="landing-testimonial-grid">
            <article class="landing-testimonial-card">
              <div class="landing-testimonial-name">Mar&iacute;a</div>
              <div class="landing-testimonial-role">Colecci&oacute;n dom&eacute;stica</div>
              <p class="landing-testimonial-copy">Ahora s&eacute; qu&eacute; plantas revisar cada semana sin tener que recordar fechas de memoria.</p>
            </article>
            <article class="landing-testimonial-card">
              <div class="landing-testimonial-name">Pablo</div>
              <div class="landing-testimonial-role">Balc&oacute;n urbano</div>
              <p class="landing-testimonial-copy">El alta manual y los espacios me ayudan a mantener ordenada una colecci&oacute;n que antes llevaba en notas sueltas.</p>
            </article>
            <article class="landing-testimonial-card">
              <div class="landing-testimonial-name">Clara</div>
              <div class="landing-testimonial-role">Primeras plantas</div>
              <p class="landing-testimonial-copy">La identificaci&oacute;n con AI me dio el empuj&oacute;n inicial para guardar cada planta y empezar a cuidarlas mejor.</p>
            </article>
          </div>
        </div>

        <div class="landing-cta-band">
          <div class="landing-cta-icon">🌿</div>
          <h2 class="landing-cta-title">Tu jard&iacute;n te est&aacute; esperando</h2>
          <p class="landing-cta-copy">Empieza a registrar tus plantas y convierte el cuidado diario en una rutina mucho m&aacute;s clara.</p>
          <button class="btn-primary" type="button" onclick="setView('auth')">Entrar en Musgo</button>
        </div>

        <footer class="landing-footer">
          <div class="landing-footer-bar">
            <div class="landing-footer-brand">
              <img src="./resources/logo vector.svg" alt="Musgo">
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
            <img src="./resources/icons8-google.svg" alt="">
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
