// filepath: src/App.js
import React, { useState, useEffect } from 'react';
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
import ReportsPage from './pages/ReportsPage';
import ProfileAnalyticsPage from './pages/ProfileAnalyticsPage';
import ModerationAnalyticsPage from './pages/ModerationAnalyticsPage';
import SurveysPage from './pages/SurveysPage';
import CampaignsPage from './pages/CampaignsPage';
import PlacementsPage from './pages/PlacementsPage';
import PlacementPricingPage from './pages/PlacementPricingPage';
import AdvertiserProfilesPage from './pages/AdvertiserProfilesPage';
import SystemUsersPage from './pages/SystemUsersPage.jsx';
import GamificationPage from './pages/GamificationPage.jsx'; // IMPORTADO
import EmbedLayout from './components/EmbedLayout';

import './i18n';

function App() {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const muiTheme = createTheme({
        palette: {
            mode: theme,
            ...(theme === 'light'
                ? {
                    primary: { main: '#4f46e5' },
                }
                : {
                    primary: { main: '#818cf8' },
                }),
        },
        typography: {
            fontFamily: [
                'Inter',
                '-apple-system',
                'BlinkMacSystemFont',
                '"Segoe UI"',
                'Roboto',
                'Oxygen',
                'sans-serif'
            ].join(','),
        }
    });

    const googleTheme = createTheme({
        palette: {
            mode: 'light',
            background: { default: '#f0f2f5', paper: '#ffffff' },
            primary: { main: '#1976d2' },
            text: { primary: '#202124', secondary: '#5f6368' },
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            button: { textTransform: 'none', fontWeight: 500 }, 
        },
        shape: { borderRadius: 8 },
        components: {
            MuiPaper: {
            styleOverrides: {
                root: { boxShadow: 'none', border: '1px solid #e0e0e0' },
            },
            },
            MuiAppBar: {
            styleOverrides: {
                root: { boxShadow: 'none', borderBottom: '1px solid #e0e0e0', backgroundColor: '#fff', color: '#5f6368' }, 
            },
            },
        },
    });

    return (
        <ThemeProvider theme={muiTheme}>
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Router>
                    <Routes>
                        <Route path="/login" element={<LoginPage toggleTheme={toggleTheme} currentTheme={theme}/>}/>

                        <Route element={<PrivateRoute isEmbedMode={true}/>}>
                            <Route element={<EmbedLayout />}>
                                <Route path="/embed/post/:entityId" element={<PostPage isEmbedMode={true} />}/>
                            </Route>
                        </Route>

                        <Route element={<PrivateRoute isEmbedMode={false}/>}>
                            <Route element={<DashboardLayout toggleTheme={toggleTheme} currentTheme={theme}/>}>
                                <Route index element={<Dashboard/>}/>
                                <Route path="dashboard" element={<Dashboard/>}/>
                                <Route path="profile" element={<ProfilePage/>}/>
                                <Route path="client" element={<ClientPage/>}/>
                                <Route path="posts" element={<ClientPostsPage/>}/>
                                <Route path="surveys" element={<SurveysPage/>}/>
                                <Route path="campaigns" element={<CampaignsPage/>}/>
                                <Route path="placements" element={<PlacementsPage/>}/>
                                <Route path="placement-pricing" element={<PlacementPricingPage/>}/>
                                <Route path="advertiser-profiles" element={<AdvertiserProfilesPage/>}/>
                                <Route path="post-stats" element={<PostStatsPage/>}/>
                                <Route path="profile-analytics" element={<ProfileAnalyticsPage/>}/>
                                <Route path="moderation-analytics" element={<ModerationAnalyticsPage/>}/>
                                <Route path="/post/:entity?" element={<PostPage/>}/>
                                <Route path="trash" element={<TrashPage/>}/>
                                <Route path="users" element={<UserPage/>}/>
                                <Route path="reports" element={<ReportsPage/>}/>
                                <Route path="/post/:postId/comments" element={<PostCommentsPage/>}/>
                                <Route path="system-users" element={<SystemUsersPage/>}/>
                                <Route path="gamification" element={<GamificationPage/>}/>
                            </Route>
                        </Route>
                    </Routes>
                </Router>
            </div>
        </ThemeProvider>
    );
}

export default App;