// src/components/EmbedLayout.jsx
import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';


const EmbedLayout = () => {
    return (
        <Box 
            component="main" 
            sx={{
                flexGrow: 1, 
                p: 3, 
                width: '100%', 
                minHeight: '100vh',
                boxSizing: 'border-box'
            }}
        >
            <Outlet />
        </Box>
    );
};

export default EmbedLayout;