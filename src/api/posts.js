// src/api/posts.js
import api from './axiosConfig';
import embedStorage from '../utils/embedStorage';

/**
 * Resolves the active client identifier from the provided value, falling back
 * to the one stored in the context-appropriate storage backend when absent.
 *
 * This prevents `/client/post//<entityId>` double-slash requests when the
 * caller does not explicitly supply a `cid` (common in embed mode).
 *
 * @param {string} [cid=""] - Explicit client identifier, may be empty.
 * @returns {string} A non-empty CID, or an empty string if none can be resolved.
 */
const resolveCid = (cid = '') =>
    cid || embedStorage.getItem('currentCid') || '';

/**
 * Normalises a metadata object extracted from `initialData` into a flat set
 * of query parameters suitable for the optimistic-creation GET endpoint.
 *
 * Only non-empty values are included so the query string stays clean.
 *
 * @param {Object} [metadata={}] - Raw initialData fields from the form.
 * @param {string} [metadata.title]                          - Post title.
 * @param {string} [metadata.description]                    - Post description.
 * @param {string} [metadata.link]                           - External URL.
 * @param {string} [metadata.config.category]                - Content category.
 * @param {string[]} [metadata.config.tags]                  - Tag list.
 * @param {string} [metadata.config.language.post_language]  - ISO 639-1 code.
 * @returns {Object} Flat query-param object ready for axios `params`.
 */
const buildMetadataParams = (metadata = {}) => {
    const params = {};

    if (metadata.title?.trim())
        params.title = metadata.title.trim();

    if (metadata.description?.trim())
        params.description = metadata.description.trim();

    if (metadata.link?.trim())
        params.link = metadata.link.trim();

    if (metadata.config?.category?.trim())
        params.category = metadata.config.category.trim();

    if (Array.isArray(metadata.config?.tags) && metadata.config.tags.length > 0)
        params.tags = metadata.config.tags.join(',');

    if (metadata.config?.language?.post_language?.trim())
        params.language = metadata.config.language.post_language.trim();

    return params;
};

/**
 * Fetches the paginated post list for a given client.
 *
 * @async
 * @param {string} cid          - Client identifier.
 * @param {Object} [params={}]  - Additional query parameters (pagination, filters).
 * @returns {Promise<Object>} The API response data.
 * @throws {Error} If the request fails.
 */
export const getClientPosts = async (cid, params = {}) => {
    try {
        const response = await api.get('/client/posts', {
            params: { cid, ...params }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching client posts:', error);
        throw error;
    }
};

/**
 * Creates or updates a post.
 *
 * @async
 * @param {Object} postData - Post payload conforming to the upsert schema.
 * @returns {Promise<Object>} The saved post object returned by the API.
 * @throws {Error} If the request fails.
 */
export const upsertPost = async (postData) => {
    const response = await api.put('/client/upsert-post', postData);
    return response.data;
};

/**
 * Retrieves a single post by its entity ID.
 *
 * Implements an optimistic-creation protocol: when the backend cannot find
 * the post it will attempt to create it on-the-fly using the metadata
 * supplied as query parameters. This avoids a separate POST/PUT round-trip
 * for posts that originate from external CMS systems (e.g. WordPress embed).
 *
 * The backend route is `/client/post/:cid/:entity/` — both path segments are
 * required. When `cid` is not explicitly provided the function resolves it
 * from the context-appropriate storage so the URL is always well-formed.
 *
 * @async
 * @param {string} postId          - The post entity identifier (24-char hex ObjectId).
 * @param {string} [cid=""]        - Client identifier. Falls back to stored value.
 * @param {Object} [metadata={}]   - Optional post fields forwarded as query params
 *   to enable server-side optimistic creation when the post does not yet exist.
 *   Accepted keys: `title`, `description`, `link`, `config.category`,
 *   `config.tags`, `config.language.post_language`.
 * @returns {Promise<Object>} The post data returned by the API (existing or
 *   newly created).
 * @throws {Error} If the request fails or neither `cid` source is available.
 */
export const getPost = async (postId, cid = '', metadata = {}) => {
    const resolvedCid    = resolveCid(cid);
    const metadataParams = buildMetadataParams(metadata);

    const response = await api.get(`/client/post/${resolvedCid}/${postId}`, {
        params: Object.keys(metadataParams).length > 0 ? metadataParams : undefined,
    });

    return response.data;
};

/**
 * Fetches a post by following a test URL.
 *
 * @async
 * @param {string} url - The URL to test.
 * @returns {Promise<Object>} The API response data.
 * @throws {Error} If the request fails.
 */
export const getTestPost = async (url) => {
    const response = await api.get('/client/test', {
        params: { url }
    });
    return response.data;
};

/**
 * Moves a post to the trash bin.
 *
 * @async
 * @param {string} cid      - Client identifier.
 * @param {string} entityId - Post entity identifier.
 * @returns {Promise<Object>} The raw Axios response.
 * @throws {Error} If the request fails.
 */
export const movePostToTrash = async (cid, entityId) => {
    try {
        const response = await api.patch('/client/trash', { entity: entityId, cid });
        return response;
    } catch (error) {
        console.error('Failed to move post to trash:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Restores a post from the trash bin.
 *
 * @async
 * @param {string} cid      - Client identifier.
 * @param {string} entityId - Post entity identifier.
 * @returns {Promise<Object>} The raw Axios response.
 * @throws {Error} If the request fails.
 */
export const restorePostFromTrash = async (cid, entityId) => {
    try {
        const response = await api.patch('/client/restore', { entity: entityId, cid });
        return response;
    } catch (error) {
        console.error('Failed to restore post from trash:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Fetches the comment list for a given post.
 *
 * @async
 * @param {string} postId      - Post entity identifier.
 * @param {Object} [params={}] - Additional query parameters (pagination, filters).
 * @returns {Promise<Object>} The API response data.
 * @throws {Error} If the request fails.
 */
export const getPostComments = async (postId, params = {}) => {
    try {
        const response = await api.get(`/client/posts/${postId}`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching post comments:', error);
        throw error;
    }
};