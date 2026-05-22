/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import { useState } from 'react';

const usePlacementModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentPlacement, setCurrentPlacement] = useState(null);
    const [mode, setMode] = useState('create');

    const openModal = (placement = null) => {
        if (placement && placement._id) {
            setCurrentPlacement(placement);
            setMode('edit');
        } else {
            setCurrentPlacement(placement);
            setMode('create');
        }
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setCurrentPlacement(null);
        setMode('create');
    };

    return {
        isOpen,
        currentPlacement,
        mode,
        openModal,
        closeModal
    };
};

export default usePlacementModal;