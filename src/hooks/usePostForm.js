// src/hooks/usePostForm.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getPost } from '../api/posts';

/**
 * Builds the default form state by deeply merging `initialData` over the
 * base defaults. Nested `config` sub-objects are merged individually so that
 * partial overrides (e.g. only `interaction`) do not wipe sibling keys.
 *
 * @param {Object} [initialData={}] - Partial post data to seed the form with.
 * @returns {Object} Complete form state ready for controlled components.
 */
const getDefaultFormData = (initialData = {}) => ({
    entity:      '',
    title:       '',
    description: '',
    link:        '',
    ...initialData,
    config: {
        visibility:      'public',
        comment_status:  'open',
        category:        'General',
        tags:            [],
        publish_schedule: {
            immediate:      true,
            scheduled_time: new Date(Date.now() + 86400000).toISOString(),
        },
        language: {
            post_language:  'en',
            auto_translate: false,
        },
        interaction: {
            allow_comments:  true,
            allow_likes:     true,
            allow_shares:    true,
            allow_replies:   true,
            allow_bookmarks: true,
            allow_quotes:    true,
            ...(initialData.config?.interaction || {}),
        },
        moderation: {
            enable_toxicity_filter:    true,
            enable_content_moderation: false,
            moderation_prompt:         '',
            banned_words:              [],
            ...(initialData.config?.moderation || {}),
        },
        limits: {
            post_text:    1000,
            comment_text: 200,
            reply_text:   200,
            ...(initialData.config?.limits || {}),
        },
        editing: {
            allow_edits:     true,
            allow_delete:    true,
            edit_time_limit: 5,
            ...(initialData.config?.editing || {}),
        },
        audio: {
            enable_mic_transcription: false,
            save_comment_audio:       false,
            max_recording_seconds:    60,
            bitrate:                  16000,
            ...(initialData.config?.audio || {}),
        },
        liveMode: {
            isLiveActive: false,
            startTime:    null,
            maxClients:   300,
            ...(initialData.config?.liveMode || {}),
        },
    },
});

/**
 * Returns `true` when `url` is a valid absolute URL or is empty / absent.
 *
 * @param {string} [url=""] - URL string to validate.
 * @returns {boolean}
 */
const isValidUrl = (url = '') => {
    try {
        new URL(url);
        return true;
    } catch {
        return url === '' || url === undefined || url === null;
    }
};

/**
 * Custom hook that manages all state and side-effects for the PostForm.
 *
 * On mount in `edit` mode the hook fetches the existing post from the API,
 * passing `initialData` as metadata query parameters so the backend can
 * create the post on-the-fly (optimistic creation) when it does not yet
 * exist — a common scenario for posts originated from an external CMS via
 * the embed flow.
 *
 * @param {Object}  [initialData={}]      - Seed data for the form (entity, cid,
 *   title, description, link, config, …).
 * @param {string}  [mode="create"]       - `"create"` or `"edit"`.
 * @param {boolean} [isGeneralConfig=false] - When `true` the hook manages a
 *   client-level config form rather than a per-post form.
 * @param {boolean} [isEmbedMode=false]   - Whether the form is rendered inside
 *   an embed popup window.
 * @returns {{
 *   formData: Object,
 *   loading: boolean,
 *   error: string|null,
 *   validationErrors: Object,
 *   handleChange: function,
 *   handleNumberChange: function,
 *   validateForm: function,
 *   setError: function,
 *   setLoading: function,
 * }}
 */
const usePostForm = (
    initialData    = {},
    mode           = 'create',
    isGeneralConfig = false,
    isEmbedMode    = false,
) => {
    const { t } = useTranslation();

    const [formData,         setFormData]         = useState(() => getDefaultFormData(initialData));
    const [loading,          setLoading]          = useState(mode === 'edit' && !isGeneralConfig);
    const [error,            setError]            = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const loadInitiated = useRef(false);

    useEffect(() => {
        const shouldLoad = mode === 'edit' && !isGeneralConfig;

        if (shouldLoad && initialData?.entity && !loadInitiated.current) {
            loadInitiated.current = true;

            const loadPostData = async () => {
                try {
                    setLoading(true);

                    /**
                     * Pass the full `initialData` object as the third argument so
                     * that `getPost` forwards its fields (title, description, link,
                     * config.category, config.tags, config.language.post_language)
                     * as query params to the backend.
                     *
                     * The backend will use these params to create the post when it
                     * does not yet exist (optimistic creation), returning HTTP 201
                     * with `created: true` alongside the new post data.
                     */
                    const response = await getPost(
                        initialData.entity,
                        initialData.cid,
                        initialData,
                    );

                    setFormData(() => getDefaultFormData({
                        ...initialData,
                        ...response.data,
                    }));
                } catch (err) {
                    setError(err.response?.data?.error || t('postForm.errorLoading'));
                } finally {
                    setLoading(false);
                }
            };

            loadPostData();
        } else if (mode === 'create') {
            setLoading(false);
        }
    }, [mode, initialData?.entity, initialData?.cid, isGeneralConfig, t]);

    /**
     * Generic change handler for all form fields.
     *
     * Supports dot-notation names for nested config paths
     * (e.g. `"config.interaction.allow_likes"`).
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - DOM change event.
     * @returns {void}
     */
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => {
            const newState = { ...prev };

            if (name.startsWith('config.')) {
                const parts  = name.split('.');
                let current  = newState.config;

                for (let i = 1; i < parts.length - 1; i++) {
                    current[parts[i]] = { ...current[parts[i]] };
                    current           = current[parts[i]];
                }

                const finalKey        = parts[parts.length - 1];
                current[finalKey]     = type === 'checkbox' ? checked : value;
            } else {
                newState[name] = type === 'checkbox' ? checked : value;
            }

            return newState;
        });

        setValidationErrors(prev => ({
            ...prev,
            [name.split('.').pop()]: false,
        }));
    }, []);

    /**
     * Change handler for numeric inputs. Coerces empty strings to `""` and
     * all other values to `Number` before delegating to `handleChange`.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - DOM change event.
     * @returns {void}
     */
    const handleNumberChange = useCallback((e) => {
        const { name, value } = e.target;
        handleChange({
            target: {
                name,
                value: value === '' ? '' : Number(value),
                type:  'number',
            },
        });
    }, [handleChange]);

    /**
     * Validates the current `formData` and populates `validationErrors`.
     *
     * @returns {boolean} `true` when the form is valid, `false` otherwise.
     */
    const validateForm = useCallback(() => {
        const errors = {};

        if (formData.config.limits.comment_text < 50 || formData.config.limits.comment_text > 1000) {
            errors.comment_text = t('postForm.invalidCommentTextLimit');
        }
        if (formData.config.limits.reply_text < 50 || formData.config.limits.reply_text > 1000) {
            errors.reply_text = t('postForm.invalidReplyTextLimit');
        }
        if (formData.config.editing.allow_edits &&
            (formData.config.editing.edit_time_limit < 1 || formData.config.editing.edit_time_limit > 1440)) {
            errors.edit_time_limit = t('postForm.invalidEditTimeLimit');
        }
        if (formData.config.moderation.enable_content_moderation &&
            !formData.config.moderation.moderation_prompt?.trim()) {
            errors.moderation_prompt = t('postForm.moderationPromptRequired');
        }
        if (formData.config.audio.max_recording_seconds < 1 ||
            formData.config.audio.max_recording_seconds > 300) {
            errors.max_recording_seconds = t('postForm.invalidRecordingSeconds');
        }
        if (formData.config.liveMode.isLiveActive) {
            const { startTime, maxClients } = formData.config.liveMode;
            if (!startTime || startTime === 'Invalid Date') {
                errors.startTime = t('liveMode.startTimeRequired', 'Start time is required for Live Mode.');
            }
            if (maxClients === '' || maxClients === null || maxClients < 1 || maxClients > 1000) {
                errors.maxClients = t('liveMode.invalidMaxClients', { min: 1, max: 1000 });
            }
        }

        if (isGeneralConfig) {
            setValidationErrors(errors);
            return Object.keys(errors).length === 0;
        }

        if (mode === 'create' && !formData.entity?.trim()) {
            errors.entity = t('postForm.requiredField');
        }
        if (!formData.title?.trim() || formData.title.length < 10 || formData.title.length > 150) {
            errors.title = t('postForm.requiredField');
        }
        if (!formData.description?.trim() || formData.description.length > formData.config.limits.post_text) {
            errors.description = t('postForm.requiredField');
        }
        if (formData.link && (!isValidUrl(formData.link) || formData.link.length > 300)) {
            errors.link = t('postForm.invalidLink');
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, mode, isGeneralConfig, t]);

    return {
        formData,
        loading,
        error,
        validationErrors,
        handleChange,
        handleNumberChange,
        validateForm,
        setError,
        setLoading,
    };
};

export default usePostForm;