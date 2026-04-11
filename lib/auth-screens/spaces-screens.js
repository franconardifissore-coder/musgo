(function attachMusgoSpacesScreens(globalScope) {
  function getSpacesScreenContext() {
    const getContext = globalScope.__musgoSpacesScreenContext;
    if (typeof getContext !== 'function') {
      throw new Error('musgo_spaces_screen_context_unavailable');
    }
    return getContext();
  }

  function renderSpacesScreen() {
    const {
      state,
      escapeHtml,
      renderProtectedScreenState,
    } = getSpacesScreenContext();

    const protectedState = renderProtectedScreenState({
      title: 'Tus Espacios',
      subtitle: 'Organiza tu oasis personal por habitaciones.',
      loadingMessage: 'Estamos recuperando tus espacios y sus plantas.',
      authMessage: 'Inicia sesión para editar tus espacios y ver cuántas plantas viven en cada uno.',
    });
    if (protectedState) return protectedState;

    const spaces = state.sections.map((section) => {
      const plantsInSection = state.plants.filter((plant) => plant.section === section.id);
      return `
        <article class="space-card">
          <div class="space-card-top">
            <div>
              <div class="space-card-name">${escapeHtml(section.name)}</div>
              <div class="space-card-count">${plantsInSection.length} planta${plantsInSection.length === 1 ? '' : 's'} en este espacio</div>
            </div>
            <div class="space-card-icon">${escapeHtml(section.icon || '🪴')}</div>
          </div>
          <div class="space-card-actions">
            <button class="space-card-button secondary" type="button" onclick="editSectionFromSpaces('${section.id}')">Editar</button>
            <button class="space-card-button primary" type="button" onclick="waterSection('${section.id}')">Regar todo</button>
          </div>
        </article>
      `;
    }).join('');

    return `
      <section class="screen editor-screen">
        <div class="screen-intro">
          <h1 class="screen-title">Tus Espacios</h1>
          <p class="screen-subtitle">Organiza tu oasis personal por habitaciones.</p>
        </div>
        <div class="spaces-list">
          ${spaces}
          <button class="add-plant-card-mobile" type="button" onclick="openCreateSectionView()" style="width:100%;min-height:180px;">
            <span class="add-circle">＋</span>
            <span class="add-label">Añadir Nuevo Espacio</span>
          </button>
        </div>
      </section>
    `;
  }

  function renderEditSpaceScreen() {
    const {
      state,
      sectionEmojis,
      escapeHtml,
      renderBackButton,
    } = getSpacesScreenContext();

    const draft = state.screenSectionDraft;
    if (!draft) {
      return `
        <section class="screen">
          <div class="screen-head">
            ${renderBackButton('Espacios', 'spaces')}
          </div>
          <div class="screen-intro">
            <h1 class="screen-title">Editar espacio</h1>
            <p class="screen-subtitle">No encontramos el espacio que querías editar.</p>
          </div>
        </section>
      `;
    }

    const isEditing = Boolean(state.editingSectionId);
    const title = isEditing ? 'Editar espacio' : 'Nuevo Espacio';
    const subtitle = isEditing
      ? 'Actualiza el nombre del espacio y el emoji que mejor lo representa.'
      : 'Define un espacio de tu casa para organizar tus plantas.';

    return `
      <section class="screen detail-screen">
        <div class="screen-head">
          ${renderBackButton('Espacios', 'spaces')}
        </div>
        <div class="screen-intro">
          <h1 class="screen-title">${title}</h1>
          <p class="screen-subtitle">${subtitle}</p>
        </div>
        <div class="space-editor-card">
          <div class="form-group">
            <label>Elige un emoji que lo represente</label>
            <div class="space-emoji-grid">
              ${sectionEmojis.map((emoji) => `
                <button class="space-emoji-button ${draft.icon === emoji ? 'active' : ''}" type="button" onclick="setScreenSectionEmoji('${emoji}')">${emoji}</button>
              `).join('')}
            </div>
          </div>
          <div class="form-group">
            <label>Nombre del espacio</label>
            <input class="editor-input" type="text" value="${escapeHtml(draft.name || '')}" placeholder="Ej: Salón, Cocina, Balcón..." oninput="updateScreenSectionName(this.value)">
          </div>
          <div class="space-editor-hint">Utiliza nombres cortos para identificar r&aacute;pidamente d&oacute;nde se encuentran tus plantas.</div>
        </div>
        <div class="screen-actions">
          <button class="btn-primary" type="button" onclick="saveSectionFromScreen()">Guardar</button>
          <div class="space-delete-action">
            <button class="btn-danger" type="button" onclick="${isEditing ? 'deleteSectionFromScreen()' : 'cancelEditSectionView()'}">Eliminar</button>
          </div>
        </div>
      </section>
    `;
  }

  globalScope.musgoSpacesScreens = {
    renderSpacesScreen,
    renderEditSpaceScreen,
  };
})(window);
