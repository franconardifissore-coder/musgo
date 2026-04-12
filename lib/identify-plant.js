(function attachPlantIdentificationClient(global) {
  const API_URL = 'https://hbojzifhocxygdojzqjn.supabase.co/functions/v1/identify-plant';

  /**
   * @typedef {Object} PlantReferenceImage
   * @property {string} url
   * @property {string|null} organ
   * @property {string|null} author
   *
   * @typedef {Object} PlantIdentificationResult
   * @property {string} scientificName
   * @property {number} confidence
   * @property {string[]} commonNames
   * @property {string|null} family
   * @property {string|null} genus
   * @property {PlantReferenceImage[]} referenceImages
   * @property {string|null} gbifId
   *
   * @typedef {Object} PlantIdentificationResponse
   * @property {string} bestMatch
   * @property {PlantIdentificationResult[]} results
   * @property {number|null} remainingIdentificationRequests
   */

  function mapResult(result) {
    return {
      scientificName: String(result?.scientificName || '').trim(),
      confidence: Number(result?.confidence || 0),
      commonNames: Array.isArray(result?.commonNames)
        ? result.commonNames.filter(Boolean).map(name => String(name).trim())
        : [],
      family: result?.family ? String(result.family).trim() : null,
      genus: result?.genus ? String(result.genus).trim() : null,
      referenceImages: Array.isArray(result?.referenceImages)
        ? result.referenceImages.filter(img => img && img.url)
        : [],
      gbifId: result?.gbifId ? String(result.gbifId) : null,
    };
  }

  /**
   * @param {File} file
   * @returns {Promise<PlantIdentificationResponse>}
   */
  async function identifyPlantFromImage(file) {
    if (!(file instanceof File)) {
      throw new Error('invalid_file');
    }

    const formData = new FormData();
    formData.append('image', file);

    let response;
    try {
      response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });
    } catch (cause) {
      const error = new Error('identify_network_error');
      error.code = 'identify_network_error';
      error.cause = cause;
      throw error;
    }

    let data = null;
    try {
      data = await response.json();
    } catch (cause) {
      if (response.ok) {
        const error = new Error('invalid_identification_response');
        error.code = 'invalid_identification_response';
        error.status = response.status;
        error.cause = cause;
        throw error;
      }
    }

    if (!response.ok) {
      const code = data && typeof data.error === 'string'
        ? data.error
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
        : `identify_request_failed_${response.status}`;
      const error = new Error(data && data.error ? data.error : `identify_request_failed_${response.status}`);
      error.code = code;
      error.status = response.status;
      error.payload = data;
      throw error;
    }

    if (!data || !Array.isArray(data.results)) {
      const error = new Error('invalid_identification_response');
      error.code = 'invalid_identification_response';
      error.status = response.status;
      throw error;
    }

    return {
      bestMatch: String(data.bestMatch || '').trim(),
      results: data.results.map(mapResult).filter(result => result.scientificName).slice(0, 3),
      remainingIdentificationRequests: Number.isFinite(Number(data.remainingIdentificationRequests))
        ? Number(data.remainingIdentificationRequests)
        : null,
    };
  }

  global.plantIdentificationClient = {
    identifyPlantFromImage,
  };
})(window);
