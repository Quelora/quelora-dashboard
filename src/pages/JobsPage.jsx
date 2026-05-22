/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// src/pages/JobsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Tabs,
    Tab,
    IconButton,
    Chip,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    FormControlLabel,
    Switch,
    Stack,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Divider,
    styled,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    PlayArrow as TriggerIcon,
    Edit as EditIcon,
    WorkspacePremium as EnterpriseIcon,
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { getJobs, updateJob, triggerJob, getJobLogs } from '../api/jobs';
import { getUserRole } from '../utils/permissions';
import CronEditor from '../components/Jobs/CronEditor';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—';

const fmtMetadata = (meta) => {
    if (!meta || typeof meta !== 'object') return null;
    return Object.entries(meta)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ');
};

const fmtMs = (ms, suffix) => {
    if (ms == null) return '—';
    if (ms < 1000) return `${ms} ${suffix}`;
    return `${(ms / 1000).toFixed(2)} s`;
};

const STATUS_COLOR = {
    success: 'success',
    failed:  'error',
    running: 'info',
};

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    borderBottom: '1px solid var(--border-gray)',
    '&:last-child':       { borderBottom: 'none' },
    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
    '&:hover':            { backgroundColor: theme.palette.action.hover },
    '[data-theme="dark"] &:nth-of-type(odd)': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
}));

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const StatusChip = ({ status, t }) => (
    <Chip
        label={status ? t(`jobs.status.${status}`, status) : '—'}
        size="small"
        color={STATUS_COLOR[status] || 'default'}
        variant="outlined"
    />
);

// ---------------------------------------------------------------------------
// Jobs Table
// ---------------------------------------------------------------------------

const JobsTable = ({ jobs, readOnly, onEdit, onTrigger, t }) => (
    <TableContainer>
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell>{t('jobs.columns.job')}</TableCell>
                    <TableCell>{t('jobs.columns.queue')}</TableCell>
                    <TableCell>{t('jobs.columns.enabled')}</TableCell>
                    <TableCell>{t('jobs.columns.cron')}</TableCell>
                    <TableCell>{t('jobs.columns.last_status')}</TableCell>
                    <TableCell>{t('jobs.columns.last_run')}</TableCell>
                    <TableCell>{t('jobs.columns.duration')}</TableCell>
                    <TableCell align="right">{t('jobs.columns.actions')}</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {jobs.map((job) => (
                    <StyledTableRow key={job.key}>
                        <TableCell>
                            <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                                <Typography variant="body2" fontFamily="monospace">{job.key}</Typography>
                                {readOnly && (
                                    <Chip label={t('jobs.readonly_badge')} size="small" variant="outlined" color="warning" />
                                )}
                                {job.enterprise && (
                                    <Tooltip title="Enterprise">
                                        <EnterpriseIcon sx={{ fontSize: 16, color: '#e65100' }} />
                                    </Tooltip>
                                )}
                            </Stack>
                        </TableCell>
                        <TableCell>
                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                {job.queueName}
                            </Typography>
                        </TableCell>
                        <TableCell>
                            <Switch
                                size="small"
                                checked={!!job.enabled}
                                disabled={readOnly}
                                onChange={() => onEdit(job, { enabled: !job.enabled })}
                            />
                        </TableCell>
                        <TableCell>
                            <Typography variant="caption" fontFamily="monospace">{job.cronExpression}</Typography>
                        </TableCell>
                        <TableCell>
                            <StatusChip status={job.lastLog?.status} t={t} />
                        </TableCell>
                        <TableCell>
                            <Typography variant="caption">{fmtDate(job.lastLog?.startedAt)}</Typography>
                        </TableCell>
                        <TableCell>
                            <Typography variant="caption">{fmtMs(job.lastLog?.durationMs, t('jobs.ms'))}</Typography>
                        </TableCell>
                        <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                {!readOnly && (
                                    <Tooltip title={t('jobs.actions.edit')}>
                                        <IconButton size="small" onClick={() => onEdit(job)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                <Tooltip title={t('jobs.actions.trigger')}>
                                    <IconButton size="small" color="primary" onClick={() => onTrigger(job)}>
                                        <TriggerIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </TableCell>
                    </StyledTableRow>
                ))}
            </TableBody>
        </Table>
    </TableContainer>
);

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const JobsPage = () => {
    const { t } = useTranslation();
    const userRole = getUserRole();

    // ── tab ─────────────────────────────────────────────────────────────────
    const [tab, setTab] = useState(0);

    // ── jobs state ──────────────────────────────────────────────────────────
    const [jobs,       setJobs]       = useState([]);
    const [systemJobs, setSystemJobs] = useState([]);
    const [jobsLoading, setJobsLoading] = useState(false);

    // ── logs state ──────────────────────────────────────────────────────────
    const [logs,        setLogs]        = useState([]);
    const [logsTotal,   setLogsTotal]   = useState(0);
    const [logsPage,    setLogsPage]    = useState(0);          // 0-indexed for MUI
    const [logsLimit,   setLogsLimit]   = useState(50);
    const [logsLoading, setLogsLoading] = useState(false);
    const [filterJob,   setFilterJob]   = useState('');
    const [filterStatus,setFilterStatus]= useState('');

    // ── edit dialog ─────────────────────────────────────────────────────────
    const [editOpen,        setEditOpen]        = useState(false);
    const [editJob,         setEditJob]         = useState(null);
    const [editEnabled,     setEditEnabled]     = useState(true);
    const [editCron,        setEditCron]        = useState('');
    const [editParams,      setEditParams]      = useState({});
    const [editParamsSchema,setEditParamsSchema] = useState(null);
    const [editSaving,      setEditSaving]      = useState(false);

    // ── trigger dialog ──────────────────────────────────────────────────────
    const [triggerOpen,    setTriggerOpen]    = useState(false);
    const [triggerTarget,  setTriggerTarget]  = useState(null);
    const [triggerLoading, setTriggerLoading] = useState(false);

    // ── fetchers ─────────────────────────────────────────────────────────────

    const fetchJobs = useCallback(async () => {
        setJobsLoading(true);
        try {
            const data = await getJobs();
            setJobs(data.jobs || []);
            setSystemJobs(data.systemJobs || []);
        } catch {
            Swal.fire(t('common.error'), t('jobs.errors.load'), 'error');
        } finally {
            setJobsLoading(false);
        }
    }, [t]);

    const fetchLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const data = await getJobLogs({
                jobName: filterJob   || undefined,
                status:  filterStatus|| undefined,
                page:    logsPage + 1,
                limit:   logsLimit,
            });
            setLogs(data.logs || []);
            setLogsTotal(data.total || 0);
        } catch {
            Swal.fire(t('common.error'), t('jobs.errors.logs'), 'error');
        } finally {
            setLogsLoading(false);
        }
    }, [t, filterJob, filterStatus, logsPage, logsLimit]);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);
    useEffect(() => { if (tab === 1) fetchLogs(); }, [tab, fetchLogs]);

    // ── edit handlers ────────────────────────────────────────────────────────

    // Helpers to read/write nested param values (e.g. 'weights.socialConnection')
    const getParamValue = (params, key) => {
        const [section, subKey] = key.split('.');
        return subKey ? params[section]?.[subKey] : params[section];
    };
    const setParamValue = (params, key, value) => {
        const [section, subKey] = key.split('.');
        if (!subKey) return { ...params, [section]: value };
        return { ...params, [section]: { ...(params[section] || {}), [subKey]: value } };
    };

    const handleEditOpen = (job, quickPatch) => {
        // If quickPatch is provided (e.g. toggling enabled), skip the dialog
        if (quickPatch) {
            handleSaveEdit(job, quickPatch);
            return;
        }
        setEditJob(job);
        setEditEnabled(job.enabled);
        setEditCron(job.cronExpression);
        setEditParams(job.params || {});
        setEditParamsSchema(job.configSchema || null);
        setEditOpen(true);
    };

    const handleSaveEdit = async (jobOverride, patchOverride) => {
        const target = jobOverride || editJob;
        const isGod  = userRole === 'god';
        const patch  = patchOverride || {
            enabled: editEnabled,
            ...(isGod ? { cronExpression: editCron } : {}),
            ...(editParamsSchema ? { params: editParams } : {}),
        };
        setEditSaving(true);
        try {
            await updateJob(target.key, patch);
            await fetchJobs();
            setEditOpen(false);
            Swal.fire({ icon: 'success', title: t('jobs.success.update'), timer: 1500, showConfirmButton: false });
        } catch {
            Swal.fire(t('common.error'), t('jobs.errors.update'), 'error');
        } finally {
            setEditSaving(false);
        }
    };

    // ── trigger handlers ─────────────────────────────────────────────────────

    const handleTriggerOpen = (job) => {
        setTriggerTarget(job);
        setTriggerOpen(true);
    };

    const handleTriggerConfirm = async () => {
        setTriggerLoading(true);
        try {
            await triggerJob(triggerTarget.key);
            setTriggerOpen(false);
            Swal.fire({ icon: 'success', title: t('jobs.success.trigger'), timer: 1500, showConfirmButton: false });
        } catch {
            Swal.fire(t('common.error'), t('jobs.errors.trigger'), 'error');
        } finally {
            setTriggerLoading(false);
        }
    };

    // ── all job names for the logs filter dropdown ────────────────────────

    const allJobNames = [...jobs.map(j => j.key), ...systemJobs.map(j => j.key)];

    // ── render ───────────────────────────────────────────────────────────────

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2, background: 'var(--card-bg)', borderRadius: '12px' }}>
                <Box>
                    <Typography variant="h4" className="title">{t('jobs.title')}</Typography>
                    <Typography variant="body2" color="text.secondary">{t('jobs.subtitle')}</Typography>
                </Box>
                <IconButton onClick={tab === 0 ? fetchJobs : fetchLogs}>
                    <RefreshIcon />
                </IconButton>
            </Box>

            {/* Tabs */}
            <Paper elevation={0} sx={{ bgcolor: 'transparent' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tab label={t('jobs.tabs.jobs')} />
                    <Tab label={t('jobs.tabs.logs')} />
                </Tabs>

                {/* ── JOBS TAB ── */}
                {tab === 0 && (
                    <Box>
                        {jobsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <>
                                {/* Client jobs */}
                                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, px: 1 }}>
                                    {t('jobs.sections.client_jobs')}
                                </Typography>
                                <Paper variant="outlined" sx={{ mb: 3 }}>
                                    <JobsTable
                                        jobs={jobs}
                                        readOnly={false}
                                        onEdit={handleEditOpen}
                                        onTrigger={handleTriggerOpen}
                                        t={t}
                                    />
                                </Paper>

                                {/* System jobs — god only */}
                                {userRole === 'god' && systemJobs.length > 0 && (
                                    <>
                                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, px: 1 }}>
                                            {t('jobs.sections.system_jobs')}
                                        </Typography>
                                        <Paper variant="outlined">
                                            <JobsTable
                                                jobs={systemJobs}
                                                readOnly={true}
                                                onEdit={handleEditOpen}
                                                onTrigger={handleTriggerOpen}
                                                t={t}
                                            />
                                        </Paper>
                                    </>
                                )}
                            </>
                        )}
                    </Box>
                )}

                {/* ── LOGS TAB ── */}
                {tab === 1 && (
                    <Box>
                        {/* Filters */}
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>{t('jobs.logs.filters.job_name')}</InputLabel>
                                <Select
                                    value={filterJob}
                                    label={t('jobs.logs.filters.job_name')}
                                    onChange={(e) => { setFilterJob(e.target.value); setLogsPage(0); }}
                                >
                                    <MenuItem value="">{t('jobs.logs.filters.all_statuses')}</MenuItem>
                                    {allJobNames.map(name => (
                                        <MenuItem key={name} value={name}>{name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>{t('jobs.logs.filters.status')}</InputLabel>
                                <Select
                                    value={filterStatus}
                                    label={t('jobs.logs.filters.status')}
                                    onChange={(e) => { setFilterStatus(e.target.value); setLogsPage(0); }}
                                >
                                    <MenuItem value="">{t('jobs.logs.filters.all_statuses')}</MenuItem>
                                    <MenuItem value="success">{t('jobs.status.success')}</MenuItem>
                                    <MenuItem value="failed">{t('jobs.status.failed')}</MenuItem>
                                    <MenuItem value="running">{t('jobs.status.running')}</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>

                        {/* Logs table */}
                        <Paper variant="outlined">
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>{t('jobs.logs.columns.job')}</TableCell>
                                            <TableCell>{t('jobs.logs.columns.client')}</TableCell>
                                            <TableCell>{t('jobs.logs.columns.status')}</TableCell>
                                            <TableCell>{t('jobs.logs.columns.started')}</TableCell>
                                            <TableCell>{t('jobs.logs.columns.completed')}</TableCell>
                                            <TableCell>{t('jobs.logs.columns.duration')}</TableCell>
                                            <TableCell>{t('jobs.logs.columns.error')}</TableCell>
                                            <TableCell>{t('jobs.logs.columns.output', 'Output')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {logsLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center">
                                                    <CircularProgress size={28} />
                                                </TableCell>
                                            </TableRow>
                                        ) : logs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center">
                                                    <Typography variant="body2" color="text.secondary">—</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : logs.map((log) => (
                                            <StyledTableRow key={log._id}>
                                                <TableCell>
                                                    <Typography variant="caption" fontFamily="monospace">{log.jobName}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption">{log.cid}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusChip status={log.status} t={t} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption">{fmtDate(log.startedAt)}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption">{fmtDate(log.completedAt)}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption">{fmtMs(log.durationMs, t('jobs.ms'))}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ maxWidth: 240 }}>
                                                    {log.error ? (
                                                        <Tooltip title={log.error.message || log.error}>
                                                            <Typography variant="caption" color="error" noWrap>
                                                                {log.error.message || log.error}
                                                            </Typography>
                                                        </Tooltip>
                                                    ) : (
                                                        <Typography variant="caption" color="text.disabled">
                                                            {t('jobs.logs.no_error')}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ maxWidth: 280 }}>
                                                    {fmtMetadata(log.metadata) ? (
                                                        <Typography variant="caption" color="text.secondary" noWrap>
                                                            {fmtMetadata(log.metadata)}
                                                        </Typography>
                                                    ) : (
                                                        <Typography variant="caption" color="text.disabled">—</Typography>
                                                    )}
                                                </TableCell>
                                            </StyledTableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={logsTotal}
                                page={logsPage}
                                rowsPerPage={logsLimit}
                                onPageChange={(_, p) => setLogsPage(p)}
                                onRowsPerPageChange={(e) => { setLogsLimit(parseInt(e.target.value, 10)); setLogsPage(0); }}
                                rowsPerPageOptions={[25, 50, 100]}
                            />
                        </Paper>
                    </Box>
                )}
            </Paper>

            {/* ── Edit dialog ── */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{t('jobs.edit_dialog.title')}{editJob && ` — ${editJob.key}`}</DialogTitle>
                <DialogContent>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={editEnabled}
                                onChange={(e) => setEditEnabled(e.target.checked)}
                            />
                        }
                        label={t('jobs.edit_dialog.enabled')}
                        sx={{ mb: 2, mt: 1 }}
                    />

                    {/* Cron editor — god only */}
                    {userRole === 'god' && (
                        <>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="subtitle2" gutterBottom color="text.secondary">
                                {t('jobs.edit_dialog.cron')}
                            </Typography>
                            <CronEditor
                                value={editCron}
                                defaultCron={editJob?.defaultCron}
                                onChange={setEditCron}
                            />
                        </>
                    )}

                    {/* Configurable params */}
                    {editParamsSchema && editParamsSchema.length > 0 && (() => {
                        // Group fields by section
                        const sections = {};
                        editParamsSchema.forEach(field => {
                            if (!sections[field.section]) sections[field.section] = [];
                            sections[field.section].push(field);
                        });
                        return Object.entries(sections).map(([section, fields]) => (
                            <Box key={section} sx={{ mt: 2 }}>
                                <Divider sx={{ mb: 1.5 }} />
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    {t(`jobs.edit_dialog.section_${section}`, section)}
                                </Typography>
                                <Stack spacing={1.5}>
                                    {fields.map(field => {
                                        if (field.godOnly && userRole !== 'god') return null;
                                        const value = getParamValue(editParams, field.key) ?? field.default;
                                        return (
                                            <TextField
                                                key={field.key}
                                                label={t(field.labelKey, field.key)}
                                                helperText={t(field.descKey, '')}
                                                type="number"
                                                size="small"
                                                value={value}
                                                inputProps={field.validation}
                                                onChange={(e) => {
                                                    const num = parseFloat(e.target.value);
                                                    if (!isNaN(num)) {
                                                        setEditParams(prev => setParamValue(prev, field.key, num));
                                                    }
                                                }}
                                            />
                                        );
                                    })}
                                </Stack>
                            </Box>
                        ));
                    })()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)}>
                        {t('jobs.edit_dialog.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => handleSaveEdit()}
                        disabled={editSaving}
                        startIcon={editSaving ? <CircularProgress size={16} /> : null}
                    >
                        {t('jobs.edit_dialog.save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Trigger confirm dialog ── */}
            <Dialog open={triggerOpen} onClose={() => setTriggerOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{t('jobs.trigger_dialog.title')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t('jobs.trigger_dialog.message', { jobKey: triggerTarget?.key })}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTriggerOpen(false)}>
                        {t('jobs.trigger_dialog.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleTriggerConfirm}
                        disabled={triggerLoading}
                        startIcon={triggerLoading ? <CircularProgress size={16} /> : <TriggerIcon />}
                    >
                        {t('jobs.trigger_dialog.confirm')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default JobsPage;
