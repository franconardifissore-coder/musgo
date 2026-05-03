(function attachPlantMetadataClient(global) {
  const API_URL = 'https://hbojzifhocxygdojzqjn.supabase.co/functions/v1/plant-metadata';

  /**
   * @typedef {Object} PlantMetadata
   * @property {string} scientific_name
   * @property {number|null} perenual_id
   * @property {string|null} common_name
   * @property {string|null} family
   * @property {string|null} type
   * @property {string|null} cycle
   * @property {string|null} watering
   * @property {string|null} watering_benchmark_value
   * @property {string|null} watering_benchmark_unit
   * @property {string[]|null} sunlight
   * @property {string[]|null} origin
   * @property {Object} raw
   * @property {string} source
   * @property {string} fetched_at
   * @property {string} updated_at
   *
   * @typedef {Object} PlantMetadataResponse
   * @property {'cache'|'perenual'} source
   * @property {PlantMetadata|null} metadata
   * @property {boolean} [notFound]
   * @property {string} [warning]
   */

  /**
   * Trae la metadata de una planta a partir de su nombre científico.
   * Primero pega contra la edge function, que internamente decide si
   * sirve desde el cache de Supabase o si llama a Perenual.
   *
   * @param {string} scientificName ej. "Monstera deliciosa"
   * @returns {Promise<PlantMetadataResponse>}
   */
  async function fetchPlantMetadata(scientificName) {
    if (typeof scientificName !== 'string' || !scientificName.trim()) {
      throw new Error('invalid_scientific_name');
    }

    let response;
    try {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scientificName: scientificName.trim() }),
      });
    } catch (cause) {
      const error = new Error('plant_metadata_network_error');
      error.code = 'plant_metadata_network_error';
      error.cause = cause;
      throw error;
    }

    let data = null;
    try {
      data = await response.json();
    } catch (cause) {
      if (response.ok) {
        const error = new Error('invalid_plant_metadata_response');
        error.code = 'invalid_plant_metadata_response';
        error.status = response.status;
        error.cause = cause;
        throw error;
      }
    }

    if (!response.ok) {
      const code = data && typeof data.error === 'string'
        ? data.error.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
        : `plant_metadata_request_failed_${response.status}`;
      const error = new Error(data && data.error ? data.error : code);
      error.code = code;
      error.status = response.status;
      error.payload = data;
      throw error;
    }

    return {
      source: data?.source === 'cache' ? 'cache' : 'perenual',
      metadata: data?.metadata ?? null,
      notFound: Boolean(data?.notFound),
      warning: typeof data?.warning === 'string' ? data.warning : undefined,
    };
  }

  global.plantMetadataClient = {
    fetchPlantMetadata,
  };
})(window);
