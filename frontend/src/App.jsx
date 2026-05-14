import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Header from './components/Header.jsx';
import GameGallery from './components/GameGallery.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import AdminLoginPage from './components/AdminLoginPage.jsx';

const SECRET_PATH = 'secret-admin';

function AppInner() {
  const [currentView, setCurrentView] = useState('gallery');
  const { isAdmin, loading, logout } = useAuth();

  // URL 해시 기반 라우팅 처리
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '');
      if (hash === SECRET_PATH) {
        setCurrentView(isAdmin ? 'admin' : 'admin-login');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="app-loading">
        <span className="app-loading-dot">●</span>
        <span className="app-loading-dot">●</span>
        <span className="app-loading-dot">●</span>
      </div>
    );
  }

  const handleNavigate = (view) => {
    setCurrentView(view);
    // 갤러리로 돌아갈 때 hash 제거
    if (view === 'gallery') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const handleAdminLoginSuccess = () => {
    setCurrentView('admin');
  };

  const handleAdminLogout = () => {
    logout();
    setCurrentView('gallery');
    window.history.replaceState(null, '', window.location.pathname);
  };

  return (
    <div className="app">
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onAdminLogout={handleAdminLogout}
      />
      <main className="main-content">
        {currentView === 'gallery' && <GameGallery />}
        {currentView === 'admin-login' && (
          <AdminLoginPage onLoginSuccess={handleAdminLoginSuccess} />
        )}
        {currentView === 'admin' && isAdmin && <AdminPanel />}
        {currentView === 'admin' && !isAdmin && <GameGallery />}
      </main>
      <footer className="nora-footer">
        norara &copy; 2025 &nbsp;|&nbsp; 점심 먹고 노라라~
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
