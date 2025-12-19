import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getSurvey } from '../api/surveys';

const getDefaultFormData = (data) => {
    const initialData = data || {};
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const formattedPosts = initialData.posts && Array.isArray(initialData.posts) 
        ? initialData.posts.map(p => {
            if (typeof p === 'object' && p._id && p.title) {
                return { _id: p._id, entity: p.entity, title: p.title };
            }
            if (typeof p === 'string') {
                return { _id: p };
            }
            if (typeof p === 'object' && p._id) {
                return { _id: p._id };
            }
            return null;
        }).filter(p => p && p._id)
        : [];
    
    // Support legacy single 'cid' or new 'cids' array
    let initialCids = initialData.cids || [];
    if (initialCids.length === 0 && initialData.cid) {
        initialCids = [initialData.cid];
    }
    // Fallback to current session CID if creating new and no data provided
    if (initialCids.length === 0 && !initialData._id) {
        const sessionCid = sessionStorage.getItem('currentCid');
        if (sessionCid) initialCids = [sessionCid];
    }

    return {
        cids: initialCids,
        question: initialData.question || '',
        requiresAuth: initialData.requiresAuth !== undefined ? initialData.requiresAuth : true,
        showResultsAfterVote: initialData.showResultsAfterVote !== undefined ? initialData.showResultsAfterVote : true,
        options: initialData.options && initialData.options.length >= 2 ? initialData.options : [
            { text: '', votesCount: 0 },
            { text: '', votesCount: 0 }
        ],
        posts: formattedPosts,
        startTime: initialData.startTime || new Date().toISOString(),
        endTime: initialData.endTime || tomorrow.toISOString(),
        geoTargeting: {
            countries: initialData.geoTargeting?.countries || [],
            regions: initialData.geoTargeting?.regions || [],
            cities: initialData.geoTargeting?.cities || [],
        },
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
        viewsCount: initialData.viewsCount || 0,
        isDeleted: initialData.isDeleted || false,
        priority: initialData.priority || 0,
        ...initialData,
    };
};

const useSurveyForm = (initialData = {}, mode = 'create') => {
    const { t } = useTranslation();
    
    const [formData, setFormData] = useState(() => getDefaultFormData(initialData));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const processedIdRef = useRef(null);
    const isFetchingRef = useRef(false);
    
    const surveyId = initialData?._id;

    useEffect(() => {
        if (isFetchingRef.current) {
            return;
        }

        if (surveyId === processedIdRef.current) {
            return;
        }

        const postsAreIncomplete = initialData?.posts?.length > 0 &&
            initialData.posts.some(p => typeof p === 'string' || (typeof p === 'object' && !p.title));
        
        const needsLoad = mode === 'edit' && surveyId && (postsAreIncomplete || !initialData.question);

        if (needsLoad) {
            const loadSurveyData = async () => {
                isFetchingRef.current = true;
                setLoading(true);
                setError(null);
                
                try {
                    const response = await getSurvey(surveyId);
                    setFormData(getDefaultFormData(response.data));
                    processedIdRef.current = surveyId;
                } catch (err) {
                    setError(err.response?.data?.error || t('survey.errorLoading'));
                    processedIdRef.current = null;
                } finally {
                    setLoading(false);
                    isFetchingRef.current = false;
                }
            };
            
            loadSurveyData();

        } else {
            setFormData(getDefaultFormData(initialData));
            processedIdRef.current = surveyId;
            setLoading(false);
            setError(null);
        }
    
    }, [initialData, surveyId, mode, t]);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        
        setFormData(prev => {
            let newState = { ...prev };
            newState[name] = type === 'checkbox' ? checked : value;
            return newState;
        });

        setValidationErrors(prev => ({
            ...prev,
            [name]: false
        }));
    }, []);

    const handleDateChange = useCallback((name, date) => {
        setFormData(prev => ({
            ...prev,
            [name]: date ? date.toISOString() : null
        }));
        setValidationErrors(prev => ({ ...prev, [name]: false }));
    }, []);

    const handleOptionsChange = useCallback((index, field, value) => {
        setFormData(prev => {
            const newOptions = [...prev.options];
            const updatedOption = { ...newOptions[index] };

            if (field === 'votesCount') {
                const count = parseInt(value, 10);
                updatedOption[field] = isNaN(count) || count < 0 ? 0 : count;
            } else {
                updatedOption[field] = value;
            }

            newOptions[index] = updatedOption;
            return { ...prev, options: newOptions };
        });
    }, []);

    const addOption = useCallback(() => {
        setFormData(prev => ({
            ...prev,
            options: [...prev.options, { text: '', votesCount: 0 }]
        }));
    }, []);

    const removeOption = useCallback((index) => {
        setFormData(prev => {
            if (prev.options.length <= 2) return prev;
            const newOptions = prev.options.filter((_, i) => i !== index);
            return { ...prev, options: newOptions };
        });
    }, []);
    
    const handlePostsChange = useCallback((newPostsList) => {
        setFormData(prev => ({
            ...prev,
            posts: newPostsList
        }));
    }, []);

    const validateForm = useCallback(() => {
        const errors = {};
        
        if (!formData.cids || formData.cids.length === 0) {
            errors.cids = t('campaign.validation.clientsRequired', 'At least one client is required');
        }

        if (!formData.question?.trim() || formData.question.length < 5) {
            errors.question = t('survey.validation.questionRequired');
        }

        const startTime = new Date(formData.startTime);
        const endTime = new Date(formData.endTime);

        if (!formData.endTime) {
            errors.endTime = t('survey.validation.endTimeRequired');
        } else if (startTime >= endTime) {
            errors.endTime = t('survey.validation.endTimeAfterStart');
        }

        if (formData.options.length < 2) {
            errors.options = t('survey.validation.minTwoOptions');
        }

        const emptyOption = formData.options.some(opt => !opt.text?.trim());
        if (emptyOption) {
            errors.options = t('survey.validation.optionTextRequired');
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, t]);

    return {
        formData,
        setFormData,
        loading,
        error,
        validationErrors,
        handleChange,
        handleDateChange,
        handleOptionsChange,
        addOption,
        removeOption,
        handlePostsChange,
        validateForm,
        setError,
        setLoading,
    };
};

export default useSurveyForm;