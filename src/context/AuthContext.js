// src/context/AuthContext.js
import React, {
  createContext,
  useState,
  useEffect,
  useCallback
} from 'react';
import axiosInstance from '../api/axiosConfig';
import isUUID from 'validator/lib/isUUID';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('voltaLogApp_token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading]   = useState(true);
  const [authError, setAuthError]           = useState('');

  // ----- 1) On mount, verify any existing token -----
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('voltaLogApp_token');
      if (storedToken) {
        try {
          // GET /api/profile/me with interceptor-attached token
          const { data: user } = await axiosInstance.get('/api/profile/me');

          // sanity check
          if (!isUUID(user.userId)) {
            throw new Error('Invalid User ID in token');
          }

          // alias userId → id for backwards compatibility
          setCurrentUser({ ...user, id: user.userId });
          setIsAuthenticated(true);
        } catch (err) {
          console.error('AuthContext initAuth failed:', err.response?.data || err.message);

          // only logout on 401 (invalid/expired token)
          if (err.response?.status === 401) {
            localStorage.removeItem('voltaLogApp_token');
            localStorage.removeItem('voltaLogApp_currentUser');
          }
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      }
      setIsAuthLoading(false);
    };
    initAuth();
  }, []);

  // ----- 2) Login handler -----
  const login = useCallback(async (username, password) => {
    setAuthError('');
    setIsAuthLoading(true);
    try {
      const { data } = await axiosInstance.post('/api/auth/login', { username, password });
      const { token: newToken, user } = data;

      // persist
      localStorage.setItem('voltaLogApp_token', newToken);
      setToken(newToken);
      localStorage.setItem('voltaLogApp_currentUser', JSON.stringify(user));

      // prime axios & state
      setCurrentUser({ ...user, id: user.userId });
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.msg || 'Login failed.';
      setAuthError(msg);
      setIsAuthenticated(false);
      return { success: false, error: msg };
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // ----- 3) Register handler -----
  const register = useCallback(async (userData) => {
    setAuthError('');
    setIsAuthLoading(true);
    try {
      const { data } = await axiosInstance.post('/api/auth/register', userData);
      const { token: newToken, user } = data;

      localStorage.setItem('voltaLogApp_token', newToken);
      localStorage.setItem('voltaLogApp_currentUser', JSON.stringify(user));

      setCurrentUser({ ...user, id: user.userId });
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.msg || 'Registration failed.';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // ----- 4) Logout handler -----
  const logout = useCallback(() => {
    localStorage.removeItem('voltaLogApp_token');
    setToken(null);
    localStorage.removeItem('voltaLogApp_currentUser');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthError('');
  }, []);

  return (
    <AuthContext.Provider value={{
      token,
      isAuthenticated,
      currentUser,
      isAuthLoading,
      authError,
      login,
      logout,
      register,
      setAuthError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
