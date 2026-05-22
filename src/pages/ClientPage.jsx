/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/pages/ClientPage.jsx
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Client from '../components/Client/Client';

const ClientePage = () => {
    const { t } = useTranslation();

    useEffect(() => {
        document.title = t('client.title');
    }, [t]);

    return <Client/>;
};

export default ClientePage;