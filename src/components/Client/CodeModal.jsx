// ./src/components/Client/CodeModal.jsx
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Box,
    Button
} from '@mui/material';
import CopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';

/**
 * Compiles the full Quelora integration snippet for a given decrypted client object.
 *
 * The output is a standalone `.js` file containing a `window.QUELORA_CONFIG` assignment
 * followed by the self-invoking script loader. Sensitive fields (private keys, SMTP
 * passwords, OAuth secrets) are intentionally excluded from the public-facing snippet.
 *
 * @param {Object} client - The fully decrypted client object.
 * @returns {string} The compiled JavaScript integration snippet, or an empty string
 * if the client object is absent.
 */
export function compileIntegrationSnippet(client) {
    if (!client) return '';

    const clientConfig     = client.config     || {};
    const postConfig       = client.postConfig  || {};
    const vapidConfig      = client.vapid       || {};
    const captchaConfig    = clientConfig.captcha || {};
    const authWidgetConfig = clientConfig.authWidget || {};
    const providerDetails  = clientConfig.login?.providerDetails || {};
    // providerDetails is used below inside the queloraSession branch

    const geolocation = {
        enabled:  clientConfig.geolocation?.enabled  ?? false,
        provider: clientConfig.geolocation?.provider || 'ipapi',
    };

    const loginSource = clientConfig.login || {};
    const login = loginSource.queloraSession
        ? {
            queloraSession: true,
            baseUrl:        loginSource.baseUrl || '',
            providers:      loginSource.providers || [],
            providerDetails: Object.keys(providerDetails).reduce((acc, provider) => {
                if (loginSource.providers?.includes(provider)) {
                    acc[provider] = {
                        clientId: providerDetails[provider]?.clientId || '',
                        ...(provider === 'Quelora' ? { enabled: providerDetails[provider]?.enabled ?? false } : {}),
                    };
                }
                return acc;
            }, {}),
        }
        : {
            queloraSession:  false,
            loginUrl:        loginSource.loginUrl        || '',
            logoutUrl:       loginSource.logoutUrl       || '',
            registrationUrl: loginSource.registrationUrl || '',
        };

    const comments = {
        allowGif: postConfig.comments?.allowGif ?? false,
    };

    const audio = postConfig.audio || {
        enable_mic_transcription: false,
        save_comment_audio: false,
        max_recording_seconds: 60,
        bitrate: 16000,
    };

    const vapid = {
        publicKey:  vapidConfig.publicKey  || '',
        iconBase64: vapidConfig.iconBase64 || '',
    };

    const captcha = {
        enabled:  captchaConfig.enabled  ?? false,
        provider: captchaConfig.provider || 'turnstile',
        siteKey:  captchaConfig.siteKey  || '',
    };

    const authWidget = {
        enabled: authWidgetConfig.enabled ?? false,
        selector: authWidgetConfig.selector || '',
        position: authWidgetConfig.position || 'inside',
    };

    const entityConfig = clientConfig.entityConfig || {
        selector: 'article',
        entityIdAttribute: 'href',
        interactionPlacement: { position: 'after', relativeTo: '.article-actions' },
    };

    const nostrRelays = client.nostr?.relays || [];
    const trackerUrls = client.p2p?.trackerUrls || [];

    const rtcServers = [...(client.p2p?.rtcServers || [])];

    const configObj = {
        cid:          client.cid        || '',
        apiUrl:       client.apiUrl     || '',
        siteUrl:      client.siteUrl    || '',
        login,
        geolocation,
        audio,
        vapid,
        captcha,
        authWidget,
        entityConfig,
        comments,
        nostrRelays,
        trackerUrls,
        rtcServers,
    };

    return (
        `window.QUELORA_CONFIG = ${JSON.stringify(configObj, null, 2)};` +
        `\n\n(function() {\n` +
        `    var script = document.createElement('script');\n` +
        `    script.src = '${client.apiUrl || ''}/assets/js/quelora.js';\n` +
        `    script.async = true;\n` +
        `    document.head.appendChild(script);\n` +
        `})();`
    );
}

/**
 * Modal component that displays, copies, and downloads the Quelora integration
 * snippet for a selected client. The snippet is compiled on the fly from the
 * decrypted client object so it always reflects the latest saved configuration.
 *
 * @param {Object}   props
 * @param {boolean}  props.open      - Controls the visibility of the dialog.
 * @param {Function} props.setOpen   - State setter for dialog visibility.
 * @param {Object}   props.client    - The decrypted client object to export.
 * @param {Function} props.showToast - Callback to display a transient toast notification.
 */
const CodeModal = ({ open, setOpen, client, showToast }) => {
    const { t } = useTranslation();
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const compiledCode = useMemo(() => compileIntegrationSnippet(client), [client]);

    /**
     * Copies the compiled snippet to the user's clipboard.
     */
    const handleCopyCode = () => {
        navigator.clipboard.writeText(compiledCode);
        setSnackbar({ open: true, message: t('client.copy_success'), severity: 'success' });
    };

    /**
     * Triggers a browser download of the compiled snippet as a `.js` file.
     */
    const handleDownloadCode = () => {
        const blob = new Blob([compiledCode], { type: 'text/javascript' });
        const url  = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = `quelora-config-${client?.cid || 'unknown'}.js`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setSnackbar({ open: true, message: t('client.download_success'), severity: 'success' });
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth={false}
                PaperProps={{ className: 'client-dialog client-code-dialog' }}
            >
                <DialogTitle className="client-dialog-title">
                    {t('client.code_modal_title')}: {client?.cid}
                </DialogTitle>
                <DialogContent>
                    <SyntaxHighlighter language="javascript" style={tomorrow} className="client-code-block">
                        {compiledCode}
                    </SyntaxHighlighter>
                    <Box className="client-code-actions">
                        <Button
                            variant="outlined"
                            startIcon={<CopyIcon />}
                            onClick={handleCopyCode}
                            className="client-copy-button"
                        >
                            {t('client.copy')}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownloadCode}
                            className="client-download-button"
                        >
                            {t('client.download')}
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} className="client-close-button">
                        {t('client.close')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default CodeModal;