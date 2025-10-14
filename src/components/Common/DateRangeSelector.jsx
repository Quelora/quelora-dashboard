import { useState, useEffect } from 'react';
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
    const [dateFrom, setDateFrom] = useState(propDateFrom || null);
    const [dateTo, setDateTo] = useState(propDateTo || null);
    const [activeButton, setActiveButton] = useState(null);

    // FUNCIÓN DE DISPARO UNIFICADA Y RETROCOMPATIBLE
    const dispatchChange = (from, to) => {
        // 1. Prioriza el nuevo formato (PostStatsPage)
        if (onRangeChange) {
            onRangeChange({ dateFrom: from, dateTo: to });
        } 
        // 2. Si no está, usa el formato antiguo (otros componentes)
        else if (onDateRangeChange) {
            // Se asume que el componente antiguo espera los objetos Date como argumentos separados
            onDateRangeChange(from, to); 
        }
    };
    
    // EFECTO: Sincroniza el estado local con los props de fecha que vienen del padre.
    useEffect(() => {
        setDateFrom(propDateFrom);
        setDateTo(propDateTo);
    }, [propDateFrom, propDateTo]);


    const handleQuickRangeSelect = (range) => {
        const today = new Date();
        let fromDate, toDate;

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
        
        // Llamada unificada para recargar
        dispatchChange(fromDate, toDate);
    };

    const handleDateFromChange = (newValue) => {
        setActiveButton(null); 
        if (newValue && dateTo && newValue > dateTo) {
            setDateFrom(newValue);
            setDateTo(newValue);
        } else {
            setDateFrom(newValue);
        }
    };

    const handleDateToChange = (newValue) => {
        setActiveButton(null); 
        if (newValue && dateFrom && newValue < dateFrom) {
            setDateTo(newValue);
            setDateFrom(newValue);
        } else {
            setDateTo(newValue);
        }
    };

    const handleCustomRangeSelect = () => {
        if (dateFrom && dateTo) {
            setActiveButton('custom');
            
            // Llamada unificada para recargar
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
                            value={dateFrom}
                            onChange={handleDateFromChange}
                            slotProps={{ 
                                textField: { 
                                    size: 'small',
                                    sx: { 
                                        width: { xs: '100%', sm: 160 },
                                        '& .MuiPickersSectionList-root': { padding: '4px' },
                                        '& .MuiPickersInputBase-sectionsContainer': { padding: '4px' },
                                        '& .css-1524bp8-MuiPickersSectionList-root-MuiPickersInputBase-sectionsContainer-MuiPickersOutlinedInput-sectionsContainer': { padding: '4px' }
                                    },
                                    placeholder: t('common.rangedate.from')
                                } 
                            }}
                        />
                        <DatePicker
                            value={dateTo}
                            onChange={handleDateToChange}
                            slotProps={{ 
                                textField: { 
                                    size: 'small',
                                    sx: { 
                                        width: { xs: '100%', sm: 160 },
                                        '& .MuiPickersSectionList-root': { padding: '4px' },
                                        '& .MuiPickersInputBase-sectionsContainer': { padding: '4px' },
                                        '& .css-1524bp8-MuiPickersSectionList-root-MuiPickersInputBase-sectionsContainer-MuiPickersOutlinedInput-sectionsContainer': { padding: '4px' }
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