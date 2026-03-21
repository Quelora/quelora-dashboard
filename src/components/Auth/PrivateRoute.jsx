// src/components/Auth/PrivateRoute.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { getUserRole, isRouteAuthorized, getDefaultRoute } from '../../utils/permissions';
import { CircularProgress, Box } from '@mui/material';
import embedStorage from '../../utils/embedStorage';

/**
 * Route guard that enforces authentication and role-based authorization
 * for both the main dashboard and embed-mode windows.
 *
 * Authentication check strategy:
 *  - Token is read via `embedStorage.getItem`, which in embed context falls
 *    back from `localStorage` to `sessionStorage`. This means a user already
 *    authenticated in the dashboard tab does **not** need to log in again
 *    when the host site opens an embed popup.
 *  - The `redirectPath` written before bouncing to `/login` is also stored
 *    via `embedStorage` so it survives across the storage backends.
 *
 * Authorization check strategy (dashboard only):
 *  - Embed routes skip role verification — the backend is responsible for
 *    scoping what an embed user can do.
 *  - Dashboard routes are validated against `ROUTE_PERMISSIONS` via
 *    `isRouteAuthorized`. An unauthorized role is redirected to its default
 *    route; if the default route itself is unauthorized the session is
 *    cleared and the user is sent to `/login`.
 *
 * @component
 * @param {Object}  props             - Component props.
 * @param {boolean} props.isEmbedMode - When `true` role-based checks are skipped.
 * @returns {JSX.Element}
 */
const PrivateRoute = ({ isEmbedMode }) => {
    const navigate   = useNavigate();
    const location   = useLocation();
    const [isChecking,   setIsChecking]   = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const checkAccess = () => {
            const token = embedStorage.getItem('token');

            if (!token) {
                embedStorage.setItem(
                    'redirectPath',
                    location.pathname + location.search
                );
                navigate('/login');
                return;
            }

            if (isEmbedMode) {
                setIsAuthorized(true);
                setIsChecking(false);
                return;
            }

            const userRole   = getUserRole();
            const authorized = isRouteAuthorized(location.pathname, userRole);

            if (!authorized) {
                const correctRedirect = getDefaultRoute(userRole);

                if (location.pathname === correctRedirect) {
                    embedStorage.clear();
                    navigate('/login');
                } else {
                    navigate(correctRedirect, { replace: true });
                }
            } else {
                setIsAuthorized(true);
            }

            setIsChecking(false);
        };

        checkAccess();
    }, [navigate, location, isEmbedMode]);

    if (isChecking) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return isAuthorized ? <Outlet /> : null;
};

export default PrivateRoute;