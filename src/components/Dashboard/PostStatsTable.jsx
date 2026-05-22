/*
 * Quelora — quelora-dashboard
 * Copyright (C) 2026 Germán Zelaya — https://quelora.org
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This file is part of Quelora. See the LICENSE file for terms.
 */

import React from 'react';
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
    Typography,
    Checkbox
} from '@mui/material';

const headCells = [
    {id: 'select', labelKey: 'dashboard.postStats.header.select', numeric: false},
    {id: 'title', labelKey: 'dashboard.postStats.header.title', numeric: false, sortable: true},
    {id: 'created_at', labelKey: 'dashboard.postStats.header.date', numeric: false, sortable: true},
    {id: 'viewsCount', labelKey: 'dashboard.postStats.header.views', numeric: true, sortable: true},
    {id: 'likesCount', labelKey: 'dashboard.postStats.header.likes', numeric: true, sortable: true},
    {id: 'commentCount', labelKey: 'dashboard.postStats.header.comments', numeric: true, sortable: true},
    {id: 'sharesCount', labelKey: 'dashboard.postStats.header.shares', numeric: true, sortable: true},
];

const PostStatsTable = ({ data, pagination, handleSort, handlePageChange, handleLimitChange, selectedPostEntities, handleTogglePost }) => {
    const { t } = useTranslation();
    const {sortBy, sortOrder, currentPage, limit, totalPosts} = pagination;

    const createSortHandler = (property) => (event) => {
        if (property !== 'select') {
            handleSort(property);
        }
    };

    const handleChangePage = (event, newPage) => {
        handlePageChange(newPage + 1); 
    };

    const handleChangeRowsPerPage = (event) => {
        handleLimitChange(parseInt(event.target.value, 10));
    };

    return (
        <Paper sx={{width: '100%', mb: 2}}>
            <TableContainer>
                <Table stickyHeader aria-label="post statistics table">
                    <TableHead>
                        <TableRow>
                            {headCells.map((headCell) => (
                                <TableCell
                                    key={headCell.id}
                                    align={headCell.numeric ? 'right' : (headCell.id === 'select' ? 'center' : 'left')}
                                    sortDirection={sortBy === headCell.id ? sortOrder : false}
                                    onClick={headCell.id !== 'select' && headCell.sortable ? createSortHandler(headCell.id) : undefined}
                                    sx={{cursor: headCell.id !== 'select' && headCell.sortable ? 'pointer' : 'default'}}
                                >
                                    {headCell.id !== 'select' ? (
                                        <TableSortLabel
                                            active={sortBy === headCell.id}
                                            direction={sortBy === headCell.id ? sortOrder : 'desc'}
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
                        {data.map((post) => {
                            const isItemSelected = selectedPostEntities.includes(post.entity);
                            return (
                                <TableRow 
                                    hover 
                                    key={post.entity}
                                    onClick={() => handleTogglePost(post.entity)}
                                    role="checkbox"
                                    aria-checked={isItemSelected}
                                    selected={isItemSelected}
                                    sx={{cursor: 'pointer'}}
                                >
                                    <TableCell padding="checkbox" align="center">
                                        <Checkbox
                                            color="primary"
                                            checked={isItemSelected}
                                            inputProps={{'aria-labelledby': post.title}}
                                            onClick={(e) => {e.stopPropagation(); handleTogglePost(post.entity);}}
                                        />
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        <Typography variant="body2" noWrap>
                                            {post.title}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell align="right">{post.viewsCount.toLocaleString()}</TableCell>
                                    <TableCell align="right">{post.likesCount.toLocaleString()}</TableCell>
                                    <TableCell align="right">{post.commentCount.toLocaleString()}</TableCell>
                                    <TableCell align="right">{post.sharesCount.toLocaleString()}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={totalPosts}
                rowsPerPage={limit}
                page={currentPage - 1}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage={t('common.rowsPerPage')}
                labelDisplayedRows={({from, to, count}) => t('common.displayedRows', {from, to, count})}
            />
        </Paper>
    );
};

export default PostStatsTable;