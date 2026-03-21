// src/pages/PostPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import PostForm from '../components/Post/PostForm';
import { loadClientsFromSession } from '../api/auth';
import embedStorage from '../utils/embedStorage';
import React from 'react';

/**
 * Normalizes a BCP-47 language tag to the two-letter ISO 639-1 code that
 * the PostForm language selector understands.
 *
 * Examples:
 *  - `"en_US"` → `"en"`
 *  - `"es_AR"` → `"es"`
 *  - `"fr"`    → `"fr"`
 *  - `""`      → `"en"` (fallback)
 *
 * @param {string} [rawLanguage=""] - Language string as received from the URL.
 * @returns {"en"|"es"|"fr"} Normalized two-letter code, defaulting to `"en"`.
 */
const normalizeLanguage = (rawLanguage = '') => {
    const supported = ['en', 'es', 'fr'];
    const code = rawLanguage.split(/[-_]/)[0].toLowerCase();
    return supported.includes(code) ? code : 'en';
};

/**
 * Parses a comma-separated tag string from the URL into an array of trimmed,
 * non-empty tag strings.
 *
 * @param {string} [rawTags=""] - Raw `tags` query-string value.
 * @returns {string[]} Array of tag strings.
 */
const parseTags = (rawTags = '') => {
    if (!rawTags.trim()) return [];
    return rawTags.split(',').map(t => t.trim()).filter(Boolean);
};

/**
 * Retrieves the stored `postConfig` defaults for a given client from the
 * session-aware storage. Returns an empty object when the client is not
 * found or no `cid` is provided.
 *
 * @param {string} [cid=""] - Client identifier.
 * @returns {Object} Post configuration defaults for the client.
 */
const getClientConfig = (cid = '') => {
    if (!cid) return {};
    const clients = loadClientsFromSession();
    const client  = clients.find(c => c.cid === cid);
    return client?.postConfig || {};
};

/**
 * Resolves the active client identifier from the URL query-string first,
 * then falls back to the value stored in the context-appropriate storage
 * (set during login or client-selection).
 *
 * @param {URLSearchParams} searchParams - Parsed query parameters.
 * @returns {string} The resolved client identifier, or an empty string.
 */
const resolveCid = (searchParams) =>
    searchParams.get('cliente_id') ||
    searchParams.get('cid')        ||
    embedStorage.getItem('currentCid') ||
    '';

/**
 * Page component that renders a {@link PostForm} in either dashboard or
 * embed mode.
 *
 * In embed mode the form is pre-populated from the query-string parameters
 * sent by the client backend:
 *
 * ```
 * /embed/post/:entityId
 *   ?title=...
 *   &description=...
 *   &tags=tag1,tag2
 *   &category=Technology
 *   &language=en_US
 *   &link=https://...
 *   &cliente_id=...   (optional — falls back to stored currentCid)
 * ```
 *
 * Supported query parameters:
 * | Parameter    | Type   | Notes                                      |
 * |-------------|--------|--------------------------------------------|
 * | `title`      | string | Pre-fills the post title field.            |
 * | `description`| string | Pre-fills the description field.           |
 * | `tags`       | string | Comma-separated list of tags.              |
 * | `category`   | string | Post category (defaults to `"General"`).   |
 * | `language`   | string | BCP-47 tag normalized to ISO 639-1.        |
 * | `link`       | string | URL associated with the post.              |
 * | `cliente_id` | string | Client identifier override.                |
 *
 * @component
 * @param {Object}  props               - Component props.
 * @param {boolean} [props.isEmbedMode=false] - When `true` the page renders
 *   without the dashboard chrome and adapts cancel/save behaviour for popup
 *   windows.
 * @returns {JSX.Element}
 */
const PostPage = ({ isEmbedMode = false }) => {
    const { t } = useTranslation();
    const { entity: entityFromDashboard, entityId: entityFromEmbed } = useParams();
    const entity   = entityFromEmbed || entityFromDashboard;
    const navigate = useNavigate();

    const [initialData,    setInitialData]    = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const successTimer = useRef(null);

    useEffect(() => {
        const searchParams     = new URLSearchParams(window.location.search);

        const title       = searchParams.get('title')       || '';
        const description = searchParams.get('description') || '';
        const rawTags     = searchParams.get('tags')        || '';
        const category    = searchParams.get('category')    || '';
        const rawLanguage = searchParams.get('language')    || '';
        const link        = searchParams.get('link')        || '';
        const cid         = resolveCid(searchParams);

        const postConfigDefaults = getClientConfig(cid);
        const language           = normalizeLanguage(rawLanguage);
        const tags               = parseTags(rawTags);

        setInitialData({
            entity:      entity,
            cid:         cid,
            title:       title,
            description: description,
            link:        link,
            config: {
                ...postConfigDefaults,
                category: category || postConfigDefaults.category || 'General',
                tags:     tags.length > 0 ? tags : (postConfigDefaults.tags || []),
                language: {
                    ...(postConfigDefaults.language || {}),
                    post_language: language,
                },
            },
        });
    }, [entity, isEmbedMode]);

    useEffect(() => {
        return () => {
            if (successTimer.current) clearTimeout(successTimer.current);
        };
    }, []);

    /**
     * Handles a successful form submission.
     *
     * - In embed mode: displays a localised success banner for 5 seconds.
     * - In dashboard mode: navigates back to the posts list.
     *
     * @param {Object} post - The saved post object returned by the API.
     * @returns {void}
     */
    const handleSave = (post) => {
        if (isEmbedMode) {
            setSuccessMessage(t('client.general_config_saved'));

            if (successTimer.current) clearTimeout(successTimer.current);

            successTimer.current = setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
        } else {
            navigate('/posts');
        }
    };

    /**
     * Handles form cancellation.
     *
     * - In embed mode: alerts the user to close the popup window.
     * - In dashboard mode: navigates one step back in the history stack.
     *
     * @returns {void}
     */
    const handleCancel = () => {
        if (isEmbedMode) {
            window.alert('Edición cancelada. Cierre la ventana.');
        } else {
            navigate(-1);
        }
    };

    if (!initialData) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={0} sx={{ p: 3 }}>
                {!isEmbedMode && (
                    <Typography variant="h4" gutterBottom>
                        {entity ? t('postForm.editPost') : t('postForm.newPost')}
                    </Typography>
                )}

                <PostForm
                    initialData={initialData}
                    mode={entity ? 'edit' : 'create'}
                    isEmbedMode={isEmbedMode}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    successMessage={successMessage}
                />
            </Paper>
        </Box>
    );
};

export default PostPage;