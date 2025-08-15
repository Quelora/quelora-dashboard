import api from './axiosConfig';

/**
 * Obtiene logs del sistema
 * @param {Object} params - Parámetros de consulta
 * @param {string} [params.from] - Fecha de inicio (timestamp)
 * @param {string} [params.level] - Nivel de log (error, warn, info, debug)
 * @returns {Promise<Array>} Array de logs
 */
export const getLogs = async (params = {}) => {
  try {
    // Asegurarnos de que el parámetro from esté en el formato correcto
    const queryParams = {};
    if (params.from) {
      queryParams.from = params.from;
    }
    if (params.level && params.level !== 'all') {
      queryParams.level = params.level;
    }

    const response = await api.get('/client/logs', {
      params: queryParams
    });
    
    // Ordenamos los logs por tiempo (más recientes primero)
    return response.data?.sort((a, b) => 
      new Date(b.time) - new Date(a.time)
    ) || [];
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw error;
  }
};