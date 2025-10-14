import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Box,
    Button, 
    ButtonGroup, 
    Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const DateRangeSelector = ({ 
    onRangeChange, 
    onDateRangeChange, 
    dateFrom: propDateFrom, 
    dateTo: propDateTo 
}) => {
    const { t } = useTranslation();
    // FIX: El estado inicial ya es seguro: null si el prop es undefined.
    const [dateFrom, setDateFrom] = useState(propDateFrom || null);
    const [dateTo, setDateTo] = useState(propDateTo || null);
    const [activeButton, setActiveButton] = useState(null);

    // FUNCIÓN DE DISPARO UNIFICADA Y RETROCOMPATIBLE
    const dispatchChange = (from, to) => {
        if (onRangeChange) {
            onRangeChange({ dateFrom: from, dateTo: to });
        } 
        else if (onDateRangeChange) {
            onDateRangeChange(from, to); 
        }
    };
    
    // CORRECCIÓN CLAVE: Asegura que el valor de sincronización nunca sea 'undefined'.
    useEffect(() => {
        // Usa el operador de coalescencia nula (??) o un OR para asegurar null en lugar de undefined.
        setDateFrom(propDateFrom ?? null);
        setDateTo(propDateTo ?? null);
    }, [propDateFrom, propDateTo]);


    const handleQuickRangeSelect = (range) => {
        const today = new Date();
        let fromDate, toDate;

        // ... (Tu lógica de cálculo de rangos se mantiene igual)
        switch (range) {
            case 'today':
                fromDate = new Date(today);
                toDate = new Date(today);
                break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                fromDate = yesterday;
                toDate = yesterday;
                break;
            case 'lastWeek':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - 7);
                toDate = new Date(today);
                break;
            case 'lastMonth':
                fromDate = new Date(today);
                fromDate.setMonth(fromDate.getMonth() - 1);
                toDate = new Date(today);
                break;
            default:
                return;
        }

        setDateFrom(fromDate);
        setDateTo(toDate);
        setActiveButton(range);
        
        dispatchChange(fromDate, toDate);
    };

    const handleDateFromChange = (newValue) => {
        setActiveButton(null); 
        // El DatePicker de MUI X asegura que newValue es null o Date, no undefined.
        if (newValue && dateTo && newValue > dateTo) {
            setDateFrom(newValue);
            setDateTo(newValue);
        } else {
            setDateFrom(newValue);
        }
    };

    const handleDateToChange = (newValue) => {
        setActiveButton(null); 
        // El DatePicker de MUI X asegura que newValue es null o Date, no undefined.
        if (newValue && dateFrom && newValue < dateFrom) {
            setDateTo(newValue);
            setDateFrom(newValue);
        } else {
            setDateTo(newValue);
        }
    };

    const handleCustomRangeSelect = () => {
        // FIX: Se deben despachar los valores aunque sean null si el usuario así lo decide. 
        // No obstante, mantenemos la verificación por el botón 'disabled'.
        if (dateFrom && dateTo) {
            setActiveButton('custom');
            dispatchChange(dateFrom, dateTo); 
        }
    };

    return (
        <Box sx={{ 
            display: 'flex',
            justifyContent: 'flex-end',
            mb: 2,
            width: '100%'
        }}>
            <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                alignItems={{ xs: 'stretch', sm: 'center' }} 
                spacing={{ xs: 1, sm: 1 }}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
                <ButtonGroup 
                    variant="outlined" 
                    size="small" 
                    sx={{ 
                        mr: { sm: 1 }, 
                        mb: { xs: 1, sm: 0 },
                        flexWrap: { xs: 'wrap', sm: 'nowrap' },
                        justifyContent: { xs: 'center', sm: 'flex-start' }
                    }}
                >
                    <Button 
                        onClick={() => handleQuickRangeSelect('today')}
                        variant={activeButton === 'today' ? 'contained' : 'outlined'}
                        sx={{ flex: { xs: '1 1 45%', sm: 'auto' }, m: { xs: 0.5, sm: 0 } }}
                    >
                        {t('common.rangedate.today')}
                    </Button>
                    <Button 
                        onClick={() => handleQuickRangeSelect('yesterday')}
                        variant={activeButton === 'yesterday' ? 'contained' : 'outlined'}
                        sx={{ flex: { xs: '1 1 45%', sm: 'auto' }, m: { xs: 0.5, sm: 0 } }}
                    >
                        {t('common.rangedate.yesterday')}
                    </Button>
                    <Button 
                        onClick={() => handleQuickRangeSelect('lastWeek')}
                        variant={activeButton === 'lastWeek' ? 'contained' : 'outlined'}
                        sx={{ flex: { xs: '1 1 45%', sm: 'auto' }, m: { xs: 0.5, sm: 0 } }}
                    >
                        {t('common.rangedate.last_week')}
                    </Button>
                    <Button 
                        onClick={() => handleQuickRangeSelect('lastMonth')}
                        variant={activeButton === 'lastMonth' ? 'contained' : 'outlined'}
                        sx={{ flex: { xs: '1 1 45%', sm: 'auto' }, m: { xs: 0.5, sm: 0 } }}
                    >
                        {t('common.rangedate.last_month')}
                    </Button>
                </ButtonGroup>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        spacing={{ xs: 1, sm: 1 }}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                        <DatePicker
                            // CORRECCIÓN: el valor siempre será Date o null
                            value={dateFrom}
                            onChange={handleDateFromChange}
                            slotProps={{ 
                                textField: { 
                                    size: 'small',
                                    sx: { 
                                        width: { xs: '100%', sm: 160 },
                                        // Estilos para evitar el warning 'MuiPickersSectionList'
                                        '& .MuiPickersSectionList-root': { padding: '4px' },
                                        '& .MuiPickersInputBase-sectionsContainer': { padding: '4px' },
                                        // FIX: Si el componente es de MUI X v6 o superior, la clase 'css-...' es innecesaria y podría ser inestable.
                                        // Es mejor confiar en las clases con nombre de MUI.
                                    },
                                    placeholder: t('common.rangedate.from')
                                } 
                            }}
                        />
                        <DatePicker
                            // CORRECCIÓN: el valor siempre será Date o null
                            value={dateTo}
                            onChange={handleDateToChange}
                            slotProps={{ 
                                textField: { 
                                    size: 'small',
                                    sx: { 
                                        width: { xs: '100%', sm: 160 },
                                        '& .MuiPickersSectionList-root': { padding: '4px' },
                                        '& .MuiPickersInputBase-sectionsContainer': { padding: '4px' },
                                    },
                                    placeholder: t('common.rangedate.to')
                                } 
                            }}
                        />
                        <Button 
                            variant="contained" 
                            size="small"
                            onClick={handleCustomRangeSelect}
                            disabled={!dateFrom || !dateTo}
                            sx={{ 
                                minWidth: { xs: '100%', sm: 80 },
                                mt: { xs: 1, sm: 0 }
                            }}
                        >
                            {t('common.rangedate.apply')}
                        </Button>
                    </Stack>
                </LocalizationProvider>
            </Stack>
        </Box>
    );
};

export default DateRangeSelector;