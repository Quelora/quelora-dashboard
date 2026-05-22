/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/pages/ProfilePage.jsx
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Profile from '../components/Profile/Profile'; 

const ProfilePage = () => {
    const { t } = useTranslation();

    useEffect(() => {
        document.title = t('profile.title');
    }, [t]);

    return <Profile/>;
};

export default ProfilePage;