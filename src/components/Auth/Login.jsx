// ./src/components/Auth/Login.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import { 
  TextField, 
  Button, 
  Typography, 
  Link,
  Box 
} from '@mui/material';

const Login = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(username, password);
      // Almacenamos solo el string del token, no el objeto completo
      sessionStorage.setItem('token', response.token);
      // Almacenamos los clients como string JSON
      sessionStorage.setItem('clients', JSON.stringify(response.clients));

      // Calculamos y almacenamos la expiración (2 horas = 7200000 ms)
      sessionStorage.setItem('tokenExpiration', Date.now() + 7200000);
      navigate('/dashboard');
    } catch (err) {
      setError(t('login.error'));
    }
  };

  return (
    <Box className='login-acrylic'>
      <Typography variant="h4" className='login-title'>
        {t('login.title')}
      </Typography>

      {error && (
        <Typography className='login-error'>
          {error}
        </Typography>
      )}

      <form onSubmit={handleSubmit} className='login-form'>
        <TextField
          fullWidth
          label={t('login.username')}
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          variant="filled"
          className='login-input'
        />
        <TextField
          fullWidth
          label={t('login.password')}
          type="password"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          variant="filled"
          className='login-input'
        />

        <Button 
          type="submit" 
          variant="contained" 
          fullWidth 
          className='login-button'
        >
          {t('login.submit')}
        </Button>

        <Typography className='login-forgot'>
          <Link href="#forgot-password" className='login-link'>
            {t('login.forgot_password')}
          </Link>
        </Typography>
      </form>
    </Box>
  );
};

export default Login;