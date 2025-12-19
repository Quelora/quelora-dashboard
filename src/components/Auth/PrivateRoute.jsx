import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { getUserRole, isRouteAuthorized, getDefaultRoute } from '../../utils/permissions';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute = ({ isEmbedMode }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const checkAccess = () => {
            const token = sessionStorage.getItem('token');
            
            if (!token) {
                sessionStorage.setItem('redirectPath', location.pathname + location.search);
                navigate('/login');
                return;
            }

            if (isEmbedMode) {
                setIsAuthorized(true);
                setIsChecking(false);
                return;
            }

            const userRole = getUserRole();
            const authorized = isRouteAuthorized(location.pathname, userRole);

            if (!authorized) {
                const correctRedirect = getDefaultRoute(userRole);

                if (location.pathname === correctRedirect) {
                    sessionStorage.clear();
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