(function attachPlantIdentificationClient(global) {
  const API_URL = 'https://hbojzifhocxygdojzqjn.supabase.co/functions/v1/identify-plant';

  /**
   * @typedef {Object} PlantIdentificationResult
   * @property {string} scientificName
   * @property {number} confidence
   * @property {string[]} commonNames
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

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`identify_request_failed_${response.status}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.results)) {
      throw new Error('invalid_identification_response');
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
