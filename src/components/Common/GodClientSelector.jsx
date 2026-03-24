import React, { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogContentText,
    Autocomplete, 
    TextField, 
    CircularProgress,
    Button,
    DialogActions
} from '@mui/material';
import { searchClients } from '../../api/admin';
import useDebounce from '../../hooks/useDebounce';
import { useTranslation } from 'react-i18next';

const GodClientSelector = ({ open, onClientSelected, onClose }) => {

    const { t } = useTranslation();

    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [value, setValue] = useState(null);
    
    const debouncedInputValue = useDebounce(inputValue, 500);

    useEffect(() => {
        let active = true;

        if (debouncedInputValue === '') {
            setOptions([]);
            return undefined;
        }

        setLoading(true);

        (async () => {
            try {
                const results = await searchClients(debouncedInputValue);
                if (active) {
                    setOptions(results || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [debouncedInputValue]);

    const handleSubmit = () => {
        if (value && value.cid) {
            onClientSelected(value);
        }
    };

    return (
        <Dialog
            open={open}
            disableEscapeKeyDown={!onClose}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                {t('common.godClientSelector.title')}
            </DialogTitle>

            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    {t('common.godClientSelector.description')}
                </DialogContentText>
                
                <Autocomplete
                    id="god-client-search"
                    getOptionLabel={(option) => `${option.description} (${option.cid})`}
                    filterOptions={(x) => x}
                    options={options}
                    autoComplete
                    includeInputInList
                    filterSelectedOptions
                    value={value}
                    onChange={(event, newValue) => setValue(newValue)}
                    onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
                    loading={loading}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={t('common.godClientSelector.searchLabel')}
                            fullWidth
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                />
            </DialogContent>

            <DialogActions>
                {onClose && (
                    <Button onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                )}
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={!value}
                >
                    {t('common.godClientSelector.confirmAccess')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GodClientSelector;
