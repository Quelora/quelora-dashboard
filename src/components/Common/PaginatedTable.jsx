/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

// ./src/components/Common/PaginatedTable.jsx
import { useTranslation } from 'react-i18next';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TableSortLabel,
    Paper,
    Box,
    Typography,
    CircularProgress,
    Button,
} from '@mui/material';
import { ArrowUpward as ArrowUpwardIcon, ArrowDownward as ArrowDownwardIcon } from '@mui/icons-material';

const PaginatedTable = ({
    headers,
    data,
    loading,
    error,
    pagination,
    filters,
    fetchData,
    handleSort,
    handlePageChange,
    handleLimitChange,
    renderRow
}) => {
    const { t } = useTranslation();

    if (!pagination.total && !loading && !error) {
        return (
            <Paper className="client-paper" sx={{p: 3, textAlign: 'center'}}>
                <Typography variant="body1">{t('common.no_data_available') || 'No data available'}</Typography>
            </Paper>
        );
    }

    if (loading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', p: 4}}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Paper className="error-paper client-paper" sx={{p: 3, textAlign: 'center'}}>
                <Typography color="error">{error}</Typography>
                <Button onClick={fetchData} sx={{mt: 2}}>{t('common.retry') || 'Retry'}</Button>
            </Paper>
        );
    }

    return (
        <Paper className="client-paper" elevation={0} sx={{width: '100%', gap: 2, p: 2, display: 'flex', flexDirection: 'column'}}>
            <TableContainer component={Paper} className="posts-table-container" elevation={0}>
                <Table stickyHeader aria-label="paginated data table">
                    <TableHead>
                        <TableRow>
                            {headers.map((headCell) => (
                                <TableCell
                                    key={headCell.id}
                                    align={headCell.numeric ? 'right' : 'left'}
                                    sortDirection={filters.sort === headCell.id ? filters.order : false}
                                    onClick={headCell.sortable ? () => handleSort(headCell.id) : undefined}
                                    sx={{cursor: headCell.sortable ? 'pointer' : 'default', minWidth: headCell.minWidth || 'auto'}}
                                >
                                    {headCell.sortable ? (
                                        <TableSortLabel
                                            active={filters.sort === headCell.id}
                                            direction={filters.sort === headCell.id ? filters.order : 'desc'}
                                            IconComponent={() => (
                                                <Box sx={{display: 'flex', flexDirection: 'column', ml: 0.5}}>
                                                    <ArrowUpwardIcon 
                                                        fontSize="small" 
                                                        sx={{visibility: filters.sort === headCell.id && filters.order === 'asc' ? 'visible' : 'hidden', m: 0, p: 0, height: 10}} 
                                                    />
                                                    <ArrowDownwardIcon 
                                                        fontSize="small" 
                                                        sx={{visibility: filters.sort === headCell.id && filters.order === 'desc' ? 'visible' : 'hidden', m: 0, p: 0, height: 10, mt: '-8px'}} 
                                                    />
                                                </Box>
                                            )}
                                        >
                                            {t(headCell.labelKey)}
                                        </TableSortLabel>
                                    ) : (
                                        t(headCell.labelKey)
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((item, index) => renderRow(item, index))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={pagination.total}
                rowsPerPage={pagination.limit}
                page={pagination.page} 
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleLimitChange}
                className="pagination"
                labelRowsPerPage={t('common.rowsPerPage')}
                labelDisplayedRows={({from, to, count}) => 
                    t('common.displayedRows', {from: from, to: to, count: count})
                }
            />
        </Paper>
    );
};

export default PaginatedTable;