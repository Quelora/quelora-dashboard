/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/hooks/useAdvertiserProfileModal.js
import { useState } from 'react';

const useAdvertiserProfileModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentProfile, setCurrentProfile] = useState(null);
    const [mode, setMode] = useState('create');

    const openModal = (profile = null) => {
        if (profile && profile._id) {
            setCurrentProfile(profile);
            setMode('edit');
        } else {
            setCurrentProfile(profile);
            setMode('create');
        }
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setCurrentProfile(null);
        setMode('create');
    };

    return {
        isOpen,
        currentProfile,
        mode,
        openModal,
        closeModal
    };
};

export default useAdvertiserProfileModal;