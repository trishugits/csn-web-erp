/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';

interface User {
  id: string;
  email?: string;
  name?: string;
  role: 'admin' | 'teacher' | 'student';
  displayId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string, role: 'admin' | 'teacher' | 'student') => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, password: string, role: 'admin' | 'teacher' | 'student') => {
    const response = await authApi.login(identifier, password, role);
    const { token: newToken } = response.data;

    setToken(newToken);
    localStorage.setItem('token', newToken);

    // Fetch profile to build user object
    const profileRes = await authApi.getProfile(role);
    const profile = profileRes.data;

    const displayId = profile?.studentId || profile?.teacherId || profile?.adminId || profile?.id || profile?._id;

    const derivedUser: User = {
      id: profile?._id || profile?.id || 'self',
      email: profile?.email,
      name: profile?.name || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim(),
      role,
      displayId
    };

    setUser(derivedUser);
    localStorage.setItem('user', JSON.stringify(derivedUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
