/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/hooks/useCampaignModal.js
import { useState } from 'react';

const useCampaignModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentCampaign, setCurrentCampaign] = useState(null);
    const [mode, setMode] = useState('create');

    const openModal = (campaign = null) => {
        if (campaign && campaign._id) {
            setCurrentCampaign(campaign);
            setMode('edit');
        } else {
            setCurrentCampaign(campaign);
            setMode('create');
        }
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setCurrentCampaign(null);
        setMode('create');
    };

    return {
        isOpen,
        currentCampaign,
        mode,
        openModal,
        closeModal
    };
};

export default useCampaignModal;