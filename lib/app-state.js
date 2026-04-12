(function attachMusgoAppState(globalScope) {
  function createInitialState() {
    return {
      sections: [],
      plants: [],
      currentView: 'dashboard',
      previousMainView: 'dashboard',
      activeSection: 'all',
      auth: {
        ready: false,
        configured: false,
        session: null,
        user: null,
        error: '',
      },
      cloud: {
        loading: false,
        syncedUserId: null,
        error: '',
      },
      editingSectionId: null,
      detailPlantId: null,
      deletingPlantId: null,
      deletingSectionId: null,
      screenPlantDraft: null,
      screenSectionDraft: null,
      detailDraft: null,
      menuOpen: false,
      splashVisible: false,
      authForm: {
        mode: 'signin',
        email: '',
        password: '',
        loading: false,
        error: '',
        success: '',
      },
      identification: {
        file: null,
        preview: '',
        results: [],
        loading: false,
        error: '',
      },
      calPlantId: null,
      calYear: new Date().getFullYear(),
      calMonth: new Date().getMonth(),
    };
  }

  function resetIdentificationState(state) {
    state.identification = {
      file: null,
      preview: '',
      results: [],
      loading: false,
      error: '',
    };
  }

  function createPlantDraft(state, prefill = null) {
    return {
      id: null,
      name: prefill?.name || '',
      species: prefill?.species || '',
      emoji: prefill?.emoji || '🌿',
      section: state.activeSection !== 'all' ? state.activeSection : '',
      freq: 3,
      imagePreview: prefill?.imagePreview || '',
      identifiedSpecies: prefill?.identifiedSpecies || '',
      identifiedCommonName: prefill?.identifiedCommonName || '',
      identificationConfidence: prefill?.identificationConfidence ?? null,
      identifiedAt: prefill?.identifiedAt || null,
      waterLog: [],
    };
  }

  function createSectionDraft(state, existingSection = null) {
    return {
      id: existingSection?.id || null,
      name: existingSection?.name || '',
      icon: existingSection?.icon || '🪴',
      plantCount: existingSection ? state.plants.filter((plant) => plant.section === existingSection.id).length : 0,
    };
  }

  function getPreviousMainView(state, mainViews, fallback = 'plants') {
    return mainViews.includes(state.previousMainView) ? state.previousMainView : fallback;
  }

  // Generates a unique entity ID using the Web Crypto API when available,
  // falling back to a timestamp + random string for older environments.
  function createEntityId(prefix = 'id') {
    if (globalScope.crypto && typeof globalScope.crypto.randomUUID === 'function') {
      return globalScope.crypto.randomUUID();
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  globalScope.musgoAppState = {
    createInitialState,
    resetIdentificationState,
    createPlantDraft,
    createSectionDraft,
    getPreviousMainView,
    createEntityId,
  };
})(window);
