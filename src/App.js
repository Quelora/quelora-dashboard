// ./src/App.js
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/Auth/PrivateRoute';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ClientPage from './pages/ClientPage';
import ClientPostsPage from './pages/ClientPostsPage';
import PostPage from './pages/PostPage';
import DashboardLayout from './components/DashboardLayout';
import TrashPage from './pages/TrashPage';
import UserPage from './pages/UserPage';
import PostCommentsPage from './pages/PostCommentsPage';
import PostStatsPage from './pages/PostStatsPage';

const theme = createTheme({
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Oxygen',
      'sans-serif'
    ].join(','),
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<PrivateRoute />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="client" element={<ClientPage />} />
                <Route path="posts" element={<ClientPostsPage />} />
                <Route path="post-stats" element={<PostStatsPage />} /> 
                <Route path="/post/:entity?" element={<PostPage />} />
                <Route path="trash" element={<TrashPage />} />
                <Route path="users" element={<UserPage />} />
                <Route path="/post/:postId/comments" element={<PostCommentsPage />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;