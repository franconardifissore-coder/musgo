(function attachMusgoPlantsScreens(globalScope) {
  function getPlantsScreenContext() {
    const getContext = globalScope.__musgoPlantsScreenContext;
    if (typeof getContext !== 'function') {
      throw new Error('musgo_plants_screen_context_unavailable');
    }
    return getContext();
  }

  function renderPlantsScreen() {
    const {
      state,
      escapeHtml,
      renderProtectedScreenState,
      getFilteredPlants,
      renderPlantTiles,
      renderCardState,
    } = getPlantsScreenContext();

    const protectedState = renderProtectedScreenState({
      title: 'Tu Jardín',
      subtitle: 'Bienvenid@ a tu colección',
      loadingMessage: 'Estamos preparando tu colección.',
    });
    if (protectedState) return protectedState;

    const all = { id: 'all', name: 'Todos', label: 'Todos' };
    const tabs = [
      all,
      ...state.sections.map((section) => ({
        id: section.id,
        name: section.name,
        label: `${section.icon || '🪴'} ${section.name}`,
      })),
    ];
    const plants = getFilteredPlants();
    const tiles = renderPlantTiles(plants);

    return `
      <section class="screen editor-screen">
        <div class="screen-intro">
          <h1 class="screen-title">Tu Jardín</h1>
          <p class="screen-subtitle">Bienvenid@ a tu colección</p>
        </div>
        <div class="chip-row">
          ${tabs.map((tab) => `<button class="filter-chip ${state.activeSection === tab.id ? 'active' : ''}" onclick="setSection('${tab.id}')">${escapeHtml(tab.label || tab.name)}</button>`).join('')}
        </div>
        ${plants.length ? `
          <div class="plants-grid-mobile">
            ${tiles}
            <button class="add-plant-card-mobile" type="button" onclick="window.navigateToView('scan')">
              <span class="add-circle">＋</span>
              <span class="add-label">Agregar planta</span>
            </button>
          </div>
        ` : `
          ${renderCardState({
            icon: '🌱',
            title: 'Sin plantas todavía',
            message: 'Empieza a subir tus plantas al jardín y no te perderás un solo riego',
            actionLabel: 'Añadir planta',
            action: "window.navigateToView('scan')"
          })}
        `}
      </section>
    `;
  }

  function renderPlantCreateScreen() {
    const {
      state,
      escapeHtml,
      createPlantDraft,
      confidenceToPercent,
      renderBackButton,
      renderSectionOptions,
    } = getPlantsScreenContext();

    const draft = state.screenPlantDraft || createPlantDraft();
    const isIdentified = Boolean(draft.identifiedSpecies);
    const identifiedBadge = draft.identificationConfidence !== null && draft.identificationConfidence !== undefined
      ? `Match con ${confidenceToPercent(draft.identificationConfidence)}% de confianza`
      : 'Planta identificada';

    return `
      <section class="screen editor-screen plant-create-screen">
        <div class="screen-head">
          ${renderBackButton('Scan', 'scan')}
        </div>
        <div class="screen-intro">
          ${isIdentified ? `<div class="screen-kicker">¡Lo tenemos!</div>` : ''}
          <h1 class="screen-title">${isIdentified ? 'Planta identificada' : 'Crear planta'}</h1>
        </div>
        ${isIdentified ? `
          <div class="identified-plant-card">
            <div class="identified-plant-visual">
              ${draft.imagePreview
                ? `<img src="${draft.imagePreview}" alt="${escapeHtml(draft.identifiedSpecies || draft.species || 'Planta identificada')}">`
                : `<div class="identified-plant-visual-fallback">${escapeHtml(draft.emoji || '🌿')}</div>`
              }
              ${draft.identifiedReferenceImage ? `
                <div class="identified-plant-reference-wrap" title="Imagen de referencia · PlantNet">
                  <img class="identified-plant-reference" src="${escapeHtml(draft.identifiedReferenceImage)}" alt="Referencia PlantNet" onerror="this.closest('.identified-plant-reference-wrap').remove()">
                  <span class="identified-plant-reference-label">Ref.</span>
                </div>
              ` : ''}
            </div>
            <div class="identified-plant-badge">${escapeHtml(identifiedBadge)}</div>
            <div>
              <div class="identified-plant-name">${escapeHtml(draft.identifiedSpecies || draft.species || 'Planta identificada')}</div>
              ${draft.identifiedCommonName ? `<div class="identified-plant-species">${escapeHtml(draft.identifiedCommonName)}</div>` : ''}
              ${draft.identifiedFamily ? `<div class="identified-plant-family">${escapeHtml(draft.identifiedFamily)}</div>` : ''}
            </div>
          </div>
          <div class="identified-plant-form">
            <div class="form-group">
              <label>Nombre de la planta</label>
              <input class="editor-input" type="text" value="${escapeHtml(draft.name || draft.identifiedSpecies || draft.species || '')}" placeholder="Ej. Ficus lyrata" oninput="updateScreenPlantField('name', this.value)">
            </div>
            <div class="form-group">
              <label>Frecuencia de riego</label>
              <select class="editor-select" onchange="updateScreenPlantField('freq', Number(this.value))">
                <option value="" ${draft.freq ? '' : 'selected'} disabled>Selecciona una frecuencia</option>
                ${[1,2,3,5,7,14,30].map((freq) => `<option value="${freq}" ${Number(draft.freq) === freq ? 'selected' : ''}>${freq === 1 ? 'Cada día' : `Cada ${freq} días`}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Espacio</label>
              <select class="editor-select" onchange="updateScreenPlantField('section', this.value)">
                ${renderSectionOptions(draft.section, true)}
              </select>
            </div>
          </div>
        ` : `
          <div class="manual-plant-card">
            <div class="manual-plant-card-inner">
              <div class="manual-plant-card-icon">🪴</div>
              <div class="manual-plant-card-title">Agrega tu planta</div>
              <div class="manual-plant-card-copy">Dale un nombre bonito</div>
            </div>
          </div>
          <div class="form-group">
            <label>Nombre de la planta</label>
            <input class="editor-input" type="text" value="${escapeHtml(draft.name || '')}" placeholder="Ej. Monstera deliciosa" oninput="updateScreenPlantField('name', this.value)">
          </div>
          <div class="form-group">
            <label>Frecuencia de riego</label>
            <select class="editor-select" onchange="updateScreenPlantField('freq', Number(this.value))">
              <option value="" ${draft.freq ? '' : 'selected'} disabled>Selecciona una frecuencia</option>
              ${[1,2,3,5,7,14,30].map((freq) => `<option value="${freq}" ${Number(draft.freq) === freq ? 'selected' : ''}>${freq === 1 ? 'Cada día' : `Cada ${freq} días`}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Espacio</label>
            <select class="editor-select" onchange="updateScreenPlantField('section', this.value)">
              ${renderSectionOptions(draft.section, true)}
            </select>
          </div>
        `}
        <div class="screen-actions">
          <button class="btn-primary" type="button" onclick="savePlantFromScreen()">Guardar</button>
        </div>
      </section>
    `;
  }

  function renderPlantDetailScreen() {
    const {
      state,
      escapeHtml,
      renderBackButton,
      renderInlinePlantCalendar,
      renderSectionOptions,
      formatPhotoDate,
    } = getPlantsScreenContext();

    const plant = state.plants.find((item) => item.id === state.detailPlantId);
    if (!plant) {
      return `
        <section class="screen">
          <div class="screen-intro">
            <h1 class="screen-title">Detalle de planta</h1>
            <p class="screen-subtitle">No hemos encontrado esta planta.</p>
          </div>
          <div class="screen-actions">
            <button class="btn-primary" type="button" onclick="window.navigateToView('plants')">Volver a plantas</button>
          </div>
        </section>
      `;
    }

    const draft = state.detailDraft || {
      name: plant.name || '',
      freq: Number(plant.freq) || 3,
      section: plant.section || '',
    };

    const photoBucket = state.plantPhotos && state.plantPhotos[plant.id];
    const photos = photoBucket ? photoBucket.photos : null;
    const photosLoading = photoBucket ? photoBucket.loading : false;
    const photosError = photoBucket ? photoBucket.error : '';

    // Trigger photo load on first render (no-op if already loading/loaded)
    if (!photoBucket) {
      setTimeout(() => { if (typeof loadPlantPhotos === 'function') loadPlantPhotos(plant.id); }, 0);
    }

    // Upload modal
    const upload = state.photoUpload || {};
    const uploadModalHtml = upload.open && upload.plantId === plant.id ? `
      <div class="photo-modal-overlay" onclick="if(event.target===this)closePhotoUploadModal()">
        <div class="photo-modal">
          <div class="photo-modal-header">
            <span class="photo-modal-title">Nueva foto</span>
            <button class="photo-modal-close" type="button" onclick="closePhotoUploadModal()" aria-label="Cerrar">✕</button>
          </div>
          ${upload.preview ? `
            <div class="photo-modal-preview">
              <img src="${escapeHtml(upload.preview)}" alt="Vista previa">
            </div>
          ` : `
            <label class="photo-modal-drop" for="photoFileInput">
              <span class="photo-modal-drop-icon">📷</span>
              <span class="photo-modal-drop-label">Tocá para elegir una foto</span>
              <input id="photoFileInput" type="file" accept="image/*" style="display:none"
                onchange="if(this.files[0])photoUploadFileSelected(this.files[0])">
            </label>
          `}
          <div class="photo-modal-note-wrap">
            <textarea class="photo-modal-note" placeholder="Nota opcional (ej. Le salió una hoja nueva)" rows="2"
              oninput="photoUploadNoteChanged(this.value)">${escapeHtml(upload.note || '')}</textarea>
          </div>
          ${upload.error ? `<div class="photo-modal-error">${escapeHtml(upload.error)}</div>` : ''}
          <div class="photo-modal-actions">
            <button class="btn-cancel" type="button" onclick="closePhotoUploadModal()">Cancelar</button>
            ${upload.preview ? `
              <button class="btn-primary" type="button" onclick="confirmUploadPhoto()" ${upload.loading ? 'disabled' : ''}>
                ${upload.loading ? 'Guardando…' : 'Guardar foto'}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    ` : '';

    // Lightbox
    const lb = state.photoLightbox || {};
    const lightboxHtml = lb.open && lb.plantId === plant.id ? `
      <div class="photo-lightbox-overlay" onclick="if(event.target===this)closePhotoLightbox()">
        <div class="photo-lightbox">
          <button class="photo-lightbox-close" type="button" onclick="closePhotoLightbox()" aria-label="Cerrar">✕</button>
          <img class="photo-lightbox-img" src="${escapeHtml(lb.url)}" alt="Foto de planta">
          <div class="photo-lightbox-meta">
            ${lb.takenAt ? `<span class="photo-lightbox-date">${escapeHtml(formatPhotoDate(lb.takenAt))}</span>` : ''}
            ${lb.note ? `<span class="photo-lightbox-note">${escapeHtml(lb.note)}</span>` : ''}
          </div>
          <button class="photo-lightbox-delete" type="button" onclick="confirmDeletePhoto()">Eliminar foto</button>
        </div>
      </div>
    ` : '';

    // Photo grid
    let photoSectionHtml;
    if (photosLoading) {
      photoSectionHtml = `<div class="photo-grid-empty">Cargando fotos…</div>`;
    } else if (photosError) {
      photoSectionHtml = `<div class="photo-grid-empty photo-grid-error">${escapeHtml(photosError)}</div>`;
    } else if (!photos || photos.length === 0) {
      photoSectionHtml = `
        <div class="photo-grid-empty">
          <span class="photo-grid-empty-icon">🌿</span>
          <span>Aún no hay fotos. ¡Subí la primera!</span>
        </div>
      `;
    } else {
      const tiles = photos.map((photo) => `
        <button class="photo-tile" type="button" onclick="openPhotoLightbox('${escapeHtml(photo.id)}','${escapeHtml(plant.id)}')" title="${escapeHtml(photo.note || '')}">
          <img class="photo-tile-img" src="${escapeHtml(photo.url)}" alt="Foto" loading="lazy">
          <div class="photo-tile-date">${escapeHtml(formatPhotoDate(photo.takenAt))}</div>
          ${photo.note ? `<div class="photo-tile-note">${escapeHtml(photo.note)}</div>` : ''}
        </button>
      `).join('');
      photoSectionHtml = `<div class="photo-grid">${tiles}</div>`;
    }

    return `
      ${uploadModalHtml}
      ${lightboxHtml}
      <section class="screen detail-screen">
        <div class="screen-head">
          ${renderBackButton('Plantas', 'plants')}
        </div>
        <div class="screen-intro">
          <h1 class="screen-title">Detalle de planta</h1>
        </div>
        <div class="plant-detail-layout">
          ${renderInlinePlantCalendar(plant)}
          <div class="detail-form-card">
            <div class="detail-field">
              <label>Nombre</label>
              <input class="detail-input" type="text" value="${escapeHtml(draft.name || '')}" oninput="updateDetailPlantField('name', this.value)">
            </div>
            <div class="detail-field">
              <label>Frecuencia de riego</label>
              <select class="detail-select" onchange="updateDetailPlantField('freq', Number(this.value))">
                ${[1,2,3,5,7,14,30].map((freq) => `<option value="${freq}" ${Number(draft.freq) === freq ? 'selected' : ''}>${freq === 1 ? 'Cada día' : `Cada ${freq} días`}</option>`).join('')}
              </select>
            </div>
            <div class="detail-field">
              <label>Espacio</label>
              <select class="detail-select" onchange="updateDetailPlantField('section', this.value)">
                ${renderSectionOptions(draft.section)}
              </select>
            </div>
          </div>

          <!-- PHOTO TIMELINE -->
          <div class="photo-section-card">
            <div class="photo-section-head">
              <span class="photo-section-title">Evolución</span>
              <button class="photo-add-btn" type="button" onclick="openPhotoUploadModal('${plant.id}')">
                <span aria-hidden="true">＋</span> Agregar foto
              </button>
            </div>
            ${photoSectionHtml}
          </div>

          <div class="detail-actions-card">
            <button class="btn-danger" type="button" onclick="openDeleteModal('${plant.id}')">Eliminar</button>
            <button class="btn-primary" type="button" onclick="savePlantDetail()">Guardar</button>
          </div>
        </div>
      </section>
    `;
  }

  globalScope.musgoPlantsScreens = {
    renderPlantsScreen,
    renderPlantCreateScreen,
    renderPlantDetailScreen,
  };
})(window);
