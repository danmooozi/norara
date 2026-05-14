import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function AdminLoginPage({ onLoginSuccess }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      if (user.role !== 'admin') {
        setError('어드민 계정만 접근할 수 있습니다.');
        // 일반 유저로 로그인됐다면 즉시 로그아웃
        localStorage.removeItem('auth_token');
        return;
      }
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <div className="admin-login-logo">
          <span className="header-logo-pixel">norara</span>
          <span className="admin-login-subtitle">관리자 전용 페이지</span>
        </div>

        <div className="admin-login-icon">👑</div>

        <form className="admin-login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="관리자 아이디"
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="admin-login-error">⚠ {error}</div>}

          <button
            className="admin-login-submit-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? '⏳ 확인 중...' : '🔐 로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLoginPage;
