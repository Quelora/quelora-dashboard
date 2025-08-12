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