// ./src/components/Common/CustomTextField.jsx
import React from 'react';
import { TextField, styled } from '@mui/material';

const StyledTextField = styled(TextField)(({ theme, variant, error, helperText }) => ({
    margin: '8px 0',
    width: '100%',
    
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        fontSize: '0.875rem',
        backgroundColor: 'var(--acrylic-bg)',
        border: '1px solid var(--border-color)',
        transition: 'border-color var(--transition-default), box-shadow var(--transition-default)',

        '&:hover': {
            borderColor: 'var(--primary-color)',
            boxShadow: '0 2px 8px var(--shadow-color)',
        },
        
        '&.Mui-focused': {
            borderColor: 'var(--primary-blue) !important',
            boxBoxShadow: 'none',
            borderWidth: '2px',
        },
        
        '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
        },
    },

    '&.login-input .MuiFilledInput-root': {
        backgroundColor: 'rgba(235, 235, 240, 0.7) !important',
        borderRadius: '6px !important',
        border: '1px solid transparent !important',
        
        '&:hover': {
            backgroundColor: 'rgba(225, 225, 230, 0.7) !important',
        },

        '&.Mui-focused': {
            backgroundColor: 'var(--acrylic-bg) !important',
            border: '1px solid var(--primary-blue) !important',
        },
    },
    
    '& .MuiInputBase-input': {
        padding: 'var(--spacing-sm)',
    },

    '& .MuiFormHelperText-root': {
        marginLeft: 'unset',
        marginRight: 'unset',
    }
}));

// La prop InputProps debe ser pasada directamente al TextField
const CustomTextField = ({ className, inputProps, SelectProps, InputProps, ...props }) => {
    const inputClassName = props.variant === 'filled' ? `login-input ${className || ''}` : className;

    return (
        <StyledTextField 
            variant="outlined" 
            size="small" 
            InputProps={InputProps}
            inputProps={inputProps}
            SelectProps={SelectProps}
            {...props} 
            className={inputClassName}
        />
    );
};

export default CustomTextField;