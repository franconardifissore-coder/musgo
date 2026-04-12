(function attachMusgoAppSync(globalScope) {
  function getAppSyncContext() {
    const getContext = globalScope.__musgoAppSyncContext;
    if (typeof getContext !== 'function') {
      throw new Error('musgo_app_sync_context_unavailable');
    }
    return getContext();
  }

  function getStateSnapshot() {
    return getAppSyncContext().getState();
  }

  function isCloudSyncEnabled() {
    const state = getStateSnapshot();
    return Boolean(state.auth.user && globalScope.supabaseData);
  }

  async function loadCloudGarden() {
    if (!isCloudSyncEnabled()) return;

    const { hydrateRouteState, render, showToast } = getAppSyncContext();
    const state = getStateSnapshot();
    const userId = state.auth.user.id;

    state.cloud = {
      ...state.cloud,
      loading: true,
      error: '',
    };
    render();

    try {
      const garden = await globalScope.supabaseData.fetchUserGarden();
      state.sections = garden.sections;
      state.plants = garden.plants;
      hydrateRouteState();
      state.cloud = {
        loading: false,
        syncedUserId: userId,
        error: '',
      };
      render();
    } catch (error) {
      state.cloud = {
        loading: false,
        syncedUserId: null,
        error: error instanceof Error ? error.message : String(error),
      };
      render();
      showToast('⚠️ No pudimos cargar tus plantas desde la nube');
    }
  }

  async function syncSectionToCloud(section) {
    if (!isCloudSyncEnabled()) return;
    const state = getStateSnapshot();
    await globalScope.supabaseData.upsertSection(section, state.auth.user.id);
  }

  async function syncPlantToCloud(plant) {
    if (!isCloudSyncEnabled()) return;
    const state = getStateSnapshot();
    const section = state.sections.find((item) => item.id === plant.section);
    if (section) {
      await syncSectionToCloud(section);
    }
    await globalScope.supabaseData.upsertPlant(plant, state.auth.user.id);
  }

  async function deletePlantFromCloud(plantId) {
    if (!isCloudSyncEnabled()) return;
    await globalScope.supabaseData.deletePlant(plantId);
  }

  async function deleteSectionFromCloud(sectionId) {
    if (!isCloudSyncEnabled()) return;
    await globalScope.supabaseData.clearPlantSection(sectionId);
    await globalScope.supabaseData.deleteSection(sectionId);
  }

  globalScope.musgoAppSync = {
    isCloudSyncEnabled,
    loadCloudGarden,
    syncSectionToCloud,
    syncPlantToCloud,
    deletePlantFromCloud,
    deleteSectionFromCloud,
  };
})(window);
