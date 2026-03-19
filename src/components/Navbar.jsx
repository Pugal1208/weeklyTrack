import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate('/login');
  };

  const displayName =
    userRole === 'admin'
      ? currentUser?.email || 'Admin'
      : currentUser?.name || 'User';

  const roleColor = userRole === 'admin' ? 'primary' : 'secondary';
  const RoleIcon = userRole === 'admin' ? AdminIcon : PersonIcon;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(79, 70, 229, 0.12)',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
        {/* Brand */}
        <Box display="flex" alignItems="center" gap={1} sx={{ flexGrow: 1 }}>
          <DashboardIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            WeeklyTrack
          </Typography>
        </Box>

        {/* Role chip */}
        <Chip
          icon={<RoleIcon sx={{ fontSize: '16px !important' }} />}
          label={userRole === 'admin' ? 'Admin' : 'User'}
          color={roleColor}
          size="small"
          sx={{ mr: 2, fontWeight: 700 }}
        />

        {/* User menu */}
        <Tooltip title="Account">
          <IconButton onClick={handleMenu} sx={{ p: 0 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <ExpandMoreIcon sx={{ color: 'text.secondary', ml: 0.5, fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 4,
            sx: { borderRadius: 2, minWidth: 180, mt: 1 },
          }}
        >
          <MenuItem disabled sx={{ fontSize: 13, color: 'text.secondary' }}>
            Signed in as
          </MenuItem>
          <MenuItem disabled sx={{ fontWeight: 600 }}>
            {displayName}
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main', mt: 1 }}>
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
