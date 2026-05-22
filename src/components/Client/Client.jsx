/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// src/components/Client/Client.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Snackbar, Alert } from '@mui/material';
import useClient from '../../hooks/useClient';
import ClientHeader from './ClientHeader';
import ClientList from './ClientList';
import ConfigDialog from './ConfigDialog';
import CodeModal from './CodeModal';
import VapidConfigModal from './VapidConfigModal';
import EmailConfigModal from './EmailConfigModal';
import ReputationConfigModal from './ReputationConfigModal';
import ResilienceConfigModal from './ResilienceConfigModal';
import NetworkConfigModal from './NetworkConfigModal';
import ModulesConfigModal from './ModulesConfigModal';
import PostModal from '../Post/PostModal';

/**
 * Client component — pure orchestration layer for the client management page.
 *
 * All state management and business logic lives in the `useClient` hook,
 * following the architectural pattern established by useGamification,
 * useCampaignModal, and similar hooks in this codebase.
 *
 * Notable wiring:
 * - `configDialogMode` from the hook is forwarded to ConfigDialog as
 *   `initialMode`, allowing ClientCard's "Edit Basic" and "Edit Advanced"
 *   buttons to deep-link to the correct dialog section.
 *
 * @component
 * @returns {JSX.Element}
 */
const Client = () => {
    const { t } = useTranslation();

    const {
        clients,
        config,
        setConfig,
        editingClient,
        setEditingClient,
        loading,
        isFormSubmitted,
        fieldErrors,
        setFieldErrors,
        snackbar,
        anchorEl,
        setAnchorEl,
        configDialogMode,

        openConfigDialog,          setOpenConfigDialog,
        openGeneralConfigModal,    setOpenGeneralConfigModal,
        openVapidConfigModal,      setOpenVapidConfigModal,
        openEmailConfigModal,      setOpenEmailConfigModal,
        openReputationConfigModal, setOpenReputationConfigModal,
        openResilienceConfigModal, setOpenResilienceConfigModal,
        openNetworkConfigModal,    setOpenNetworkConfigModal,
        openModulesConfigModal,    setOpenModulesConfigModal,
        codeModalOpen,             setCodeModalOpen,

        editingReputationClient,
        editingResilienceClient,
        editingNetworkClient,
        editingModulesClient,
        currentCodeClient,

        showSnackbar,
        handleSnackbarClose,
        resetConfig,
        resetNetworkConfig,

        handleUpsertClient,
        handleEditClient,
        handleDeleteClient,
        handleShowCode,
        handleGeneralConfig,
        handleSaveGeneralConfig,
        handleVapidConfig,
        handleSaveVapidConfig,
        handleEmailConfig,
        handleSaveEmailConfig,
        handleReputationConfig,
        handleResilienceConfig,
        handleResilienceSaved,
        handleNetworkConfig,
        handleSaveNetworkConfig,
        handleModulesConfig,
        handleModulesSaved,
    } = useClient();

    return (
        <Box className="client-container" sx={{ p: 2 }}>

            {/* ── Page header with Clone / Download menu ── */}
            <ClientHeader
                anchorEl={anchorEl}
                setAnchorEl={setAnchorEl}
                showToast={showSnackbar}
            />

            {/* ── Card grid ── */}
            <ClientList
                clients={clients}
                handleShowCode={handleShowCode}
                handleEditClient={handleEditClient}
                setOpenConfigDialog={setOpenConfigDialog}
                resetConfig={resetConfig}
                showToast={showSnackbar}
                handleGeneralConfig={handleGeneralConfig}
                handleVapidConfig={handleVapidConfig}
                handleEmailConfig={handleEmailConfig}
                handleDeleteClient={handleDeleteClient}
                handleReputationConfig={handleReputationConfig}
                handleResilienceConfig={handleResilienceConfig}
                handleNetworkConfig={handleNetworkConfig}
                handleModulesConfig={handleModulesConfig}
            />

            {/* ── Create / Edit dialog (Basic or Advanced mode) ── */}
            <ConfigDialog
                open={openConfigDialog}
                editingClient={editingClient}
                config={config}
                setConfig={setConfig}
                isFormSubmitted={isFormSubmitted}
                fieldErrors={fieldErrors}
                onClearFieldError={(mod, field) =>
                    setFieldErrors(prev => {
                        const next = { ...prev, [mod]: { ...prev[mod] } };
                        delete next[mod][field];
                        return next;
                    })
                }
                loading={loading}
                handleUpsertClient={handleUpsertClient}
                setOpenConfigDialog={setOpenConfigDialog}
                setEditingClient={setEditingClient}
                resetConfig={resetConfig}
                cid={editingClient?.cid || ''}
                initialMode={configDialogMode}
            />

            {/* ── Integration snippet modal ── */}
            <CodeModal
                open={codeModalOpen}
                client={currentCodeClient}
                setOpen={setCodeModalOpen}
                showToast={showSnackbar}
            />

            {/* ── General post/comment config modal ── */}
            <PostModal
                open={openGeneralConfigModal}
                onClose={() => setOpenGeneralConfigModal(false)}
                initialData={{ config: config.postConfig }}
                mode="edit"
                onSave={handleSaveGeneralConfig}
                title={t('client.general_comment_config_title')}
            />

            {/* ── VAPID / push notifications modal ── */}
            <VapidConfigModal
                open={openVapidConfigModal}
                onClose={() => setOpenVapidConfigModal(false)}
                initialData={{ vapid: config.vapid }}
                onSave={handleSaveVapidConfig}
                showToast={showSnackbar}
                loading={loading}
                isFormSubmitted={isFormSubmitted}
            />

            {/* ── SMTP email configuration modal ── */}
            <EmailConfigModal
                open={openEmailConfigModal}
                onClose={() => setOpenEmailConfigModal(false)}
                initialData={{ email: config.email }}
                onSave={handleSaveEmailConfig}
                showToast={showSnackbar}
                loading={loading}
                setLoading={() => {}}
                isFormSubmitted={isFormSubmitted}
                keepOpenOnSave={true}
                setOpenEmailConfigModal={setOpenEmailConfigModal}
            />

            {/* ── Reputation / trust levels modal ── */}
            <ReputationConfigModal
                open={openReputationConfigModal}
                onClose={() => setOpenReputationConfigModal(false)}
                client={editingReputationClient}
                showToast={showSnackbar}
            />

            {/* ── Resilience / P2P fallback modal ── */}
            <ResilienceConfigModal
                open={openResilienceConfigModal}
                onClose={() => setOpenResilienceConfigModal(false)}
                onSave={handleResilienceSaved}
                client={editingResilienceClient}
                showToast={showSnackbar}
            />

            {/* ── Network (TURN / Nostr / P2P) modal ── */}
            <NetworkConfigModal
                open={openNetworkConfigModal}
                onClose={() => {
                    setOpenNetworkConfigModal(false);
                    resetNetworkConfig();
                }}
                config={config}
                setConfig={setConfig}
                client={editingNetworkClient}
                onSave={handleSaveNetworkConfig}
                loading={loading}
                showToast={showSnackbar}
            />

            {/* ── Enterprise & community modules modal ── */}
            <ModulesConfigModal
                open={openModulesConfigModal}
                onClose={() => setOpenModulesConfigModal(false)}
                client={editingModulesClient}
                onSaved={handleModulesSaved}
            />

            {/* ── Global toast notifications ── */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Client;