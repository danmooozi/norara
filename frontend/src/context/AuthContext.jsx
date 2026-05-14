import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  const logoutClean = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  // 토큰으로 유저 정보 불러오기
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        logoutClean();
      }
    }).catch(() => {
      logoutClean();
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '로그인에 실패했습니다.');
    localStorage.setItem('auth_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    logoutClean();
  };

  const isAdmin = user?.role === 'admin';
  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, isLoggedIn, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
