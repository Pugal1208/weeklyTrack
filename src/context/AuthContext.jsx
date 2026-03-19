import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Firebase-authenticated admin state
  const [firebaseUser, setFirebaseUser] = useState(null);
  // Name-only user state (stored in memory/localStorage)
  const [guestUser, setGuestUser] = useState(() => {
    try {
      const persisted = localStorage.getItem('guestUser');
      return persisted ? JSON.parse(persisted) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);

  // Listen to Firebase Auth state changes (admin only)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // ─── Derived values ──────────────────────────────────────────────────────────
  const currentUser = firebaseUser
    ? { uid: firebaseUser.uid, email: firebaseUser.email, role: 'admin' }
    : guestUser;

  const userRole = currentUser?.role ?? null;

  // ─── Auth actions ─────────────────────────────────────────────────────────────
  const loginAsAdmin = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginAsUser = (name) => {
    const user = { name, role: 'user' };
    setGuestUser(user);
    localStorage.setItem('guestUser', JSON.stringify(user));
  };

  const logout = async () => {
    if (firebaseUser) {
      await signOut(auth);
    }
    setGuestUser(null);
    localStorage.removeItem('guestUser');
  };

  const value = {
    currentUser,
    userRole,
    authLoading,
    loginAsAdmin,
    loginAsUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
