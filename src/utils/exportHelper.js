export const convertToCSV = (data, columns, delimiter = ',') => {
    if (!data || !data.length) return '';

    const headers = columns.map(col => `"${col.label}"`).join(delimiter);

    const rows = data.map(row => {
        return columns.map(col => {
            const keys = col.key.split('.');
            let value = row;
            keys.forEach(k => {
                value = (value && value[k] !== undefined) ? value[k] : '';
            });

            if (value === null || value === undefined) value = '';
            
            const stringValue = String(value).replace(/"/g, '""'); 
            return `"${stringValue}"`;
        }).join(delimiter);
    });

    return [headers, ...rows].join('\n');
};

export const exportToCSV = (data, filename, columns) => {
    const csvContent = convertToCSV(data, columns);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timeStamp = new Date().toISOString().slice(0, 10);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${timeStamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};