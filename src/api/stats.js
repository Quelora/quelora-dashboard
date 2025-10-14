// ./src/api/stats.js
import api from './axiosConfig';

export const fetchStats = async (cid = null, dateFrom = null, dateTo = null) => {
  try {
    const params = new URLSearchParams();
    
    if (cid) params.append('cid', cid);
    
    if (dateFrom) {
      const isoDateFrom = new Date(dateFrom).toISOString();
      params.append('dateFrom', isoDateFrom);
    }
    
    if (dateTo) {
      const isoDateTo = new Date(dateTo).toISOString();
      params.append('dateTo', isoDateTo);
    }

    const response = await api.get('/stats/get', {
      params: params
    });
    
    const adjustToClientTimezone = (dateHourString) => {
      const [datePart, utcHour] = dateHourString.split(' ');
      const utcDate = new Date(`${datePart}T${utcHour.padStart(2, '0')}:00:00Z`);
      const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      return utcDate.toLocaleString('en-CA', {
        timeZone: clientTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false
      })
      .replace(/(\d{4})-(\d{2})-(\d{2}),? (\d{2}).*/, '$1-$2-$3 $4');
    };

    if (response.data?.statsByHour) {
      response.data.statsByHour = response.data.statsByHour.map(stat => ({
        ...stat,
        dateHour: adjustToClientTimezone(stat.dateHour)
      }));
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

export const fetchGeoStats = async (cid = null, dateFrom = null, dateTo = null) => {
  try {
    const params = new URLSearchParams();
    
    if (cid) params.append('cid', cid);
    
    if (dateFrom) {
      const isoDateFrom = new Date(dateFrom).toISOString();
      params.append('dateFrom', isoDateFrom);
    }
    
    if (dateTo) {
      const isoDateTo = new Date(dateTo).toISOString();
      params.append('dateTo', isoDateTo);
    }

    const response = await api.get('/stats/get/geo', {
      params: params
    });
    
    const adjustToClientTimezone = (dateHourString) => {
      const [datePart, utcHour] = dateHourString.split(' ');
      const utcDate = new Date(`${datePart}T${utcHour.padStart(2, '0')}:00:00Z`);
      const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      return utcDate.toLocaleString('en-CA', {
        timeZone: clientTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hour12: false
      })
      .replace(/(\d{4})-(\d{2})-(\d{2}),? (\d{2}).*/, '$1-$2-$3 $4');
    };

    if (response.data?.statsByHour) {
      response.data.statsByHour = response.data.statsByHour.map(stat => ({
        ...stat,
        dateHour: adjustToClientTimezone(stat.dateHour)
      }));
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};


/**
 * @name fetchPostListStats
 * @description Fetches a paginated and sortable list of all posts with their metrics.
 * @param {string} cid - Client ID.
 * @param {Object} params - Pagination and sorting parameters (page, limit, sortBy, sortOrder, dateFrom, dateTo).
 * @returns {Promise<Object>} Paginated list of post statistics.
 */
export const fetchPostListStats = async (cid, params) => {
    try {
        const urlParams = new URLSearchParams();

        if (cid) urlParams.append('cid', cid);
        urlParams.append('page', params.page || 1);
        urlParams.append('limit', params.limit || 10);
        urlParams.append('sortBy', params.sortBy || 'viewsCount');
        urlParams.append('sortOrder', params.sortOrder || 'desc');
        
        if (params.dateFrom) urlParams.append('dateFrom', new Date(params.dateFrom).toISOString());
        if (params.dateTo) urlParams.append('dateTo', new Date(params.dateTo).toISOString());

        const response = await api.get('/stats/get/posts/list', {
            params: urlParams
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching post list stats:', error);
        throw error;
    }
};

/**
 * @name fetchPostAnalytics
 * @description Fetches detailed hourly and geographical analytics for a single post.
 * @param {string} entityId - The ObjectId (entity) of the post.
 * @param {string} cid - Client ID.
 * @param {Object} dates - Date range (dateFrom, dateTo).
 * @returns {Promise<Object>} Detailed post analytics.
 */
export const fetchPostAnalytics = async (entityId, cid, dates) => {
    try {
        const params = new URLSearchParams();
        
        if (cid) params.append('cid', cid);
        
        if (dates.dateFrom) {
            params.append('dateFrom', new Date(dates.dateFrom).toISOString());
        }
        
        if (dates.dateTo) {
            params.append('dateTo', new Date(dates.dateTo).toISOString());
        }

        const response = await api.get(`/stats/get/post/${entityId}`, {
            params: params
        });

        return response.data;
    } catch (error) {
        console.error(`Error fetching analytics for post ${entityId}:`, error);
        throw error;
    }
};