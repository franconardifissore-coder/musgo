(function attachPlantMetadataClient(global) {
  const API_URL = 'https://hbojzifhocxygdojzqjn.supabase.co/functions/v1/plant-metadata';

  /**
   * @typedef {Object} PlantMetadata
   * @property {string} scientific_name
   * @property {string|null} common_name        nombre común en español
   * @property {string|null} origin             ej. "Sudeste asiático"
   * @property {'directa'|'indirecta'|null} light
   * @property {'alto'|'medio'|'bajo'|null} watering_level
   * @property {number|null} watering_freq_days  días entre riegos (1-30)
   * @property {Object} raw                     respuesta cruda del LLM
   * @property {string} source                  'haiku' | 'cache'
   * @property {string|null} model              ej. 'claude-haiku-4-5-20251001'
   * @property {string} fetched_at
   * @property {string} updated_at
   *
   * @typedef {Object} PlantMetadataResponse
   * @property {'cache'|'haiku'} source
   * @property {PlantMetadata|null} metadata
   * @property {string} [warning]
   */

  /**
   * Trae la metadata de cuidados de una planta a partir de su nombre científico.
   * La edge function chequea primero el cache en Supabase; si no está, llama a
   * Claude Haiku para generarla, la guarda y la devuelve.
   *
   * @param {string} scientificName ej. "Monstera deliciosa"
   * @param {Object} [opts]
   * @param {boolean} [opts.force=false] ignora cache y regenera con el LLM
   * @returns {Promise<PlantMetadataResponse>}
   */
  async function fetchPlantMetadata(scientificName, opts = {}) {
    if (typeof scientificName !== 'string' || !scientificName.trim()) {
      throw new Error('invalid_scientific_name');
    }

    let response;
    try {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scientificName: scientificName.trim(),
          force: Boolean(opts.force),
        }),
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
      source: data?.source === 'cache' ? 'cache' : 'haiku',
      metadata: data?.metadata ?? null,
      warning: typeof data?.warning === 'string' ? data.warning : undefined,
    };
  }

  global.plantMetadataClient = {
    fetchPlantMetadata,
  };
})(window);
