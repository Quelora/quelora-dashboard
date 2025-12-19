import React, { useState, useEffect } from 'react';
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
    Button, 
    IconButton, 
    Chip, 
    Tooltip, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    TextField, 
    FormControlLabel, 
    Switch, 
    Avatar,
    Stack,
    CircularProgress,
    styled
} from '@mui/material';
import { 
    Add as AddIcon, 
    Delete as DeleteIcon, 
    RestoreFromTrash as RestoreIcon, 
    LockReset as LockResetIcon,
    Refresh as RefreshIcon,
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
    Email as EmailIcon,
    CheckCircle,
    Cancel
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { 
    getSystemUsers, 
    deleteSystemUser, 
    restoreSystemUser, 
    resetSystemUserPassword,
    unlockSystemUser 
} from '../api/systemUsers';
import { loadClientsFromSession } from '../api/auth';
import SystemUserForm from '../components/SystemUser/SystemUserForm';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    borderBottom: '1px solid var(--border-gray)',
    '&:last-child': { borderBottom: 'none' },
    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
    '&:hover': { backgroundColor: theme.palette.action.hover },
    '[data-theme="dark"] &:nth-of-type(odd)': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
}));

const PasswordStrengthIndicator = ({ password }) => {
    const { t } = useTranslation();
    const tests = [
        { regex: /.{8,}/, label: t('profile.password_requirement_length') || '8+ Characters' },
        { regex: /[A-Z]/, label: t('profile.password_requirement_uppercase') || 'Uppercase' },
        { regex: /[a-z]/, label: t('profile.password_lowercase') || 'Lowercase' },
        { regex: /[0-9]/, label: t('profile.password_number') || 'Number' },
        { regex: /[\W_]/, label: t('profile.password_requirement_special') || 'Special Character' }
    ];
    
    const requirements = tests.map(test => ({
        label: test.label,
        valid: test.regex.test(password)
    }));

    return (
        <Stack spacing={0.5} sx={{ mt: 1, pl: 1 }}>
            {requirements.map((req, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center' }}>
                    {req.valid ? (
                        <CheckCircle color="success" sx={{ fontSize: '0.9rem', mr: 1 }} />
                    ) : (
                        <Cancel color="error" sx={{ fontSize: '0.9rem', mr: 1 }} />
                    )}
                    <Typography variant="caption" color={req.valid ? "text.primary" : "text.secondary"}>
                        {req.label}
                    </Typography>
                </Box>
            ))}
        </Stack>
    );
};

const SystemUsersPage = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDeleted, setShowDeleted] = useState(false);
    
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [selectedUserForReset, setSelectedUserForReset] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [availableClients, setAvailableClients] = useState([]);
    const [currentUserRole, setCurrentUserRole] = useState('');
    
    useEffect(() => {
        const clients = loadClientsFromSession();
        setAvailableClients(clients || []);
        
        const role = localStorage.getItem('user_role') || 'admin'; 
        setCurrentUserRole(role);
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getSystemUsers(showDeleted);
            setUsers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [showDeleted]);

    const handleDelete = async (user) => {
        const result = await Swal.fire({
            title: t('common.are_you_sure'),
            text: t('users.deleteConfirmText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('users.delete'),
            cancelButtonText: t('users.cancel')
        });

        if (result.isConfirmed) {
            try {
                await deleteSystemUser(user._id);
                Swal.fire(t('users.deleted'), t('users.deleteSuccess'), 'success');
                fetchUsers();
            } catch (error) {
                Swal.fire(t('common.error'), error, 'error');
            }
        }
    };

    const handleRestore = async (user) => {
        try {
            await restoreSystemUser(user._id);
            Swal.fire(t('users.restored_title'), t('users.restoreSuccess'), 'success');
            fetchUsers();
        } catch (error) {
            Swal.fire(t('common.error'), error, 'error');
        }
    };

    const handleUnlock = async (user) => {
        const result = await Swal.fire({
            title: t('users.confirmUnlockTitle'),
            text: t('users.confirmUnlockText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: t('users.unlock'),
            cancelButtonText: t('users.cancel')
        });

        if (result.isConfirmed) {
            try {
                await unlockSystemUser(user._id);
                Swal.fire(t('common.success'), t('users.unlockSuccess'), 'success');
                fetchUsers();
            } catch (error) {
                Swal.fire(t('common.error'), error, 'error');
            }
        }
    };

    const handleOpenResetDialog = (user) => {
        setSelectedUserForReset(user);
        setNewPassword('');
        setResetDialogOpen(true);
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 8) {
            Swal.fire(t('common.error'), t('users.weak_password_desc'), 'error');
            return;
        }
        setResetLoading(true);
        try {
            await resetSystemUserPassword(selectedUserForReset._id, newPassword);
            setResetDialogOpen(false);
            Swal.fire(t('common.success'), t('users.passwordResetSuccess'), 'success');
            fetchUsers();
        } catch (error) {
            Swal.fire(t('common.error'), error, 'error');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <Box className="users-container">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2, background: 'var(--card-bg)', borderRadius: '12px' }}>
                <Typography variant="h4" className="title">
                    {t('users.systemUsersTitle')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControlLabel
                        control={<Switch checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />}
                        label={t('users.showDeleted')}
                    />
                    <IconButton onClick={fetchUsers}>
                        <RefreshIcon />
                    </IconButton>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                    >
                        {t('users.createUser')}
                    </Button>
                </Box>
            </Box>

            <Paper elevation={0} sx={{ width: '100%', overflow: 'hidden', bgcolor: 'transparent' }}>
                <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
                    <Table stickyHeader aria-label="system users table">
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('users.user')}</TableCell>
                                <TableCell>{t('users.role')}</TableCell>
                                <TableCell>{t('users.status')}</TableCell>
                                <TableCell>{t('users.clients')}</TableCell>
                                <TableCell align="right">{t('common.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        {t('users.noData')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => {
                                    const isLocked = user.lockUntil && new Date(user.lockUntil) > new Date();
                                    
                                    return (
                                        <StyledTableRow key={user._id} sx={{ opacity: user.isDeleted ? 0.6 : 1 }}>
                                            <TableCell>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Avatar src={user.picture}>{user.username.charAt(0).toUpperCase()}</Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle2">
                                                            {user.given_name} {user.family_name}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                                            {user.username}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <EmailIcon fontSize="inherit" sx={{ mr: 0.5 }} /> {user.email}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={t(`users.roles.${user.role}`) || user.role} size="small" color="primary" variant="outlined" />
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1}>
                                                    {user.isDeleted ? (
                                                        <Chip label={t('users.deleted')} size="small" color="error" />
                                                    ) : (
                                                        <Chip label={t('users.active')} size="small" color="success" />
                                                    )}
                                                    {isLocked && (
                                                        <Tooltip title={t('users.accountLockedBruteForce')}>
                                                            <Chip 
                                                                icon={<LockIcon />} 
                                                                label={t('users.locked')} 
                                                                size="small" 
                                                                color="warning" 
                                                                variant="outlined" 
                                                            />
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {user.clients && user.clients.length > 0 ? (
                                                        user.clients.map(c => (
                                                            <Chip key={c.cid} label={c.cid} size="small" sx={{ fontSize: '0.7rem' }} />
                                                        ))
                                                    ) : (
                                                        <Typography variant="caption" color="textSecondary">
                                                            {user.role === 'god' ? t('users.allClients') : t('users.noClients')}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    {isLocked && !user.isDeleted && (
                                                        <Tooltip title={t('users.unlockAccount')}>
                                                            <IconButton color="warning" size="small" onClick={() => handleUnlock(user)}>
                                                                <LockOpenIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    
                                                    {!user.isDeleted && (
                                                        <Tooltip title={t('users.resetPassword')}>
                                                            <IconButton color="info" size="small" onClick={() => handleOpenResetDialog(user)}>
                                                                <LockResetIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    
                                                    {user.isDeleted ? (
                                                        <Tooltip title={t('users.restore_action')}>
                                                            <IconButton color="success" size="small" onClick={() => handleRestore(user)}>
                                                                <RestoreIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip title={t('users.delete')}>
                                                            <IconButton color="error" size="small" onClick={() => handleDelete(user)}>
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </StyledTableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{t('users.resetPasswordFor')} {selectedUserForReset?.username}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label={t('users.new_password_label')}
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    {newPassword && <PasswordStrengthIndicator password={newPassword} />}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResetDialogOpen(false)}>{t('users.cancel')}</Button>
                    <Button onClick={handleResetPassword} variant="contained" disabled={resetLoading}>
                        {resetLoading ? <CircularProgress size={24} /> : t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {createDialogOpen && (
                <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>{t('users.createUser')}</DialogTitle>
                    <DialogContent dividers>
                        <SystemUserForm 
                            onSuccess={() => {
                                setCreateDialogOpen(false);
                                fetchUsers();
                            }}
                            onCancel={() => setCreateDialogOpen(false)}
                            availableClients={availableClients}
                            currentUserRole={currentUserRole}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </Box>
    );
};

export default SystemUsersPage;