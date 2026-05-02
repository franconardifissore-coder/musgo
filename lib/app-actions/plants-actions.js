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
    getPlantActionsContext().navigateToView('plants', { scroll: false });
    // Scroll the active chip into view after render
    requestAnimationFrame(() => {
      const active = document.querySelector('.filter-chip.active');
      if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
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
      uploadPlantImage,
      showToast,
    } = getPlantActionsContext();
    const state = getStateSnapshot();
    const draft = state.screenPlantDraft || createPlantDraft();
    const isIdentifiedFlow = Boolean(draft.identifiedSpecies);
    const isManualCreateFlow = !isIdentifiedFlow;

    const resolvedName = (draft.name || '').trim() || (draft.species || '').trim() || 'Planta sin nombre';
    const plantId = createEntityId('plant');
    const plantToSync = {
      ...(draft || {}),
      id: plantId,
      name: resolvedName,
      species: isManualCreateFlow ? '' : (draft.species || '').trim(),
      emoji: isManualCreateFlow ? '🪴' : (draft.emoji || '🌿'),
      section: draft.section,
      freq: Number(draft.freq) || 3,
      waterLog: Array.isArray(draft.waterLog) ? draft.waterLog : [],
    };

    // If the plant has a base64 image preview and we have the original file,
    // upload it to Supabase Storage and replace the base64 with the URL.
    const imageFile = state.identification && state.identification.file;
    const userId = state.auth && state.auth.user && state.auth.user.id;
    const hasBase64Preview = typeof plantToSync.imagePreview === 'string' && plantToSync.imagePreview.startsWith('data:');

    if (imageFile instanceof File && hasBase64Preview && userId && typeof uploadPlantImage === 'function') {
      try {
        const imageUrl = await uploadPlantImage(plantId, userId, imageFile);
        if (imageUrl) {
          plantToSync.imagePreview = imageUrl;
        }
      } catch (uploadError) {
        // Non-fatal: keep the base64 as fallback so the plant still saves
        console.warn('[storage] Image upload failed, keeping base64 preview', uploadError);
      }
    }

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
      deletePlantImage,
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

    // Best-effort: delete the image from Storage if it's a Storage URL (not base64)
    if (
      plant &&
      plant.imagePreview &&
      typeof plant.imagePreview === 'string' &&
      !plant.imagePreview.startsWith('data:') &&
      plant.imagePreview.includes('supabase') &&
      typeof deletePlantImage === 'function'
    ) {
      try {
        await deletePlantImage(plant.imagePreview);
      } catch (err) {
        // Non-fatal: the image may already be gone or the URL may not be a Storage URL
        console.warn('[storage] Failed to delete plant image', err);
      }
    }

    if (plant) showToast(`🗑️ ${plant.name} eliminada`);
    return true;
  }

  // ===== PHOTO TIMELINE ACTIONS =====

  async function loadPlantPhotos(plantId) {
    const { fetchPlantPhotos, render } = getPlantActionsContext();
    const state = getStateSnapshot();

    if (!state.plantPhotos[plantId]) {
      state.plantPhotos[plantId] = { photos: [], loading: false, error: '' };
    }
    const bucket = state.plantPhotos[plantId];
    if (bucket.loading) return;

    bucket.loading = true;
    bucket.error = '';
    render();

    try {
      const photos = await fetchPlantPhotos(plantId);
      bucket.photos = photos;
    } catch (err) {
      console.error('[photos] Failed to load photos', err);
      bucket.error = 'No pudimos cargar las fotos.';
    } finally {
      bucket.loading = false;
      render();
    }
  }

  function openPhotoUploadModal(plantId) {
    const state = getStateSnapshot();
    const { render } = getPlantActionsContext();
    state.photoUpload = {
      open: true,
      plantId,
      file: null,
      preview: '',
      note: '',
      loading: false,
      error: '',
    };
    render();
  }

  function closePhotoUploadModal() {
    const state = getStateSnapshot();
    const { render } = getPlantActionsContext();
    state.photoUpload = {
      open: false,
      plantId: null,
      file: null,
      preview: '',
      note: '',
      loading: false,
      error: '',
    };
    render();
  }

  function photoUploadFileSelected(file) {
    const state = getStateSnapshot();
    const { render } = getPlantActionsContext();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      state.photoUpload.file = file;
      state.photoUpload.preview = e.target.result;
      render();
    };
    reader.readAsDataURL(file);
  }

  function photoUploadNoteChanged(note) {
    const state = getStateSnapshot();
    state.photoUpload.note = note;
  }

  async function confirmUploadPhoto() {
    const { uploadPlantPhoto, savePlantPhoto, render, showToast } = getPlantActionsContext();
    const state = getStateSnapshot();
    const upload = state.photoUpload;

    if (!upload.file || !upload.plantId) return;

    const userId = state.auth && state.auth.user && state.auth.user.id;
    if (!userId) {
      upload.error = 'Tenés que estar logueado para subir fotos.';
      render();
      return;
    }

    upload.loading = true;
    upload.error = '';
    render();

    try {
      // Compress & convert to JPEG File before upload
      const jpegFile = await compressToJpeg(upload.file);
      const url = await uploadPlantPhoto(upload.plantId, userId, jpegFile);
      const photo = await savePlantPhoto(upload.plantId, userId, url, upload.note.trim() || null);

      // Prepend to local cache
      if (!state.plantPhotos[upload.plantId]) {
        state.plantPhotos[upload.plantId] = { photos: [], loading: false, error: '' };
      }
      state.plantPhotos[upload.plantId].photos.unshift(photo);

      state.photoUpload = {
        open: false,
        plantId: null,
        file: null,
        preview: '',
        note: '',
        loading: false,
        error: '',
      };
      render();
      showToast('📸 Foto guardada');
    } catch (err) {
      console.error('[photos] Upload failed', err);
      upload.loading = false;
      upload.error = 'No pudimos guardar la foto. Intentá de nuevo.';
      render();
    }
  }

  // Compresses a File/Blob to a JPEG File at max 1200px wide, quality 0.82.
  function compressToJpeg(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('canvas_to_blob_failed')); return; }
          resolve(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.82);
      };
      img.onerror = reject;
      img.src = objectUrl;
    });
  }

  function openPhotoLightbox(photoId, plantId) {
    const state = getStateSnapshot();
    const { render } = getPlantActionsContext();
    const bucket = state.plantPhotos[plantId];
    if (!bucket) return;
    const photo = bucket.photos.find((p) => p.id === photoId);
    if (!photo) return;
    state.photoLightbox = {
      open: true,
      url: photo.url,
      note: photo.note || '',
      takenAt: photo.takenAt,
      photoId: photo.id,
      plantId,
    };
    render();
  }

  function closePhotoLightbox() {
    const state = getStateSnapshot();
    const { render } = getPlantActionsContext();
    state.photoLightbox = { open: false, url: '', note: '', takenAt: '', photoId: null, plantId: null };
    render();
  }

  async function confirmDeletePhoto() {
    const { deletePhotoEntry, render, showToast } = getPlantActionsContext();
    const state = getStateSnapshot();
    const { photoId, plantId, url } = state.photoLightbox;
    if (!photoId || !plantId) return;

    try {
      await deletePhotoEntry(photoId, url);
      const bucket = state.plantPhotos[plantId];
      if (bucket) {
        bucket.photos = bucket.photos.filter((p) => p.id !== photoId);
      }
      state.photoLightbox = { open: false, url: '', note: '', takenAt: '', photoId: null, plantId: null };
      render();
      showToast('🗑️ Foto eliminada');
    } catch (err) {
      console.error('[photos] Delete failed', err);
      showToast('⚠️ No pudimos eliminar la foto');
    }
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
    loadPlantPhotos,
    openPhotoUploadModal,
    closePhotoUploadModal,
    photoUploadFileSelected,
    photoUploadNoteChanged,
    confirmUploadPhoto,
    openPhotoLightbox,
    closePhotoLightbox,
    confirmDeletePhoto,
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
  globalScope.loadPlantPhotos = loadPlantPhotos;
  globalScope.openPhotoUploadModal = openPhotoUploadModal;
  globalScope.closePhotoUploadModal = closePhotoUploadModal;
  globalScope.photoUploadFileSelected = photoUploadFileSelected;
  globalScope.photoUploadNoteChanged = photoUploadNoteChanged;
  globalScope.confirmUploadPhoto = confirmUploadPhoto;
  globalScope.openPhotoLightbox = openPhotoLightbox;
  globalScope.closePhotoLightbox = closePhotoLightbox;
  globalScope.confirmDeletePhoto = confirmDeletePhoto;
})(window);
