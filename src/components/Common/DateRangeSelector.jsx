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

const isSameDay = (date1, date2) => {
    return date1 && date2 && date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
};

const isTodayRange = (from, to) => {
    if (!from || !to) return false;
    
    const today = new Date();
    
    if (!isSameDay(from, today) || !isSameDay(to, today)) {
        return false;
    }
    
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0); 
    
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999); 
    
    return from.getTime() === startOfToday.getTime() && to.getTime() === endOfToday.getTime();
};

const DateRangeSelector = ({ 
    onRangeChange, 
    onDateRangeChange, 
    dateFrom: propDateFrom, 
    dateTo: propDateTo 
}) => {
    const { t } = useTranslation();
    
    const initialDateFrom = propDateFrom ?? null;
    const initialDateTo = propDateTo ?? null;

    const [dateFrom, setDateFrom] = useState(initialDateFrom);
    const [dateTo, setDateTo] = useState(initialDateTo);
    const [activeButton, setActiveButton] = useState(isTodayRange(initialDateFrom, initialDateTo) ? 'today' : null);

    // Función de despacho unificada para manejar ambos patrones de callback
    const dispatchChange = (from, to) => {
        if (onRangeChange) {
            onRangeChange({ dateFrom: from, dateTo: to });
        } 
        // Esta es la lógica usada en Dashboard.jsx
        if (onDateRangeChange) {
            onDateRangeChange(from, to); 
        }
    };
    
    useEffect(() => {
        const newDateFrom = propDateFrom ?? null;
        const newDateTo = propDateTo ?? null;
        
        setDateFrom(newDateFrom);
        setDateTo(newDateTo);
        setActiveButton(isTodayRange(newDateFrom, newDateTo) ? 'today' : null);
    }, [propDateFrom?.getTime(), propDateTo?.getTime()]);


    const handleQuickRangeSelect = (range) => {
        const today = new Date();
        let fromDate, toDate;
        
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        switch (range) {
            case 'today':
                fromDate = startOfDay;
                toDate = endOfDay;
                break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                fromDate = new Date(yesterday);
                fromDate.setHours(0, 0, 0, 0);
                toDate = new Date(yesterday);
                toDate.setHours(23, 59, 59, 999);
                break;
            case 'lastWeek':
                fromDate = new Date(today);
                fromDate.setDate(fromDate.getDate() - 7);
                fromDate.setHours(0, 0, 0, 0);
                toDate = endOfDay;
                break;
            case 'lastMonth':
                fromDate = new Date(today);
                fromDate.setMonth(fromDate.getMonth() - 1);
                fromDate.setHours(0, 0, 0, 0);
                toDate = endOfDay;
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