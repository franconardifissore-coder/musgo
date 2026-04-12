(function attachMusgoSharedRender(globalScope) {
  function getSharedRenderContext() {
    const getContext = globalScope.__musgoSharedRenderContext;
    if (typeof getContext !== 'function') {
      throw new Error('musgo_shared_render_context_unavailable');
    }
    return getContext();
  }

  function getStateSnapshot() {
    return getSharedRenderContext().getState();
  }

  function confidenceToPercent(confidence) {
    const numericConfidence = Number(confidence || 0);
    return Math.round(numericConfidence <= 1 ? numericConfidence * 100 : numericConfidence);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderBackButton(label = 'Volver', targetView = null) {
    const { getPreviousMainView } = getSharedRenderContext();
    const destination = targetView || getPreviousMainView();
    return `<button class="screen-back" type="button" onclick="window.navigateToView('${destination}')">← ${escapeHtml(label)}</button>`;
  }

  function renderSectionOptions(selectedSection = '', includePlaceholder = false) {
    const state = getStateSnapshot();
    const options = [];
    if (includePlaceholder) {
      options.push(`<option value="" ${selectedSection ? '' : 'selected'}>Sin asignar</option>`);
    } else {
      options.push(`<option value="" ${selectedSection ? '' : 'selected'}>Sin asignar</option>`);
    }
    options.push(...state.sections.map((section) => (
      `<option value="${section.id}" ${selectedSection === section.id ? 'selected' : ''}>${escapeHtml(section.icon)} ${escapeHtml(section.name)}</option>`
    )));
    return options.join('');
  }

  function renderCardState({
    icon = '🪴',
    title = 'Tu jardín está listo',
    message = '',
    actionLabel = '',
    action = '',
    secondaryLabel = '',
    secondaryAction = '',
  } = {}) {
    return `
      <div class="view-empty">
        <div class="view-empty-icon">${escapeHtml(icon)}</div>
        <div class="view-empty-title">${escapeHtml(title)}</div>
        <div class="view-empty-copy">${escapeHtml(message)}</div>
        ${(actionLabel || secondaryLabel) ? `
          <div class="empty-state-actions" style="margin-top:18px;">
            ${actionLabel ? `<button class="btn-primary" onclick="${action}">${escapeHtml(actionLabel)}</button>` : ''}
            ${secondaryLabel ? `<button class="btn-secondary" onclick="${secondaryAction}">${escapeHtml(secondaryLabel)}</button>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderAuthPrompt(message = 'Inicia sesión para ver y editar tu jardín.') {
    return renderCardState({
      icon: '☁️',
      title: 'Tu jardín está en la nube',
      message,
      actionLabel: 'Acceder',
      action: "window.navigateToView('auth')",
    });
  }

  function renderLoadingCard(message = 'Estamos recuperando tus plantas y secciones.') {
    return `
      <div class="inline-loading">
        <div class="splash-spinner" aria-hidden="true"></div>
        <div class="splash-note">Fotosíntesis en progreso…</div>
      </div>
    `;
  }

  function renderSplashScreen() {
    return `
      <section class="splash-screen" onclick="dismissSplash()">
        <div class="splash-spinner" aria-hidden="true"></div>
        <div class="splash-note">Fotosíntesis en progreso…</div>
      </section>
    `;
  }

  function getPlantWaterStatus(plant) {
    const { lastWatered, daysBetween } = globalScope.musgoWateringDomain;
    const last = lastWatered(plant);
    if (!last) {
      return {
        text: 'Sin riegos registrados',
        icon: './resources/Riegos/Riego unkown.svg',
      };
    }

    const daysSinceLastWater = daysBetween(last);
    if (daysSinceLastWater > Number(plant.freq || 3)) {
      return {
        text: `${daysSinceLastWater} día${daysSinceLastWater === 1 ? '' : 's'} de atraso`,
        icon: './resources/Riegos/Riego empty.svg',
      };
    }

    const daysUntilNext = Number(plant.freq || 3) - daysSinceLastWater;
    if (daysUntilNext <= 0) {
      return {
        text: 'Regar hoy',
        icon: './resources/Riegos/Riego partial.svg',
      };
    }

    if (daysUntilNext === 1) {
      return {
        text: 'Regar mañana',
        icon: './resources/Riegos/Riego partial.svg',
      };
    }

    return {
      text: `Regar en ${daysUntilNext} días`,
      icon: './resources/Riegos/Riego full.svg',
    };
  }

  function renderPlantTiles(plants = []) {
    return plants.map((plant) => {
      const status = getPlantWaterStatus(plant);
      return `
        <article class="plant-tile">
          <button class="plant-tile-visual" type="button" onclick="openPlantDetail('${plant.id}')" style="border:none;padding:0;">
            ${plant.imagePreview ? `<img src="${plant.imagePreview}" alt="${escapeHtml(plant.name || plant.species || 'Planta')}">` : `<div class="plant-tile-emoji">${escapeHtml(plant.emoji || '🪴')}</div>`}
          </button>
          <div class="plant-tile-body">
            <button class="plant-tile-name" type="button" onclick="openPlantDetail('${plant.id}')" style="border:none;background:none;padding:0;text-align:left;">${escapeHtml(plant.name || plant.species || 'Planta sin nombre')}</button>
            <div class="plant-tile-last">
              <img class="plant-tile-status-icon" src="${status.icon}" alt="">
              <span>${escapeHtml(status.text)}</span>
            </div>
            <button class="plant-tile-water-button" type="button" onclick="event.stopPropagation(); waterPlant('${plant.id}')">Regar</button>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderProtectedScreenState({
    title,
    subtitle,
    loadingMessage,
    authMessage = '',
  } = {}) {
    const state = getStateSnapshot();
    if (!state.auth.ready || state.cloud.loading) {
      return `
        <section class="screen">
          <div class="screen-intro">
            <h1 class="screen-title">${escapeHtml(title)}</h1>
            <p class="screen-subtitle">${escapeHtml(subtitle)}</p>
          </div>
          ${renderLoadingCard(loadingMessage)}
        </section>
      `;
    }

    if (state.auth.configured && !state.auth.user) {
      return `
        <section class="screen">
          <div class="screen-intro">
            <h1 class="screen-title">${escapeHtml(title)}</h1>
            <p class="screen-subtitle">${escapeHtml(subtitle)}</p>
          </div>
          ${renderAuthPrompt(authMessage)}
        </section>
      `;
    }

    return '';
  }

  globalScope.musgoSharedRender = {
    confidenceToPercent,
    escapeHtml,
    renderBackButton,
    renderSectionOptions,
    renderCardState,
    renderAuthPrompt,
    renderLoadingCard,
    renderSplashScreen,
    getPlantWaterStatus,
    renderPlantTiles,
    renderProtectedScreenState,
  };
})(window);
