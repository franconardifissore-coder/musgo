(function attachMusgoScannerScreen(globalScope) {
  function getScannerScreenContext() {
    const getContext = globalScope.__musgoScannerScreenContext;
    if (typeof getContext !== 'function') {
      throw new Error('musgo_scanner_screen_context_unavailable');
    }
    return getContext();
  }

  function renderMatchCards(results, escapeHtml) {
    if (!results || !results.length) return '';

    const cards = results.map((result, i) => {
      const refImg = result.referenceImages && result.referenceImages[0];
      const visual = refImg
        ? `<img class="scan-match-photo" src="${escapeHtml(refImg.url)}" alt="${escapeHtml(result.scientificName)}" onerror="this.outerHTML='<div class=\\"scan-match-photo scan-match-photo--empty\\">🌿</div>'">`
        : `<div class="scan-match-photo scan-match-photo--empty">🌿</div>`;
      const speciesValue = result.scientificName ? escapeHtml(result.scientificName) : 'Sin dato';
      const commonNameValue = result.commonNames && result.commonNames[0]
        ? escapeHtml(result.commonNames[0])
        : 'Sin dato';
      const familyValue = result.family
        ? escapeHtml(result.family)
        : 'Sin dato';

      return `
        <button class="scan-match-card" type="button" onclick="selectIdentificationResult(${i})">
          ${visual}
          <div class="scan-match-info">
            <div class="scan-match-field">
              <div class="scan-match-label">Especie:</div>
              <div class="scan-match-value scan-match-value-species">${speciesValue}</div>
            </div>
            <div class="scan-match-field">
              <div class="scan-match-label">Nombre comun:</div>
              <div class="scan-match-value">${commonNameValue}</div>
            </div>
            <div class="scan-match-field">
              <div class="scan-match-label">Familia:</div>
              <div class="scan-match-value scan-match-value-family">${familyValue}</div>
            </div>
          </div>
          <div class="scan-match-confidence">${result.confidence}%</div>
        </button>
      `;
    }).join('');

    return `
      <div class="scan-matches">
        <div class="scan-matches-title">Coincidencias encontradas</div>
        ${cards}
      </div>
    `;
  }

  function renderScanScreen() {
    const {
      state,
      escapeHtml,
      renderProtectedScreenState,
    } = getScannerScreenContext();

    const protectedState = renderProtectedScreenState({
      title: 'Agrega una planta',
      subtitle: 'Enfoca tu planta para identificarla automáticamente o cárgala manualmente.',
      loadingMessage: 'Estamos preparando tu cuenta para crear nuevas plantas.',
      authMessage: 'Inicia sesión para identificar plantas y guardarlas directamente en tu colección.',
    });
    if (protectedState) return protectedState;

    const hasResults = state.identification.results && state.identification.results.length > 0;
    const scanPreview = state.identification.preview
      ? `<div class="scan-box-preview"><img src="${state.identification.preview}" alt="Preview de la planta"></div>`
      : `<div class="scan-box-icon"><img src="./resources/scanner icon.svg" alt="Escanear planta"></div>`;
    const scanTitle = state.identification.loading ? 'Analizando planta...' : (hasResults ? 'Analizar otra foto' : 'Escanear planta');
    const scanCopy = state.identification.loading
      ? 'Estamos revisando la imagen para identificar tu planta automáticamente.'
      : (state.identification.error || (hasResults ? 'Toca para escanear una foto diferente' : 'Reconocimiento con AI'));

    return `
      <section class="screen">
        <div class="screen-intro">
          <h1 class="screen-title">Agrega una planta</h1>
          <p class="screen-subtitle">Enfoca tu planta para identificarla automáticamente o cárgala manualmente.</p>
        </div>
        <div class="scan-panel">
          <input type="file" id="scanImageInput" accept="image/*" capture="environment" style="display:none" onchange="handleDirectScanFileChange(event)">
          <button class="scan-box ${state.identification.loading ? 'is-loading' : ''} ${hasResults ? 'has-results' : ''}" type="button" onclick="openDirectScanPicker()">
            <div class="scan-box-inner">
              ${scanPreview}
              <div class="scan-box-title">${scanTitle}</div>
              <div class="scan-box-copy ${state.identification.loading ? 'is-loading' : ''} ${state.identification.error ? 'is-error' : ''}">${scanCopy}</div>
            </div>
          </button>
          ${state.identification.error ? `<div class="scan-feedback error">${escapeHtml(state.identification.error)}</div>` : ''}
          ${hasResults ? renderMatchCards(state.identification.results, escapeHtml) : ''}
          <button class="scan-secondary" type="button" onclick="openPlantCreateView()">Crear manualmente</button>
        </div>
      </section>
    `;
  }

  globalScope.musgoScannerScreen = {
    renderScanScreen,
  };
})(window);
