/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// filepath: ./src/hooks/useSystemUserForm.js
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createSystemUser, updateSystemUser } from '../api/systemUsers';
import { ROLES } from '../utils/permissions';

/**
 * @param {Function} onSuccess
 * @param {string}   currentUserRole
 * @param {Object}   [options]
 * @param {boolean}  [options.editMode=false]   - true when editing an existing user
 * @param {Object}   [options.initialData=null] - user object to pre-populate the form
 * @param {string}   [options.userId=null]      - _id of the user being edited
 */
const useSystemUserForm = (onSuccess, currentUserRole, { editMode = false, initialData = null, userId = null } = {}) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');

    const buildInitial = () => {
        if (editMode && initialData) {
            return {
                email:       initialData.email       || '',
                given_name:  initialData.given_name  || '',
                family_name: initialData.family_name || '',
                role:        initialData.role        || ROLES.EDITOR,
                clientIds:   (initialData.clients || []).map(c => c.cid),
                locale:      initialData.locale      || 'en',
                // create-only fields — unused in edit mode
                username:    '',
                password:    '',
                notifyUser:  false,
            };
        }
        return {
            username:    '',
            email:       '',
            password:    '',
            given_name:  '',
            family_name: '',
            role:        ROLES.EDITOR,
            clientIds:   [],
            locale:      'en',
            notifyUser:  true,
        };
    };

    const [formData, setFormData] = useState(buildInitial);

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'notifyUser' ? checked : value,
        }));
    };

    const validate = () => {
        if (editMode) {
            if (!formData.role || !formData.email) {
                return t('common.required_fields_error') || 'Please fill in required fields';
            }
            if (formData.clientIds.length === 0 && currentUserRole !== ROLES.GOD) {
                return t('common.select_at_least_one_client') || 'Select at least one client';
            }
            return null;
        }

        if (!formData.username || !formData.password || !formData.role || !formData.email) {
            return t('common.required_fields_error') || 'Please fill in required fields';
        }
        if (formData.password.length < 8) {
            return t('profile.password_length') || 'Password must be at least 8 characters';
        }
        if (formData.clientIds.length === 0 && currentUserRole !== ROLES.GOD) {
            return t('common.select_at_least_one_client') || 'Select at least one client';
        }
        return null;
    };

    const handleSubmit = async () => {
        setLoading(true);
        setGeneralError('');

        const validationError = validate();
        if (validationError) {
            setGeneralError(validationError);
            setLoading(false);
            return;
        }

        try {
            if (editMode) {
                await updateSystemUser(userId, {
                    email:       formData.email,
                    given_name:  formData.given_name,
                    family_name: formData.family_name,
                    role:        formData.role,
                    locale:      formData.locale,
                    clientIds:   formData.clientIds,
                });
            } else {
                await createSystemUser(formData);
            }
            if (onSuccess) onSuccess();
        } catch (err) {
            setGeneralError(typeof err === 'string' ? err : (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData(buildInitial());
        setGeneralError('');
    };

    return { formData, loading, generalError, handleChange, handleSubmit, resetForm };
};

export default useSystemUserForm;