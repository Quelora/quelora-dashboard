/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SetupWizard from '../components/Setup/SetupWizard';
import embedStorage from '../utils/embedStorage';

const RegisterPage = ({ toggleTheme, currentTheme }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = embedStorage.getItem('token');
        if (token) navigate('/client', { replace: true });
    }, [navigate]);

    return <SetupWizard toggleTheme={toggleTheme} currentTheme={currentTheme} />;
};

export default RegisterPage;
