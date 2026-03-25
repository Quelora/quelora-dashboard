// src/components/Client/ClientCard.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardContent,
    CardActions,
    Box,
    Typography,
    IconButton,
    Tooltip,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Collapse,
    Button,
    Popover,
    Paper,
    LinearProgress,
    styled,
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    RadioButtonUnchecked as UncheckedIcon,
    Delete as DeleteIcon,
    Download as DownloadIcon,
    Notifications as VapidIcon,
    Email as EmailIcon,
    VerifiedUser as ReputationIcon,
    Security as ResilienceIcon,
    Router as NetworkIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    InfoOutlined as InfoIcon,
    Link as LinkIcon,
    Fingerprint as CidIcon,
    Login as LoginIcon,
    Shield as CorsIcon,
    Translate as TranslationIcon,
    GpsFixed as GeoIcon,
    Hub as NostrIcon,
    DeviceHub as P2PIcon,
    Terminal as SnippetIcon,
    RateReview as CommentsIcon,
    Settings as ConfigureIcon,
    GppBad as CaptchaIcon,
} from '@mui/icons-material';
import { compileIntegrationSnippet } from './CodeModal';

// ── Styled components ─────────────────────────────────────────────────────────

/**
 * Pill-shaped module chip with three visual states:
 * - default  : neutral, grey border
 * - active   : green tint (configured + enabled)
 * - warning  : amber tint (enabled but requires attention)
 */
const ModuleChip = styled(Box, {
    shouldForwardProp: (p) => p !== 'chipState',
})(({ theme, chipState }) => {
    const states = {
        default: {
            background: theme.palette.background.paper,
            border:     `0.5px solid ${theme.palette.divider}`,
            color:      theme.palette.text.secondary,
            '&:hover': {
                background: theme.palette.action.hover,
                color:      theme.palette.text.primary,
                borderColor: theme.palette.action.active,
            },
        },
        active: {
            background: theme.palette.mode === 'dark' ? '#1b2e12' : '#eaf3de',
            border:     `0.5px solid ${theme.palette.mode === 'dark' ? '#3b6d11' : '#c0dd97'}`,
            color:      theme.palette.mode === 'dark' ? '#c0dd97' : '#3b6d11',
            '&:hover': {
                background: theme.palette.mode === 'dark' ? '#27500a' : '#d6ecbe',
            },
        },
        warning: {
            background: theme.palette.mode === 'dark' ? '#2e1f05' : '#faeeda',
            border:     `0.5px solid ${theme.palette.mode === 'dark' ? '#854f0b' : '#fac775'}`,
            color:      theme.palette.mode === 'dark' ? '#fac775' : '#854f0b',
            '&:hover': {
                background: theme.palette.mode === 'dark' ? '#412402' : '#f5ddb0',
            },
        },
    };

    return {
        display:      'inline-flex',
        alignItems:   'center',
        gap:          5,
        padding:      '4px 10px',
        borderRadius: 20,
        fontSize:     12,
        cursor:       'pointer',
        transition:   'background 0.15s, color 0.15s, border-color 0.15s',
        userSelect:   'none',
        lineHeight:   1.4,
        ...states[chipState || 'default'],
    };
});

/**
 * Small square icon-only action button in the primary row.
 */
const ActionIconButton = styled(IconButton)(({ theme }) => ({
    width:        32,
    height:       32,
    borderRadius: theme.shape.borderRadius,
    border:       `0.5px solid ${theme.palette.divider}`,
    color:        theme.palette.text.secondary,
    '&:hover': {
        background:  theme.palette.action.hover,
        color:       theme.palette.text.primary,
        borderColor: theme.palette.action.active,
    },
}));

/**
 * Variant of ActionIconButton that turns red on hover (destructive action).
 */
const DangerIconButton = styled(ActionIconButton)(({ theme }) => ({
    '&:hover': {
        background:  theme.palette.mode === 'dark' ? '#2e0a0a' : '#fcebeb',
        color:       '#a32d2d',
        borderColor: '#f09595',
    },
}));

// ── Checklist helpers ─────────────────────────────────────────────────────────

/**
 * @typedef {Object} CheckItem
 * @property {string}          labelKey
 * @property {boolean}         enabled
 * @property {string}          helpKey
 * @property {React.ReactNode} icon
 * @property {'warning'|undefined} severity - Optional: marks items that are active but need attention.
 */

/**
 * @typedef {Object} CheckGroup
 * @property {string}      groupKey  - i18n key for the group label.
 * @property {CheckItem[]} items
 */

/**
 * Builds the grouped configuration checklist from a decrypted client object.
 *
 * Groups:
 * - Essential    : login, entity/content-sources, identity-widget
 * - Security     : captcha, cors, moderation
 * - Delivery     : vapid, email, translation, geolocation
 * - Enterprise   : resilience, nostr, p2p
 *
 * @param {Object} client - Fully decrypted client object.
 * @returns {CheckGroup[]}
 */
const buildGroupedChecklist = (client) => {
    const cfg        = client.config     || {};
    const vapid      = client.vapid      || {};
    const email      = client.email      || {};
    const resilience = client.resilience || {};

    return [
        {
            groupKey: 'client.checklist.group_essential',
            items: [
                {
                    icon:     <LoginIcon sx={{ fontSize: 13 }} />,
                    labelKey: 'client.checklist.login',
                    helpKey:  'client.checklist.login_help',
                    enabled:  Array.isArray(cfg.login?.providers) && cfg.login.providers.length > 0,
                },
                {
                    icon:     <CidIcon sx={{ fontSize: 13 }} />,
                    labelKey: 'client.checklist.content_sources',
                    helpKey:  'client.checklist.content_sources_help',
                    enabled:  Boolean(cfg.entityConfig?.selector?.trim()),
                },
                {
                    icon:     <CommentsIcon sx={{ fontSize: 13 }} />,
                    labelKey: 'client.checklist.identity_widget',
                    helpKey:  'client.checklist.identity_widget_help',
                    enabled:  cfg.authWidget?.enabled === true,
                },
            ],
        },
        {
            groupKey: 'client.checklist.group_security',
            items: [
                {
                    icon:     <CaptchaIcon sx={{ fontSize: 13 }} />,
                    labelKey: 'client.checklist.captcha',
                    helpKey:  'client.checklist.captcha_help',
                    enabled:  cfg.captcha?.enabled === true,
                },
                {
                    icon:     <CorsIcon sx={{ fontSize: 13 }} />,
                    labelKey: 'client.checklist.cors',
                    helpKey:  'client.checklist.cors_help',
                    enabled:  cfg.cors?.enabled === true,
                },
                {
                    icon:     <TranslationIcon sx={{ fontSize: 13 }} />,
                    labelKey: 'client.checklist.moderation',
                    helpKey:  'client.checklist.moderation_help',
                    enabled:  cfg.moderation?.enabled === true || cfg.toxicity?.enabled === true,
                },
            ],
        },
        {
            groupKey: 'client.checklist.group_delivery',
            items: [
                {
                    icon:     <VapidIcon sx={{ fontSize: 13 }} />,
                    labelKey: 'client.checklist.vapid',
                    helpKey:  'client.checklist.vapid_help',
                    enabled:  Boolean(vapid.publicKey?.trim()),
                },
                {
                    icon:     <EmailIcon sx={{ fontSize: 13 }} />,
                    labelKey: 'client.checklist.email',
                    helpKey:  'client.checklist.email_help',
                    enabled:  Boolean(email.smtp_host?.trim()),
                },
                {
                    icon:     <TranslationIcon sx={{ fontSize: 13 }} />,
                    labelKey: 'client.checklist.translation',
                    helpKey:  'client.checklist.translation_help',
                    enabled:  cfg.translation?.enabled === true,
                },
                {
                    icon:     <GeoIcon sx={{ fontSize: 13 }} />,
                    labelKey: 'client.checklist.geolocation',
                    helpKey:  'client.checklist.geolocation_help',
                    enabled:  cfg.geolocation?.enabled === true,
                },
            ],
        },
        {
            groupKey: 'client.checklist.group_enterprise',
            items: [
                {
                    icon:     <ResilienceIcon sx={{ fontSize: 13 }} />,
                    labelKey: 'client.checklist.resilience',
                    helpKey:  'client.checklist.resilience_help',
                    enabled:  resilience.enabled === true,
                    severity: resilience.enabled === true ? 'warning' : undefined,
                },
                {
                    icon:     <NostrIcon sx={{ fontSize: 13 }} />,
                    labelKey: 'client.checklist.nostr',
                    helpKey:  'client.checklist.nostr_help',
                    enabled:  Boolean(client.nostr?.url?.trim()),
                },
                {
                    icon:     <P2PIcon sx={{ fontSize: 13 }} />,
                    labelKey: 'client.checklist.p2p',
                    helpKey:  'client.checklist.p2p_help',
                    enabled:  Array.isArray(client.p2p?.trackerUrls) && client.p2p.trackerUrls.length > 0,
                },
            ],
        },
    ];
};

/**
 * Flattens grouped checklist and computes the health percentage.
 *
 * @param {CheckGroup[]} groups
 * @returns {number} Integer 0–100.
 */
const computeHealth = (groups) => {
    const all = groups.flatMap(g => g.items);
    return Math.round((all.filter(i => i.enabled).length / all.length) * 100);
};

/**
 * Maps a health score to a MUI color token.
 *
 * @param {number} score
 * @returns {'error'|'warning'|'success'}
 */
const healthColor = (score) => {
    if (score < 34) return 'error';
    if (score < 67) return 'warning';
    return 'success';
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Client card component.
 *
 * Visual layout:
 *
 * ┌──────────────────────────────────────────────────┐
 * │ Client name  [CID chip]              [11/11 ✓]   │
 * │ https://site.url                                 │
 * │ ░░░░░░░░░░░░░░░░░░░░░░░░ 100%  progress bar      │
 * ├──────────────────────────────────────────────────┤
 * │ ▾ 11 of 11 features configured                   │
 * │   ESSENTIAL                                      │
 * │   ✓ Login providers            ⓘ                 │
 * │   ✓ Content sources            ⓘ                 │
 * │   ...                                            │
 * ├──────────────────────────────────────────────────┤
 * │  [⚙ Configure ──────────────] [</>] [↓] [🗑]    │
 * │  [Comments] [Push] [Email] [Reputation]          │
 * │  [Resilience] [Network]                          │
 * └──────────────────────────────────────────────────┘
 *
 * Design decisions:
 * - Single "Configure" button — Basic/Advanced toggle lives inside the dialog.
 * - Module chips encode state with color (green = configured, amber = active/warning,
 *   grey = not yet configured). They are actionable shortcuts, not decorative labels.
 * - Script and Download are icon-only to de-emphasise them relative to Configure.
 * - Delete is isolated to the far right of the action row and uses a danger hover state.
 *
 * @param {Object}   props
 * @param {Object}   props.client                  - Decrypted client object.
 * @param {Function} props.handleShowCode           - Opens the integration snippet modal.
 * @param {Function} props.handleEditClient         - Opens ConfigDialog: (client, mode?) => void.
 * @param {Function} props.handleGeneralConfig      - Opens comments/post config modal.
 * @param {Function} props.handleVapidConfig        - Opens VAPID config modal.
 * @param {Function} props.handleEmailConfig        - Opens email config modal.
 * @param {Function} props.handleDeleteClient       - Initiates client deletion.
 * @param {Function} props.handleReputationConfig   - Opens reputation config modal.
 * @param {Function} props.handleResilienceConfig   - Opens resilience config modal.
 * @param {Function} props.handleNetworkConfig      - Opens network config modal.
 * @param {Function} props.showToast                - Transient notification callback.
 * @returns {JSX.Element}
 */
const ClientCard = ({
    client,
    handleShowCode,
    handleEditClient,
    handleGeneralConfig,
    handleVapidConfig,
    handleEmailConfig,
    handleDeleteClient,
    handleReputationConfig,
    handleResilienceConfig,
    handleNetworkConfig,
    showToast,
}) => {
    const { t } = useTranslation();

    const [checklistOpen, setChecklistOpen] = useState(false);
    const [helpAnchor,    setHelpAnchor]    = useState(null);
    const [helpContent,   setHelpContent]   = useState('');

    const groups       = buildGroupedChecklist(client);
    const allItems     = groups.flatMap(g => g.items);
    const health       = computeHealth(groups);
    const color        = healthColor(health);
    const enabledCount = allItems.filter(i => i.enabled).length;
    const totalCount   = allItems.length;

    /** Triggers a browser download of the compiled integration snippet. */
    const handleDownloadCode = () => {
        const code = compileIntegrationSnippet(client);
        const blob = new Blob([code], { type: 'text/javascript' });
        const url  = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = `quelora-config-${client.cid}.js`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        if (showToast) showToast(t('client.download_success'), 'success');
    };

    /**
     * Opens the contextual help popover for a checklist item.
     *
     * @param {React.MouseEvent} event
     * @param {string}           helpKey
     */
    const handleOpenHelp = (event, helpKey) => {
        event.stopPropagation();
        setHelpContent(t(helpKey));
        setHelpAnchor(event.currentTarget);
    };

    return (
        <Card
            elevation={0}
            sx={{
                border:        '0.5px solid',
                borderColor:   'divider',
                borderRadius:  'var(--border-radius-lg, 12px)',
                display:       'flex',
                flexDirection: 'column',
                height:        '100%',
                transition:    'box-shadow 0.2s ease',
                '&:hover':     { boxShadow: '0 2px 16px rgba(0,0,0,0.08)' },
            }}
        >
            {/* ── HEADER ─────────────────────────────────────────────── */}
            <CardContent sx={{ pb: 1.5, px: 2.25, pt: 2 }}>

                {/* Name row */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 500, fontSize: '0.95rem', lineHeight: 1.3, color: 'text.primary' }}
                        >
                            {client.description || t('client.no_description')}
                        </Typography>

                        {/* CID chip */}
                        <Box
                            sx={{
                                display:     'inline-flex',
                                alignItems:  'center',
                                gap:         '4px',
                                mt:          0.5,
                                background:  'action.hover',
                                bgcolor:     'action.hover',
                                border:      '0.5px solid',
                                borderColor: 'divider',
                                borderRadius: 20,
                                px:          1,
                                py:          '2px',
                            }}
                        >
                            <CidIcon sx={{ fontSize: 10, color: 'text.secondary' }} />
                            <Typography
                                variant="caption"
                                sx={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'text.secondary', lineHeight: 1 }}
                            >
                                {client.cid}
                            </Typography>
                        </Box>

                        {/* Site URL */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <LinkIcon sx={{ fontSize: '0.7rem', color: 'text.disabled' }} />
                            <Typography
                                variant="caption"
                                sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.disabled' }}
                                noWrap
                            >
                                {client.siteUrl || '—'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Health badge */}
                    <Tooltip title={t('client.checklist.health_tooltip', { score: health })}>
                        <Chip
                            label={`${enabledCount} / ${totalCount}`}
                            color={color}
                            size="small"
                            sx={{ fontWeight: 500, fontSize: '0.72rem', flexShrink: 0, mt: 0.25 }}
                        />
                    </Tooltip>
                </Box>

                {/* Progress bar */}
                <Box sx={{ mt: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {t('client.checklist.health_label')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {health}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={health}
                        color={color}
                        sx={{ height: 5, borderRadius: 3, bgcolor: 'action.hover' }}
                    />
                </Box>
            </CardContent>

            <Divider />

            {/* ── COLLAPSIBLE CHECKLIST ───────────────────────────────── */}
            <Box
                onClick={() => setChecklistOpen(v => !v)}
                sx={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'space-between',
                    px:             2.25,
                    py:             1.25,
                    cursor:         'pointer',
                    userSelect:     'none',
                    '&:hover':      { bgcolor: 'action.hover' },
                    flexShrink:     0,
                }}
            >
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {t('client.checklist.summary', { enabled: enabledCount, total: totalCount })}
                </Typography>
                {checklistOpen
                    ? <ExpandLessIcon sx={{ fontSize: '1rem', color: 'text.disabled' }} />
                    : <ExpandMoreIcon sx={{ fontSize: '1rem', color: 'text.disabled' }} />
                }
            </Box>

            <Collapse in={checklistOpen} timeout="auto">
                <Box sx={{ px: 2.25, pb: 1.5 }}>
                    {groups.map((group) => (
                        <Box key={group.groupKey}>
                            <Typography
                                variant="caption"
                                sx={{
                                    display:       'block',
                                    fontSize:      '0.65rem',
                                    fontWeight:    500,
                                    color:         'text.disabled',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    mt:            1.25,
                                    mb:            0.5,
                                }}
                            >
                                {t(group.groupKey)}
                            </Typography>
                            <List dense disablePadding>
                                {group.items.map((item) => (
                                    <ListItem
                                        key={item.labelKey}
                                        disableGutters
                                        sx={{ py: 0.3 }}
                                        secondaryAction={
                                            <IconButton
                                                size="small"
                                                onClick={e => handleOpenHelp(e, item.helpKey)}
                                                sx={{
                                                    color:   'text.disabled',
                                                    p:       0.25,
                                                    '&:hover': { color: 'primary.main', bgcolor: 'transparent' },
                                                }}
                                            >
                                                <InfoIcon sx={{ fontSize: '0.85rem' }} />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemIcon sx={{ minWidth: 24 }}>
                                            {item.enabled
                                                ? <CheckIcon
                                                    sx={{
                                                        fontSize: 14,
                                                        color: item.severity === 'warning' ? 'warning.main' : 'success.main',
                                                    }}
                                                  />
                                                : <UncheckedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                            }
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Box sx={{ color: item.enabled ? 'text.secondary' : 'text.disabled', display: 'flex' }}>
                                                        {item.icon}
                                                    </Box>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontSize: '0.8rem',
                                                            color:    item.enabled ? 'text.primary' : 'text.disabled',
                                                        }}
                                                    >
                                                        {t(item.labelKey)}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    ))}
                </Box>
            </Collapse>

            <Divider sx={{ mt: 'auto' }} />

            {/* ── FOOTER ─────────────────────────────────────────────── */}
            <CardActions sx={{ flexDirection: 'column', gap: 1, px: 2.25, py: 1.5, alignItems: 'stretch' }}>

                {/* Primary action row: Configure + icon buttons */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
                    <Button
                        variant="contained"
                        startIcon={<ConfigureIcon sx={{ fontSize: '0.9rem !important' }} />}
                        onClick={() => handleEditClient(client)}
                        disableElevation
                        sx={{
                            textTransform: 'none',
                            fontSize:      '0.82rem',
                            fontWeight:    500,
                            py:            0.75,
                            px:            2,
                            borderRadius:  'var(--border-radius-md, 8px)',
                        }}
                    >
                        {t('client.configure_button')}
                    </Button>

                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                        <Tooltip title={t('client.tooltip.show_code')}>
                            <ActionIconButton onClick={() => handleShowCode(client)} size="small">
                                <SnippetIcon sx={{ fontSize: '0.9rem' }} />
                            </ActionIconButton>
                        </Tooltip>

                        <Tooltip title={t('client.tooltip.download_code')}>
                            <ActionIconButton onClick={handleDownloadCode} size="small">
                                <DownloadIcon sx={{ fontSize: '0.9rem' }} />
                            </ActionIconButton>
                        </Tooltip>

                        <Tooltip title={t('client.tooltip.delete_client')}>
                            <DangerIconButton onClick={() => handleDeleteClient(client)} size="small">
                                <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                            </DangerIconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Module chips row */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    <Tooltip title={t('client.tooltip.general_comment_config')}>
                        <ModuleChip
                            chipState={client.postConfig ? 'active' : 'default'}
                            onClick={() => handleGeneralConfig(client)}
                        >
                            <CommentsIcon sx={{ fontSize: 12 }} />
                            {t('client.module_comments')}
                        </ModuleChip>
                    </Tooltip>

                    <Tooltip title={t('client.tooltip.vapid_config')}>
                        <ModuleChip
                            chipState={client.vapid?.publicKey ? 'active' : 'default'}
                            onClick={() => handleVapidConfig(client)}
                        >
                            <VapidIcon sx={{ fontSize: 12 }} />
                            {t('client.module_vapid')}
                        </ModuleChip>
                    </Tooltip>

                    <Tooltip title={t('client.tooltip.email_config')}>
                        <ModuleChip
                            chipState={client.email?.smtp_host ? 'active' : 'default'}
                            onClick={() => handleEmailConfig(client)}
                        >
                            <EmailIcon sx={{ fontSize: 12 }} />
                            {t('client.module_email')}
                        </ModuleChip>
                    </Tooltip>

                    <Tooltip title={t('client.tooltip.reputation_config')}>
                        <ModuleChip
                            chipState="default"
                            onClick={() => handleReputationConfig(client)}
                        >
                            <ReputationIcon sx={{ fontSize: 12 }} />
                            {t('client.module_reputation')}
                        </ModuleChip>
                    </Tooltip>

                    <Tooltip title={t('client.tooltip.resilience_config')}>
                        <ModuleChip
                            chipState={client.resilience?.enabled ? 'warning' : 'default'}
                            onClick={() => handleResilienceConfig(client)}
                        >
                            <ResilienceIcon sx={{ fontSize: 12 }} />
                            {t('client.module_resilience')}
                        </ModuleChip>
                    </Tooltip>

                    <Tooltip title={t('client.tooltip.network_config')}>
                        <ModuleChip
                            chipState={
                                client.nostr?.url || client.p2p?.trackerUrls?.length
                                    ? 'active'
                                    : 'default'
                            }
                            onClick={() => handleNetworkConfig(client)}
                        >
                            <NetworkIcon sx={{ fontSize: 12 }} />
                            {t('client.module_network')}
                        </ModuleChip>
                    </Tooltip>
                </Box>
            </CardActions>

            {/* ── Contextual help popover ─────────────────────────────── */}
            <Popover
                open={Boolean(helpAnchor)}
                anchorEl={helpAnchor}
                onClose={() => setHelpAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top',    horizontal: 'left' }}
                disableRestoreFocus
            >
                <Paper
                    elevation={0}
                    sx={{
                        p:           1.75,
                        maxWidth:    280,
                        border:      '0.5px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                        {helpContent}
                    </Typography>
                </Paper>
            </Popover>
        </Card>
    );
};

export default ClientCard;