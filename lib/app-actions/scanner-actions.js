(function attachMusgoScannerActions(globalScope) {
  function getScannerActionsContext() {
    const getContext = globalScope.__musgoScannerActionsContext;
    if (typeof getContext !== 'function') {
      throw new Error('musgo_scanner_actions_context_unavailable');
    }
    return getContext();
  }

  function getStateSnapshot() {
    return getScannerActionsContext().getState();
  }

  function buildIdentifiedPlantDraft(result) {
    const { getPersistableImagePreview } = getScannerActionsContext();
    const state = getStateSnapshot();
    if (!result) return null;

    const refImage = result.referenceImages && result.referenceImages.length
      ? result.referenceImages[0].url
      : null;

    return {
      species: result.scientificName,
      name: result.scientificName || '',
      imagePreview: getPersistableImagePreview(state.identification.preview),
      identifiedSpecies: result.scientificName,
      identifiedCommonName: result.commonNames && result.commonNames.length ? result.commonNames[0] : '',
      identificationConfidence: result.confidence / 100,
      identifiedAt: new Date().toISOString(),
      identifiedFamily: result.family || null,
      identifiedReferenceImage: refImage,
    };
  }

  function openIdentifiedPlantDraft(result) {
    const { openPlantCreateView } = getScannerActionsContext();
    const draft = buildIdentifiedPlantDraft(result);
    if (!draft) return;
    openPlantCreateView(draft);
  }

  function openDirectScanPicker() {
    const { resetIdentificationState, render } = getScannerActionsContext();
    const state = getStateSnapshot();
    if (state.identification.loading) return;

    resetIdentificationState();
    render();

    const input = document.getElementById('scanImageInput');
    if (!input) return;
    input.value = '';
    input.click();
  }

  async function handleDirectScanFileChange(event) {
    const {
      createPersistableImagePreview,
      createAnalysisImageFile,
      showToast,
      render,
    } = getScannerActionsContext();
    const state = getStateSnapshot();
    const rawFile = event.target.files && event.target.files[0];
    if (!rawFile) return;

    state.identification.results = [];
    state.identification.error = '';

    try {
      state.identification.preview = await createPersistableImagePreview(rawFile);
      state.identification.file = await createAnalysisImageFile(rawFile);
    } catch (error) {
      state.identification.preview = '';
      state.identification.file = null;
      state.identification.loading = false;
      state.identification.error = 'No pudimos preparar la imagen. Prueba con otra foto.';
      showToast('⚠️ No pudimos preparar la imagen. Prueba con otra foto.');
      render();
      return;
    }

    if (!globalScope.plantIdentificationClient || typeof globalScope.plantIdentificationClient.identifyPlantFromImage !== 'function') {
      state.identification.loading = false;
      state.identification.error = 'La identificación automática no está disponible en este momento.';
      showToast('⚠️ La integración de identificación no está disponible en este momento.');
      render();
      return;
    }

    state.identification.loading = true;
    state.identification.error = '';
    render();

    try {
      const response = await globalScope.plantIdentificationClient.identifyPlantFromImage(state.identification.file);
      const usefulResults = response.results.filter((result) => result.confidence >= 15);
      state.identification.results = usefulResults;

      if (!usefulResults.length) {
        state.identification.error = 'No encontramos una coincidencia clara. Prueba con otra foto o crea la planta manualmente.';
        showToast('⚠️ No pudimos identificar la planta con suficiente confianza');
        render();
        return;
      }

      state.identification.error = '';
      // Show the matches list on the scan screen; user picks their match
    } catch (error) {
      const message = getPlantIdentificationErrorMessage(error);
      state.identification.error = message;
      showToast(`⚠️ ${message}`);
      render();
    } finally {
      state.identification.loading = false;
      render();
    }
  }

  function getPlantIdentificationErrorMessage(error) {
    const code = String((error && (error.code || error.message)) || '');
    const status = Number((error && error.status) || (error && error.payload && error.payload.plantnetStatus) || 0);
    const rawMessage = String((error && error.message) || '');

    if (code === 'identify_network_error') {
      return 'No pudimos conectar con el servicio de identificación.';
    }

    if (code === 'missing_plantnet_api_key' || rawMessage.includes('PLANTNET_API_KEY')) {
      return 'La identificación automática no está configurada en este momento.';
    }

    if (status === 429 || code === 'plant_identification_rate_limited') {
      return 'Se alcanzó temporalmente el límite de identificaciones. Inténtalo más tarde.';
    }

    if (status >= 500) {
      return 'El servicio de identificación falló. Puedes volver a intentarlo o crear la planta manualmente.';
    }

    return 'No pudimos analizar la foto. Prueba con otra imagen o crea la planta manualmente.';
  }

  function selectIdentificationResult(index) {
    const state = getStateSnapshot();
    const result = state.identification.results && state.identification.results[index];
    if (!result) return;
    openIdentifiedPlantDraft(result);
  }

  globalScope.musgoScannerActions = {
    buildIdentifiedPlantDraft,
    openIdentifiedPlantDraft,
    selectIdentificationResult,
    openDirectScanPicker,
    handleDirectScanFileChange,
    getPlantIdentificationErrorMessage,
  };

  globalScope.openDirectScanPicker = openDirectScanPicker;
  globalScope.handleDirectScanFileChange = handleDirectScanFileChange;
  globalScope.selectIdentificationResult = selectIdentificationResult;
})(window);
