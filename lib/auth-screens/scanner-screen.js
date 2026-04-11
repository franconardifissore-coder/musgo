(function attachMusgoScannerScreen(globalScope) {
  function getScannerScreenContext() {
    const getContext = globalScope.__musgoScannerScreenContext;
    if (typeof getContext !== 'function') {
      throw new Error('musgo_scanner_screen_context_unavailable');
    }
    return getContext();
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

    const scanPreview = state.identification.preview
      ? `<div class="scan-box-preview"><img src="${state.identification.preview}" alt="Preview de la planta"></div>`
      : `<div class="scan-box-icon"><img src="./resources/scanner icon.svg" alt="Escanear planta"></div>`;
    const scanTitle = state.identification.loading ? 'Analizando planta...' : 'Escanear planta';
    const scanCopy = state.identification.loading
      ? 'Estamos revisando la imagen para identificar tu planta automáticamente.'
      : (state.identification.error || 'Reconocimiento con AI');

    return `
      <section class="screen">
        <div class="screen-intro">
          <h1 class="screen-title">Agrega una planta</h1>
          <p class="screen-subtitle">Enfoca tu planta para identificarla automáticamente o cárgala manualmente.</p>
        </div>
        <div class="scan-panel">
          <input type="file" id="scanImageInput" accept="image/*" capture="environment" style="display:none" onchange="handleDirectScanFileChange(event)">
          <button class="scan-box ${state.identification.loading ? 'is-loading' : ''}" type="button" onclick="openDirectScanPicker()">
            <div class="scan-box-inner">
              ${scanPreview}
              <div class="scan-box-title">${scanTitle}</div>
              <div class="scan-box-copy ${state.identification.loading ? 'is-loading' : ''} ${state.identification.error ? 'is-error' : ''}">${scanCopy}</div>
            </div>
          </button>
          ${state.identification.error ? `<div class="scan-feedback error">${escapeHtml(state.identification.error)}</div>` : ''}
          <button class="scan-secondary" type="button" onclick="openPlantCreateView()">Crear manualmente</button>
        </div>
      </section>
    `;
  }

  globalScope.musgoScannerScreen = {
    renderScanScreen,
  };
})(window);
