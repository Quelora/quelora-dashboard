/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import { useState } from 'react';

const usePlacementPricingModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentPricing, setCurrentPricing] = useState(null);
    const [mode, setMode] = useState('create');

    const openModal = (pricing = null) => {
        if (pricing && pricing._id) {
            setCurrentPricing(pricing);
            setMode('edit');
        } else {
            setCurrentPricing(pricing);
            setMode('create');
        }
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setCurrentPricing(null);
        setMode('create');
    };

    return {
        isOpen,
        currentPricing,
        mode,
        openModal,
        closeModal
    };
};

export default usePlacementPricingModal;