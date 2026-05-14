import { useAuth } from '../context/AuthContext';

function Header({ currentView, onNavigate, onAdminLogout }) {
  const { isAdmin } = useAuth();

  return (
    <header className="header">
      <div className="header-logo">
        <span className="header-logo-pixel">norara</span>
        <span className="header-logo-sub">퇴근 하고 노라라~</span>
      </div>
      <nav className="header-nav">
        <button
          className={`nav-btn${currentView === 'gallery' ? ' active' : ''}`}
          onClick={() => onNavigate('gallery')}
        >
          PLAY
        </button>
        {isAdmin && (
          <>
            <button
              className={`nav-btn nav-btn--admin${currentView === 'admin' ? ' active' : ''}`}
              onClick={() => onNavigate('admin')}
            >
              ADMIN
            </button>
            <button
              className="nav-btn nav-btn--logout"
              onClick={onAdminLogout}
            >
              로그아웃
            </button>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
