// filepath: ./src/hooks/useSystemUserForm.js
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createSystemUser } from '../api/systemUsers';
import { ROLES } from '../utils/permissions';

const useSystemUserForm = (onSuccess, currentUserRole) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');
    
    const initialFormData = {
        username: '',
        email: '',
        password: '',
        given_name: '',
        family_name: '',
        role: ROLES.EDITOR,
        clientIds: [],
        locale: 'en',
        notifyUser: true
    };

    const [formData, setFormData] = useState(initialFormData);

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'notifyUser' ? checked : value
        }));
    };

    const validate = () => {
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
            await createSystemUser(formData);
            setFormData(initialFormData); // Reset form
            if (onSuccess) onSuccess();
        } catch (err) {
            setGeneralError(typeof err === 'string' ? err : (err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setGeneralError('');
    };

    return {
        formData,
        loading,
        generalError,
        handleChange,
        handleSubmit,
        resetForm
    };
};

export default useSystemUserForm;