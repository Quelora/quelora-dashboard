// filepath: ./src/hooks/useSurveyModal.js
import { useState } from 'react';

const useSurveyModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentSurvey, setCurrentSurvey] = useState(null);

    const openModal = (surveyData = null) => {
        setCurrentSurvey(surveyData);
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setCurrentSurvey(null);
    };

    return {
        isOpen,
        currentSurvey,
        openModal,
        closeModal,
        mode: currentSurvey?._id ? 'edit' : 'create'
    };
};

export default useSurveyModal;