(function attachMusgoSpacesActions(globalScope) {
  function getSpacesActionsContext() {
    const getContext = globalScope.__musgoSpacesActionsContext;
    if (typeof getContext !== 'function') {
      throw new Error('musgo_spaces_actions_context_unavailable');
    }
    return getContext();
  }

  function getStateSnapshot() {
    return getSpacesActionsContext().getState();
  }

  function openEditSectionView(sectionId) {
    const { createSectionDraft, navigateToView } = getSpacesActionsContext();
    const state = getStateSnapshot();
    const section = state.sections.find((item) => item.id === sectionId);
    if (!section) return;

    state.editingSectionId = section.id;
    state.screenSectionDraft = createSectionDraft(section);
    navigateToView('editSpace', {
      trackMainView: false,
    });
  }

  function openCreateSectionView() {
    const { createSectionDraft, navigateToView } = getSpacesActionsContext();
    const state = getStateSnapshot();
    state.editingSectionId = null;
    state.screenSectionDraft = createSectionDraft();
    navigateToView('editSpace', {
      trackMainView: false,
    });
  }

  function cancelEditSectionView() {
    const state = getStateSnapshot();
    state.screenSectionDraft = null;
    state.editingSectionId = null;
    getSpacesActionsContext().navigateToView('spaces');
  }

  function updateScreenSectionName(value) {
    const state = getStateSnapshot();
    if (!state.screenSectionDraft) return;
    state.screenSectionDraft.name = value;
  }

  function setScreenSectionEmoji(emoji) {
    const { render } = getSpacesActionsContext();
    const state = getStateSnapshot();
    if (!state.screenSectionDraft) return;
    state.screenSectionDraft.icon = emoji;
    render();
  }

  async function waterSection(sectionId) {
    const {
      today,
      render,
      syncPlantToCloud,
      showToast,
    } = getSpacesActionsContext();
    const state = getStateSnapshot();
    const section = state.sections.find((item) => item.id === sectionId);
    if (!section) return;

    const plantsInSection = state.plants.filter((plant) => plant.section === sectionId);
    if (!plantsInSection.length) {
      showToast('⚠️ Esta sección no tiene plantas todavía');
      return;
    }

    const currentDay = today();
    const updatedPlants = [];
    plantsInSection.forEach((plant) => {
      if (!plant.waterLog) plant.waterLog = [];
      if (!plant.waterLog.includes(currentDay)) {
        plant.waterLog.push(currentDay);
        updatedPlants.push(plant);
      }
    });

    render();

    try {
      for (const plant of updatedPlants) {
        await syncPlantToCloud(plant);
      }
    } catch (error) {
      console.error('Failed to sync section watering', error);
      showToast('⚠️ Regamos localmente, pero no pudimos sincronizar toda la sección');
      return;
    }

    showToast(`💧 ${section.name} al día`);
  }

  function openDeleteSectionModal(sectionId) {
    const state = getStateSnapshot();
    state.deletingPlantId = null;
    state.deletingSectionId = sectionId;

    const section = state.sections.find((item) => item.id === sectionId);
    const modalTitle = document.getElementById('deleteModalTitle');
    const modalSubtitle = document.getElementById('deleteModalSubtitle');
    const modalName = document.getElementById('deleteConfirmName');
    const modal = document.getElementById('deleteModal');

    if (modalTitle) modalTitle.textContent = 'Eliminar espacio';
    if (modalSubtitle) modalSubtitle.textContent = '¿Estás segur@ que deseas eliminar este espacio?';
    if (modalName) modalName.textContent = section ? `${section.name}` : '';
    if (modal) modal.classList.add('open');
  }

  function closeDeleteModal() {
    const state = getStateSnapshot();
    state.deletingPlantId = null;
    state.deletingSectionId = null;

    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('open');
  }

  function editSectionFromSpaces(sectionId) {
    const state = getStateSnapshot();
    state.activeSection = sectionId;
    openEditSectionView(sectionId);
  }

  async function saveSectionChanges() {
    const {
      navigateToView,
      syncSectionToCloud,
      showToast,
    } = getSpacesActionsContext();
    const state = getStateSnapshot();
    const sectionId = state.editingSectionId || state.activeSection;
    const section = state.sections.find((item) => item.id === sectionId);
    if (!section) return;

    const nextName = (state.screenSectionDraft?.name || '').trim();
    if (!nextName) {
      showToast('⚠️ El nombre es obligatorio');
      return;
    }

    section.name = nextName;
    section.icon = state.screenSectionDraft?.icon || section.icon || '🪴';
    state.screenSectionDraft = null;
    state.editingSectionId = null;
    navigateToView('spaces');

    try {
      await syncSectionToCloud(section);
    } catch (error) {
      console.error('Failed to sync edited section', error);
      showToast('⚠️ La sección se actualizó localmente, pero no pudimos sincronizarla');
      return;
    }

    showToast(`✏️ Sección "${nextName}" actualizada`);
  }

  async function saveSectionFromScreen() {
    const {
      createEntityId,
      navigateToView,
      syncSectionToCloud,
      showToast,
    } = getSpacesActionsContext();
    const state = getStateSnapshot();
    const draft = state.screenSectionDraft;
    if (!draft) return;

    const nextName = (draft.name || '').trim();
    if (!nextName) {
      showToast('⚠️ El nombre es obligatorio');
      return;
    }

    if (state.editingSectionId) {
      await saveSectionChanges();
      return;
    }

    const section = {
      id: createEntityId('section'),
      name: nextName,
      icon: draft.icon || '🪴',
    };

    state.sections.push(section);
    state.screenSectionDraft = null;
    state.editingSectionId = null;
    navigateToView('spaces');

    try {
      await syncSectionToCloud(section);
    } catch (error) {
      console.error('Failed to sync created section from screen', error);
      showToast('⚠️ La sección se creó localmente, pero no pudimos sincronizarla');
      return;
    }

    showToast(`📍 Sección "${nextName}" creada`);
  }

  async function deleteCurrentSection() {
    const {
      isCloudSyncEnabled,
      deleteSectionFromCloud,
      navigateToView,
      showToast,
    } = getSpacesActionsContext();
    const state = getStateSnapshot();
    const sectionId = state.editingSectionId || state.activeSection;
    const section = state.sections.find((item) => item.id === sectionId);
    if (!section) return false;

    const affectedPlants = state.plants.filter((plant) => plant.section === sectionId);
    affectedPlants.forEach((plant) => {
      plant.section = '';
    });
    state.sections = state.sections.filter((item) => item.id !== sectionId);
    state.activeSection = 'all';
    state.screenSectionDraft = null;
    state.editingSectionId = null;
    navigateToView('spaces');

    try {
      if (isCloudSyncEnabled()) {
        await deleteSectionFromCloud(sectionId);
      }
    } catch (error) {
      console.error('Failed to delete section in cloud', error);
      showToast('⚠️ La sección se eliminó localmente, pero no pudimos sincronizar el borrado');
      return true;
    }

    showToast(`🗑️ Espacio "${section.name}" eliminado${affectedPlants.length ? ` y ${affectedPlants.length} planta${affectedPlants.length === 1 ? '' : 's'} quedaron sin asignar` : ''}`);
    return true;
  }

  async function deleteSectionFromScreen() {
    const state = getStateSnapshot();
    const sectionId = state.editingSectionId || state.activeSection;
    if (!sectionId) return;
    openDeleteSectionModal(sectionId);
  }

  async function confirmDeleteSection() {
    const state = getStateSnapshot();
    if (!state.deletingSectionId) return false;
    await deleteCurrentSection();
    closeDeleteModal();
    return true;
  }

  globalScope.musgoSpacesActions = {
    openEditSectionView,
    openCreateSectionView,
    cancelEditSectionView,
    updateScreenSectionName,
    setScreenSectionEmoji,
    waterSection,
    openDeleteSectionModal,
    closeDeleteModal,
    editSectionFromSpaces,
    saveSectionChanges,
    saveSectionFromScreen,
    deleteCurrentSection,
    deleteSectionFromScreen,
    confirmDeleteSection,
  };

  globalScope.openEditSectionView = openEditSectionView;
  globalScope.openCreateSectionView = openCreateSectionView;
  globalScope.cancelEditSectionView = cancelEditSectionView;
  globalScope.updateScreenSectionName = updateScreenSectionName;
  globalScope.setScreenSectionEmoji = setScreenSectionEmoji;
  globalScope.waterSection = waterSection;
  globalScope.openDeleteSectionModal = openDeleteSectionModal;
  globalScope.closeDeleteModal = closeDeleteModal;
  globalScope.editSectionFromSpaces = editSectionFromSpaces;
  globalScope.saveSectionFromScreen = saveSectionFromScreen;
  globalScope.deleteSectionFromScreen = deleteSectionFromScreen;
})(window);
