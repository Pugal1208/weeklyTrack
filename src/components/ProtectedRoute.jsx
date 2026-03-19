import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

/**
 * ProtectedRoute — wraps a route and enforces role-based access.
 * Props:
 *   allowedRole: 'admin' | 'user'
 *   children: JSX element to render if authorized
 */
export default function ProtectedRoute({ allowedRole, children }) {
  const { currentUser, userRole, authLoading } = useAuth();

  // Show spinner while Firebase auth state resolves
  if (authLoading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // Not logged in at all
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role
  if (userRole !== allowedRole) {
    return <Navigate to={userRole === 'admin' ? '/admin' : '/user'} replace />;
  }

  return children;
}
