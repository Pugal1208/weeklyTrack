import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Badge as BadgeIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function LoginPage() {
  const { loginAsAdmin, loginAsUser } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Admin fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // User field
  const [name, setName] = useState('');

  const handleTabChange = (_, newVal) => {
    setTab(newVal);
    setError('');
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await loginAsAdmin(email.trim(), password);
      navigate('/admin');
    } catch (err) {
      setError(
        err.code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUserLogin = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    loginAsUser(name.trim());
    navigate('/user');
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        background:
          'linear-gradient(135deg, #EEF2FF 0%, #E0F2FE 50%, #F0FDF4 100%)',
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 460 }}>
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Box
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)',
              boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
              mb: 2,
            }}
          >
            <LoginIcon sx={{ color: 'white', fontSize: 32 }} />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #4F46E5 0%, #0EA5E9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            WeeklyTrack
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Weekly submission tracking platform
          </Typography>
        </Box>

        <Card elevation={0} sx={{ border: '1px solid rgba(79,70,229,0.12)' }}>
          <CardContent sx={{ p: 4 }}>
            <Tabs
              value={tab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': { fontWeight: 700 },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: 2,
                  background: 'linear-gradient(90deg, #4F46E5, #818CF8)',
                },
              }}
            >
              <Tab
                icon={<AdminIcon />}
                iconPosition="start"
                label="Admin"
                id="tab-admin"
              />
              <Tab
                icon={<PersonIcon />}
                iconPosition="start"
                label="User"
                id="tab-user"
              />
            </Tabs>

            <Divider sx={{ mt: 2 }} />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {/* Admin Login */}
            <TabPanel value={tab} index={0}>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Sign in with your admin email and password.
              </Typography>
              <Box component="form" onSubmit={handleAdminLogin} display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                  required
                  id="admin-email"
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                  required
                  id="admin-password"
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  fullWidth
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AdminIcon />}
                >
                  {loading ? 'Signing in…' : 'Sign in as Admin'}
                </Button>
              </Box>
            </TabPanel>

            {/* User Login */}
            <TabPanel value={tab} index={1}>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Enter your name to access your weekly form.
              </Typography>
              <Box component="form" onSubmit={handleUserLogin} display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="Your Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                  required
                  id="user-name"
                  placeholder="e.g. Jane Smith"
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  size="large"
                  fullWidth
                  startIcon={<PersonIcon />}
                >
                  Continue as User
                </Button>
              </Box>
            </TabPanel>
          </CardContent>
        </Card>

        <Typography variant="caption" display="block" textAlign="center" mt={3} color="text.secondary">
          © {new Date().getFullYear()} WeeklyTrack. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
