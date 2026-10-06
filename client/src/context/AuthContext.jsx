import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('classic_cut_user');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('classic_cut_token') || null);
  const [loading, setLoading] = useState(!user);
  const lastLoadUserRef = useRef(0);

  const saveUserSession = (userData, tokenStr) => {
    if (userData) {
      setUser(userData);
      try {
        localStorage.setItem('classic_cut_user', JSON.stringify(userData));
      } catch (e) {}
    }
    if (tokenStr) {
      setToken(tokenStr);
      try {
        localStorage.setItem('classic_cut_token', tokenStr);
      } catch (e) {}
    }
  };

  // Fetch current user if token exists
  const loadUser = async (force = false) => {
    const savedToken = localStorage.getItem('classic_cut_token');
    if (!savedToken) {
      setUser(null);
      setToken(null);
      try {
        localStorage.removeItem('classic_cut_user');
      } catch (e) {}
      setLoading(false);
      return;
    }

    const now = Date.now();
    if (!force && now - lastLoadUserRef.current < 45000) {
      setLoading(false);
      return;
    }
    lastLoadUserRef.current = now;

    try {
      const res = await API.get('/auth/profile');
      saveUserSession(res.data);
    } catch (err) {
      // ONLY wipe session if server explicitly returns 401 or 403
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        console.warn('Session expired or unauthorized');
        try {
          localStorage.removeItem('classic_cut_token');
          localStorage.removeItem('classic_cut_user');
          localStorage.removeItem('classic_cut_loyalty');
        } catch (e) {}
        setToken(null);
        setUser(null);
      } else {
        console.warn('Network issue or backend waking up; preserving authenticated session:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    const handleFocus = () => {
      if (localStorage.getItem('classic_cut_token')) {
        loadUser(false);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // 1. Request OTP
  const requestOtp = async (email) => {
    const res = await API.post('/auth/request-otp', { email });
    return res.data;
  };

  // 2. Register with OTP
  const registerWithOtp = async (userData) => {
    const res = await API.post('/auth/register', userData);
    const { token: newToken, user: newUser } = res.data;
    saveUserSession(newUser, newToken);
    return res.data;
  };

  // 3. Login
  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    saveUserSession(newUser, newToken);
    return res.data;
  };

  // 4. Google OAuth
  const googleLogin = async (credential) => {
    const res = await API.post('/auth/google', { credential });
    const { token: newToken, user: newUser } = res.data;
    saveUserSession(newUser, newToken);
    return res.data;
  };

  // 5. Update Profile
  const updateProfile = async (profileData) => {
    const res = await API.put('/auth/profile', profileData);
    if (res.data.user) {
      saveUserSession(res.data.user);
    }
    return res.data;
  };

  // 6. Set User/Admin Password (for Google users)
  const setPassword = async (newPassword) => {
    const res = await API.post('/auth/set-password', { password: newPassword });
    if (res.data.user) {
      saveUserSession(res.data.user);
    }
    return res.data;
  };
  const setAdminPassword = setPassword;

  // 7. Request Forgot Password OTP
  const requestForgotPasswordOtp = async (email) => {
    const res = await API.post('/auth/forgot-password-otp', { email });
    return res.data;
  };

  // 8. Reset Password with OTP
  const resetPasswordWithOtp = async ({ email, otp, newPassword }) => {
    const res = await API.post('/auth/reset-password', { email, otp, newPassword });
    const { token: newToken, user: newUser } = res.data;
    if (newToken) {
      saveUserSession(newUser, newToken);
    }
    return res.data;
  };

  // 9. Logout
  const logout = () => {
    try {
      localStorage.removeItem('classic_cut_token');
      localStorage.removeItem('classic_cut_user');
      localStorage.removeItem('classic_cut_loyalty');
      sessionStorage.removeItem('classic_cut_token');
    } catch (e) {}
    setToken(null);
    setUser(null);
  };

  // Connect to Live Real-Time Event Stream (SSE) for instant, zero-reload updates
  useEffect(() => {
    if (!token) return;

    const streamUrl = `${API.defaults.baseURL}/loyalty/live-stream?token=${encodeURIComponent(token)}`;
    let eventSource = null;

    try {
      eventSource = new EventSource(streamUrl);

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'STAMP_AWARDED') {
            if (user && data.userId === user._id) {
              setUser((prev) => {
                if (!prev) return prev;
                const updated = {
                  ...prev,
                  currentStamps: data.currentStamps,
                  lifetimeVisits: data.lifetimeVisits,
                  lastStampDate: data.lastStampDate,
                };
                try {
                  localStorage.setItem('classic_cut_user', JSON.stringify(updated));
                } catch (e) {}
                return updated;
              });
            }
          } else if (data.type === 'CUSTOMER_UPDATED') {
            if (user && data.userId === user._id) {
              setUser((prev) => {
                if (!prev) return prev;
                const updated = {
                  ...prev,
                  name: data.name || prev.name,
                  phone: data.phone || prev.phone,
                };
                try {
                  localStorage.setItem('classic_cut_user', JSON.stringify(updated));
                } catch (e) {}
                return updated;
              });
            }
          }
          // Dispatch global window event for components (StampCard, AdminDashboard)
          window.dispatchEvent(new CustomEvent('classic_cut_realtime', { detail: data }));
        } catch (err) {
          // heartbeat or non-json message
        }
      };

      eventSource.onerror = () => {
        // SSE auto-reconnects automatically
      };
    } catch (err) {
      console.warn('Realtime SSE init failed:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [token, user?._id]);

  // Non-blocking prefetch of loyalty profile into localStorage so 5-Coupon card renders instantly
  useEffect(() => {
    if (!token || !user) return;
    const prefetchLoyalty = async () => {
      try {
        const res = await API.get('/loyalty/my-stamps');
        try {
          localStorage.setItem('classic_cut_loyalty', JSON.stringify(res.data));
        } catch (e) {}
      } catch (err) {
        // Non-blocking background prefetch
      }
    };
    const timer = setTimeout(prefetchLoyalty, 1000);
    return () => clearTimeout(timer);
  }, [token, user?._id]);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin,
        requestOtp,
        registerWithOtp,
        login,
        googleLogin,
        updateProfile,
        setPassword,
        setAdminPassword,
        requestForgotPasswordOtp,
        resetPasswordWithOtp,
        logout,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
