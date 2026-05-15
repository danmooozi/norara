import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Header from './components/Header.jsx';
import GameGallery from './components/GameGallery.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import AdminLoginPage from './components/AdminLoginPage.jsx';
import CursorPet from './components/CursorPet.jsx';
import SiteRequestModal from './components/SiteRequestModal.jsx';

const SECRET_PATH = 'secret-admin';

function AppInner() {
  const [currentView, setCurrentView] = useState('gallery');
  const [showSiteRequest, setShowSiteRequest] = useState(false);
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
      {showSiteRequest && (
        <SiteRequestModal onClose={() => setShowSiteRequest(false)} />
      )}
      <CursorPet />
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
        norara &copy; 2026 &nbsp;|&nbsp; 퇴근하고 노라라~
        <div className="nora-footer-actions">
          <a
            className="nora-footer-btn"
            href="mailto:dev@norara.kr"
            title="개발자에게 문의하기"
          >
            📨 개발자에게 문의
          </a>
          <span className="nora-footer-divider">·</span>
          <button
            className="nora-footer-btn"
            onClick={() => setShowSiteRequest(true)}
            title="내 사이트 추가 요청하기"
          >
            ➕ 사이트 추가 요청
          </button>
        </div>
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
