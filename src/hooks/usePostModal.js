/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/hooks/usePostModal.js
import { useState } from 'react';

const usePostModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentPost, setCurrentPost] = useState(null);

    const openModal = (postData = null) => {
        setCurrentPost(postData);
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setCurrentPost(null);
    };

    return {
        isOpen,
        currentPost,
        openModal,
        closeModal,
        mode: currentPost?.entity ? 'edit' : 'create'
    };
};

export default usePostModal;