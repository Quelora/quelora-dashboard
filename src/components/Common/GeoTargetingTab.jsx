/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/components/Common/GeoTargetingTab.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import CustomTextField from './CustomTextField';

/**
 * Un componente reutilizable para la segmentación geográfica.
 * Espera `value` como el objeto geoTargeting y llama a `onChange`
 * con el objeto geoTargeting actualizado.
 */
const GeoTargetingTab = ({ value = { countries: [], regions: [], cities: [] }, onChange, t }) => {

    const handleInputChange = (e) => {
        const { name, value: stringValue } = e.target;
        
        // Convertir el string del input a un array
        const newArray = stringValue.split(',')
                                    .map(s => s.trim())
                                    .filter(Boolean);
        
        // Llamar al onChange del padre con el objeto de valor completo y actualizado
        onChange({
            ...value,
            [name]: newArray
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" gutterBottom>
                {t('survey.geoTargeting')}
            </Typography>
            <CustomTextField
                label={t('survey.countries')}
                name="countries"
                value={value.countries.join(', ')}
                onChange={handleInputChange}
                helperText={t('survey.countriesHelper')}
            />
            <CustomTextField
                label={t('survey.regions')}
                name="regions"
                value={value.regions.join(', ')}
                onChange={handleInputChange}
                helperText={t('survey.commaSeparated')}
            />
            <CustomTextField
                label={t('survey.cities')}
                name="cities"
                value={value.cities.join(', ')}
                onChange={handleInputChange}
                helperText={t('survey.commaSeparated')}
            />
        </Box>
    );
};

export default GeoTargetingTab;