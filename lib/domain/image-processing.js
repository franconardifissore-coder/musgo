(function attachMusgoImageProcessing(globalScope) {

  // Reads a File and returns its contents as a base64 data URL.
  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('file_read_failed'));
      reader.readAsDataURL(file);
    });
  }

  // Creates an HTMLImageElement from a src URL and resolves when loaded.
  function loadImageElement(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('image_load_failed'));
      image.src = src;
    });
  }

  // Resizes and compresses a File to a max dimension of 1600px JPEG.
  // Used to prepare images for the PlantNet identification API.
  async function createAnalysisImageFile(file) {
    if (!(file instanceof File)) {
      throw new Error('invalid_file');
    }

    if (!String(file.type || '').startsWith('image/')) {
      return file;
    }

    const rawDataUrl = await fileToDataUrl(file);
    if (!rawDataUrl) {
      return file;
    }

    const image = await loadImageElement(rawDataUrl);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }

    const MAX_DIMENSION = 1600;
    let width = image.naturalWidth || image.width;
    let height = image.naturalHeight || image.height;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(result => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('image_encode_failed'));
        }
      }, 'image/jpeg', 0.86);
    });

    const safeName = String(file.name || 'plant')
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9_-]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'plant';

    return new File([blob], `${safeName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  }

  // Resizes and compresses a File to a base64 JPEG string suitable for
  // in-memory preview display (max 1280px, max ~900KB string length).
  async function createPersistableImagePreview(file) {
    const rawDataUrl = await fileToDataUrl(file);
    if (!rawDataUrl) return '';

    try {
      const image = await loadImageElement(rawDataUrl);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return rawDataUrl;

      const MAX_DIMENSION = 1280;
      const MAX_PREVIEW_LENGTH = 900000;
      let width = image.naturalWidth || image.width;
      let height = image.naturalHeight || image.height;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);

      const qualities = [0.86, 0.78, 0.7, 0.62, 0.54];
      for (const quality of qualities) {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        if (compressed.length <= MAX_PREVIEW_LENGTH) {
          return compressed;
        }
      }

      return canvas.toDataURL('image/jpeg', 0.46);
    } catch (error) {
      return rawDataUrl;
    }
  }

  // Returns the preview data URL, or an empty string if not set.
  function getPersistableImagePreview(dataUrl) {
    return dataUrl || '';
  }

  globalScope.musgoImageProcessing = {
    fileToDataUrl,
    loadImageElement,
    createAnalysisImageFile,
    createPersistableImagePreview,
    getPersistableImagePreview,
  };
})(window);
