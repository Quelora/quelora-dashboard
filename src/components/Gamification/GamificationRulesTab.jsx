import React, { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Switch,
    styled,
    Box,
    Tabs,
    Tab,
    Typography
} from '@mui/material';
import {
    Create as ContentIcon,
    People as SocialIcon,
    Loyalty as LoyaltyIcon,
    Verified as QualityIcon,
    Extension as ModulesIcon
} from '@mui/icons-material';
import CustomTextField from '../Common/CustomTextField';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    borderBottom: '1px solid var(--border-gray)',
    '&:last-child': { borderBottom: 'none' },
    '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
    '&:hover': { backgroundColor: theme.palette.action.hover },
    '[data-theme="dark"] &:nth-of-type(odd)': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
}));

const StyledTableCell = styled(TableCell)(() => ({
    padding: '4px 16px !important',
    height: 60,
}));

const RULE_CATEGORIES = {
    CONTENT: {
        icon: <ContentIcon />,
        actions: ['POST_CREATED', 'COMMENT_CREATED', 'REPLY_CREATED', 'MEDIA_UPLOADED']
    },
    SOCIAL: {
        icon: <SocialIcon />,
        actions: ['LIKE_GIVEN', 'LIKE_RECEIVED', 'POST_SHARED', 'USER_MENTIONED']
    },
    LOYALTY: {
        icon: <LoyaltyIcon />,
        actions: ['DAILY_LOGIN', 'STREAK_BONUS', 'PROFILE_COMPLETED', 'ACCOUNT_VERIFIED']
    },
    QUALITY: {
        icon: <QualityIcon />,
        actions: ['POST_FEATURED', 'REPORT_APPROVED']
    },
    MODULES: {
        icon: <ModulesIcon />,
        actions: ['VIDEO_WATCHED', 'SURVEY_VOTED', 'QUEST_COMPLETED']
    }
};

const GamificationRulesTab = ({ t, rules, onUpdateRule, searchTerm }) => {
    const [currentTab, setCurrentTab] = useState('CONTENT');

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const processedRules = useMemo(() => {
        const allowedActions = RULE_CATEGORIES[currentTab]?.actions || [];
        let filtered = rules.filter(r => allowedActions.includes(r.actionType));

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(rule => 
                t(`gamification.rules.actions.${rule.actionType}`).toLowerCase().includes(lowerSearch)
            );
        }

        return filtered.sort((a, b) => {
            const nameA = t(`gamification.rules.actions.${a.actionType}`);
            const nameB = t(`gamification.rules.actions.${b.actionType}`);
            return nameA.localeCompare(nameB);
        });
    }, [rules, currentTab, searchTerm, t]);

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs 
                    value={currentTab} 
                    onChange={handleTabChange} 
                    aria-label="rule categories"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {Object.entries(RULE_CATEGORIES).map(([key, config]) => (
                        <Tab 
                            key={key} 
                            value={key} 
                            icon={config.icon} 
                            iconPosition="start"
                            label={t(`gamification.rules.categories.${key}`)} 
                        />
                    ))}
                </Tabs>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0, border: '1px solid var(--border-color)' }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <StyledTableCell sx={{ fontWeight: 'bold' }}>
                                {t('gamification.rules.action')}
                            </StyledTableCell>
                            <StyledTableCell sx={{ fontWeight: 'bold', width: 120 }}>
                                {t('gamification.rules.xp_reward')}
                            </StyledTableCell>
                            <StyledTableCell sx={{ fontWeight: 'bold', width: 120 }}>
                                {t('gamification.rules.coin_reward')}
                            </StyledTableCell>
                            {/* NUEVA COLUMNA REPUTACION */}
                            <StyledTableCell sx={{ fontWeight: 'bold', width: 120 }}>
                                {t('gamification.rules.reputation_reward')}
                            </StyledTableCell>
                            <StyledTableCell sx={{ fontWeight: 'bold', width: 120 }}>
                                {t('gamification.rules.daily_limit')}
                            </StyledTableCell>
                            <StyledTableCell sx={{ fontWeight: 'bold', width: 100 }} align="center">
                                {t('gamification.rules.active')}
                            </StyledTableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {processedRules.map((rule) => (
                            <StyledTableRow key={rule.actionType}>
                                <StyledTableCell>
                                    <Box>
                                        <Typography variant="body2" fontWeight="medium">
                                            {t(`gamification.rules.actions.${rule.actionType}`, rule.actionType)}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" sx={{ fontFamily: 'monospace' }}>
                                            {rule.actionType}
                                        </Typography>
                                    </Box>
                                </StyledTableCell>

                                <StyledTableCell>
                                    <CustomTextField
                                        type="number"
                                        label="XP"
                                        value={rule.xpReward ?? 0}
                                        onChange={(e) =>
                                            onUpdateRule({ ...rule, xpReward: parseInt(e.target.value) || 0 })
                                        }
                                        inputProps={{ min: 0 }}
                                        size="small"
                                        fullWidth
                                    />
                                </StyledTableCell>

                                <StyledTableCell>
                                    <CustomTextField
                                        type="number"
                                        label="Coins"
                                        value={rule.coinReward ?? 0}
                                        onChange={(e) =>
                                            onUpdateRule({ ...rule, coinReward: parseInt(e.target.value) || 0 })
                                        }
                                        inputProps={{ min: 0 }}
                                        size="small"
                                        fullWidth
                                    />
                                </StyledTableCell>

                                {/* NUEVO INPUT REPUTACION (DECIMAL) */}
                                <StyledTableCell>
                                    <CustomTextField
                                        type="number"
                                        label="Rep"
                                        value={rule.reputation ?? 0}
                                        onChange={(e) =>
                                            onUpdateRule({ ...rule, reputation: parseFloat(e.target.value) || 0 })
                                        }
                                        inputProps={{ min: 0, step: 0.1 }}
                                        size="small"
                                        fullWidth
                                    />
                                </StyledTableCell>

                                <StyledTableCell>
                                    <CustomTextField
                                        type="number"
                                        value={rule.dailyLimit}
                                        onChange={(e) =>
                                            onUpdateRule({ ...rule, dailyLimit: parseInt(e.target.value) || 0 })
                                        }
                                        inputProps={{ min: 0 }}
                                        size="small"
                                        fullWidth
                                        helperText={rule.dailyLimit === 0 ? t('common.unlimited', 'Unlimited') : ''}
                                    />
                                </StyledTableCell>

                                <StyledTableCell align="center">
                                    <Switch
                                        checked={rule.active}
                                        onChange={(e) =>
                                            onUpdateRule({ ...rule, active: e.target.checked })
                                        }
                                        color="success"
                                    />
                                </StyledTableCell>
                            </StyledTableRow>
                        ))}

                        {processedRules.length === 0 && (
                            <TableRow>
                                <StyledTableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography color="textSecondary">
                                        {t('common.no_data_available', 'No rules found in this category')}
                                    </Typography>
                                </StyledTableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default GamificationRulesTab;