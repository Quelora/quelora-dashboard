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