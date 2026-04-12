(function attachMusgoPlantActions(globalScope) {
  function getPlantActionsContext() {
    const getContext = globalScope.__musgoPlantActionsContext;
    if (typeof getContext !== 'function') {
      throw new Error('musgo_plant_actions_context_unavailable');
    }
    return getContext();
  }

  function getStateSnapshot() {
    return getPlantActionsContext().getState();
  }

  function openPlantDetail(plantId) {
    const { navigateToView } = getPlantActionsContext();
    const state = getStateSnapshot();
    const plant = state.plants.find((item) => item.id === plantId);
    if (!plant) return;

    state.detailPlantId = plantId;
    state.detailDraft = {
      name: plant.name || '',
      freq: Number(plant.freq) || 3,
      section: plant.section || '',
    };
    state.calPlantId = plantId;
    state.calYear = new Date().getFullYear();
    state.calMonth = new Date().getMonth();
    navigateToView('plantDetail', {
      trackMainView: false,
    });
  }

  function openThirstyPlantsView() {
    getPlantActionsContext().navigateToView('thirstyPlants', {
      trackMainView: false,
    });
  }

  function openPlantCreateView(prefill = null) {
    const { createPlantDraft, navigateToView } = getPlantActionsContext();
    const state = getStateSnapshot();
    state.screenPlantDraft = createPlantDraft(prefill);
    navigateToView('plantCreate', {
      trackMainView: false,
    });
  }

  function updateScreenPlantField(field, value) {
    const { createPlantDraft } = getPlantActionsContext();
    const state = getStateSnapshot();
    if (!state.screenPlantDraft) {
      state.screenPlantDraft = createPlantDraft();
    }
    state.screenPlantDraft[field] = value;
  }

  function updateDetailPlantField(field, value) {
    const state = getStateSnapshot();
    if (!state.detailDraft) return;
    state.detailDraft[field] = value;
  }

  function setSection(id) {
    const state = getStateSnapshot();
    state.activeSection = id;
    getPlantActionsContext().navigateToView('plants');
  }

  async function waterPlant(id) {
    const {
      today,
      saveState,
      render,
      syncPlantToCloud,
      showToast,
    } = getPlantActionsContext();
    const state = getStateSnapshot();
    const plant = state.plants.find((item) => item.id === id);
    if (!plant) return;

    if (!plant.waterLog) plant.waterLog = [];
    const currentDay = today();
    if (!plant.waterLog.includes(currentDay)) {
      plant.waterLog.push(currentDay);
    }

    saveState();
    render();

    try {
      await syncPlantToCloud(plant);
    } catch (error) {
      console.error('Failed to sync watered plant', error);
      showToast('⚠️ Regamos localmente, pero no pudimos sincronizar en la nube');
      return;
    }

    showToast(`💧 ${plant.name} regada`);
  }

  async function savePlantDetail() {
    const {
      saveState,
      render,
      syncPlantToCloud,
      showToast,
    } = getPlantActionsContext();
    const state = getStateSnapshot();
    const plant = state.plants.find((item) => item.id === state.detailPlantId);
    const draft = state.detailDraft;
    if (!plant || !draft) return;

    plant.name = (draft.name || '').trim() || plant.species || 'Planta sin nombre';
    plant.freq = Number(draft.freq) || 3;
    plant.section = draft.section;
    saveState();
    render();

    try {
      await syncPlantToCloud(plant);
    } catch (error) {
      console.error('Failed to sync plant detail', error);
      showToast('⚠️ Guardamos localmente, pero no pudimos sincronizar la ficha');
      return;
    }

    showToast('🌱 Cambios guardados');
  }

  async function savePlantFromScreen() {
    const {
      createPlantDraft,
      createEntityId,
      resetIdentificationState,
      navigateToView,
      syncPlantToCloud,
      showToast,
    } = getPlantActionsContext();
    const state = getStateSnapshot();
    const draft = state.screenPlantDraft || createPlantDraft();
    const isIdentifiedFlow = Boolean(draft.identifiedSpecies);
    const isManualCreateFlow = !isIdentifiedFlow;

    const resolvedName = (draft.name || '').trim() || (draft.species || '').trim() || 'Planta sin nombre';
    const plantToSync = {
      ...(draft || {}),
      id: createEntityId('plant'),
      name: resolvedName,
      species: isManualCreateFlow ? '' : (draft.species || '').trim(),
      emoji: isManualCreateFlow ? '🪴' : (draft.emoji || '🌿'),
      section: draft.section,
      freq: Number(draft.freq) || 3,
      waterLog: Array.isArray(draft.waterLog) ? draft.waterLog : [],
    };

    state.plants.push(plantToSync);
    state.detailPlantId = null;
    state.detailDraft = null;
    state.screenPlantDraft = null;

    if (isIdentifiedFlow) {
      resetIdentificationState();
    }

    navigateToView('plants');

    try {
      await syncPlantToCloud(plantToSync);
    } catch (error) {
      console.error('Failed to sync plant from screen', error);
      showToast('⚠️ La planta se guardó localmente, pero no pudimos sincronizarla');
      return;
    }

    showToast(`🌱 ${resolvedName} guardada`);
  }

  function openDeleteModal(plantId) {
    const state = getStateSnapshot();
    state.deletingSectionId = null;
    state.deletingPlantId = plantId;

    const plant = state.plants.find((item) => item.id === plantId);
    const modalTitle = document.getElementById('deleteModalTitle');
    const modalSubtitle = document.getElementById('deleteModalSubtitle');
    const modalName = document.getElementById('deleteConfirmName');
    const modal = document.getElementById('deleteModal');

    if (modalTitle) modalTitle.textContent = 'Eliminar planta';
    if (modalSubtitle) modalSubtitle.textContent = '¿Estás segur@ que deseas eliminar esta planta?';
    if (modalName) modalName.textContent = plant ? `${plant.name}` : '';
    if (modal) modal.classList.add('open');
  }

  async function confirmDeletePlant() {
    const {
      saveState,
      closeDeleteModal,
      render,
      navigateToView,
      deletePlantFromCloud,
      showToast,
    } = getPlantActionsContext();
    const state = getStateSnapshot();

    if (!state.deletingPlantId) return false;

    const plant = state.plants.find((item) => item.id === state.deletingPlantId);
    const plantId = state.deletingPlantId;
    state.plants = state.plants.filter((item) => item.id !== plantId);

    if (state.detailPlantId === plantId) {
      state.detailPlantId = null;
      state.detailDraft = null;
      navigateToView('plants', {
        scroll: false,
        renderView: false,
      });
    }

    saveState();
    closeDeleteModal();
    render();

    try {
      await deletePlantFromCloud(plantId);
    } catch (error) {
      console.error('Failed to delete plant in cloud', error);
      showToast('⚠️ Se eliminó localmente, pero no pudimos sincronizar el borrado');
      return true;
    }

    if (plant) showToast(`🗑️ ${plant.name} eliminada`);
    return true;
  }

  globalScope.musgoPlantActions = {
    openPlantDetail,
    openThirstyPlantsView,
    openPlantCreateView,
    updateScreenPlantField,
    updateDetailPlantField,
    setSection,
    waterPlant,
    savePlantDetail,
    savePlantFromScreen,
    openDeleteModal,
    confirmDeletePlant,
  };

  globalScope.openPlantDetail = openPlantDetail;
  globalScope.openThirstyPlantsView = openThirstyPlantsView;
  globalScope.openPlantCreateView = openPlantCreateView;
  globalScope.updateScreenPlantField = updateScreenPlantField;
  globalScope.updateDetailPlantField = updateDetailPlantField;
  globalScope.setSection = setSection;
  globalScope.waterPlant = waterPlant;
  globalScope.savePlantDetail = savePlantDetail;
  globalScope.savePlantFromScreen = savePlantFromScreen;
  globalScope.openDeleteModal = openDeleteModal;
})(window);
