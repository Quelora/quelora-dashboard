// ./src/components/Auth/PrivateRoute.jsx
import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return <Outlet />;
};

export default PrivateRoute;