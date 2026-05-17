import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import UserManager from './UserManager';
import SiteRegisterModal from './SiteRegisterModal';

const CATEGORIES = ['게임', '도구', '실험'];
const FLAGS = ['', 'NEW', 'PICK'];

const EMPTY_FORM = {
  title: '',
  description: '',
  category: '게임',
  thumbnail: '',
  preview_url: '',
  external_url: '',
  featured: false,
  flag: '',
  is_mine: false,
  play_count: 0,
};

function validate(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = '제목은 필수 입력 항목입니다.';
  if (form.thumbnail && !/^https?:\/\/.+/.test(form.thumbnail))
    errors.thumbnail = '올바른 URL을 입력해주세요. (http:// 또는 https://)';
  if (form.preview_url && !/^https?:\/\/.+/.test(form.preview_url))
    errors.preview_url = '올바른 URL을 입력해주세요.';
  if (form.external_url && !/^https?:\/\/.+/.test(form.external_url))
    errors.external_url = '올바른 URL을 입력해주세요.';
  return errors;
}

const STATUS_LABEL = { pending: '대기중', approved: '승인', rejected: '거절' };
const STATUS_COLOR = { pending: 'var(--nora-yellow)', approved: 'var(--nora-green)', rejected: 'var(--nora-red)' };

function AdminPanel() {
  const { token, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('games');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [thumbPreviewError, setThumbPreviewError] = useState(false);
  const [fetchingThumbId, setFetchingThumbId] = useState(null);
  const [checkingIframeId, setCheckingIframeId] = useState(null);
  const formRef = useRef(null);

  // 사이트 신청 관련 상태
  const [siteRequests, setSiteRequests] = useState([]);
  const [srLoading, setSrLoading] = useState(false);
  const [srFilter, setSrFilter] = useState('all');
  const [registerTarget, setRegisterTarget] = useState(null); // 바로 등록 모달 대상

  const fetchGames = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/games');
      if (!res.ok) throw new Error('게임 목록을 불러오지 못했습니다.');
      const data = await res.json();
      setGames(data);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGames(); }, []);

  const fetchSiteRequests = async () => {
    setSrLoading(true);
    try {
      const res = await fetch(`/api/site-requests?status=${srFilter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('신청 목록을 불러오지 못했습니다.');
      setSiteRequests(await res.json());
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setSrLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'requests') fetchSiteRequests();
  }, [activeTab, srFilter]);

  const handleSrStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/site-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('상태 변경에 실패했습니다.');
      showToast(status === 'approved' ? '✅ 승인되었습니다.' : '🚫 거절되었습니다.');
      fetchSiteRequests();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  const handleRegisterSuccess = (newGame) => {
    setRegisterTarget(null);
    showToast(`🚀 "${newGame.title}" 이(가) 갤러리에 등록되었습니다!`);
    fetchSiteRequests();
    fetchGames();
  };

  const handleSrDelete = async (id) => {
    try {
      const res = await fetch(`/api/site-requests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('삭제에 실패했습니다.');
      showToast('🗑️ 신청이 삭제되었습니다.');
      fetchSiteRequests();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const coerced = name === 'play_count' ? (parseInt(value, 10) || 0) : value;
    setForm((prev) => ({ ...prev, [name]: coerced }));
    if (name === 'thumbnail') setThumbPreviewError(false);
    if (touched[name]) {
      const newErrors = validate({ ...form, [name]: coerced });
      setErrors((prev) => ({ ...prev, [name]: newErrors[name] }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const newErrors = validate(form);
    setErrors((prev) => ({ ...prev, [name]: newErrors[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(form).map((k) => [k, true]));
    setTouched(allTouched);
    const newErrors = validate(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setSubmitting(true);
    try {
      const url = editingId ? `/api/games/${editingId}` : '/api/games';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '요청에 실패했습니다.');
      }
      showToast(editingId ? '✅ 게임이 성공적으로 수정되었습니다!' : '✅ 새 게임이 추가되었습니다!');
      setForm(EMPTY_FORM);
      setEditingId(null);
      setTouched({});
      setErrors({});
      setThumbPreviewError(false);
      fetchGames();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (game) => {
    setEditingId(game.id);
    setForm({
      title: game.title || '',
      description: game.description || '',
      category: game.category || '게임',
      thumbnail: game.thumbnail || '',
      preview_url: game.preview_url || '',
      external_url: game.external_url || '',
      featured: game.featured || false,
      flag: game.flag || '',
      is_mine: game.is_mine || false,
      play_count: game.play_count || 0,
    });
    setTouched({});
    setErrors({});
    setThumbPreviewError(false);
    if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/games/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('삭제에 실패했습니다.');
      showToast('🗑️ 게임이 삭제되었습니다.');
      setDeleteConfirmId(null);
      fetchGames();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  const handleFetchThumbnail = async (game) => {
    setFetchingThumbId(game.id);
    try {
      const res = await fetch(`/api/games/${game.id}/fetch-thumbnail`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '썸네일 수집 실패');
      showToast('🖼️ 썸네일이 업데이트되었습니다!');
      fetchGames();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setFetchingThumbId(null);
    }
  };

  const handleCheckIframe = async (game) => {
    setCheckingIframeId(game.id);
    try {
      const res = await fetch(`/api/games/${game.id}/check-iframe`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'iframe 체크 실패');
      showToast(data.iframe_blocked ? '🔒 iframe 차단됨' : '✅ iframe 허용됨');
      fetchGames();
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setCheckingIframeId(null);
    }
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setTouched({});
    setErrors({});
    setThumbPreviewError(false);
  };

  const isFormDirty = Object.values(form).some((v) => v !== '');

  return (
    <div className="admin-wrapper">
      {registerTarget && (
        <SiteRegisterModal
          request={registerTarget}
          token={token}
          onClose={() => setRegisterTarget(null)}
          onSuccess={handleRegisterSuccess}
        />
      )}
      {toast && (
        <div className={`admin-toast admin-toast--${toast.type}`}>{toast.text}</div>
      )}

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            {activeTab === 'games' ? '🎮 게임 관리'
              : activeTab === 'requests' ? '📬 사이트 추가 신청'
              : '👥 유저 관리'}
          </h1>
          <p className="admin-page-sub">
            {activeTab === 'games'
              ? '새 게임을 추가하거나 기존 게임 정보를 수정·삭제할 수 있습니다.'
              : activeTab === 'requests'
              ? '유저들이 신청한 사이트 추가 요청을 검토하고 승인·거절할 수 있습니다.'
              : '가입된 유저 목록을 확인하고 권한을 관리할 수 있습니다.'}
          </p>
        </div>
        <div className="admin-stats">
          {activeTab === 'games' && (
            <span className="admin-stat-badge">총 {games.length}개 게임</span>
          )}
          {activeTab === 'requests' && (
            <span className="admin-stat-badge">
              대기 {siteRequests.filter(r => r.status === 'pending').length}건
            </span>
          )}
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab-btn${activeTab === 'games' ? ' active' : ''}`}
          onClick={() => setActiveTab('games')}
        >
          🎮 게임 관리
        </button>
        {isAdmin && (
          <button
            className={`admin-tab-btn${activeTab === 'requests' ? ' active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            📬 사이트 신청
          </button>
        )}
        {isAdmin && (
          <button
            className={`admin-tab-btn${activeTab === 'users' ? ' active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 유저 관리
          </button>
        )}
      </div>

      {activeTab === 'users' && isAdmin ? (
        <div className="admin-panel admin-panel--full">
          <UserManager showToast={showToast} />
        </div>
      ) : activeTab === 'requests' && isAdmin ? (
        <div className="admin-panel admin-panel--full">
          {/* 필터 */}
          <div className="sr-filter-bar">
            {['all', 'pending', 'approved', 'rejected'].map((f) => (
              <button
                key={f}
                className={`sr-filter-btn${srFilter === f ? ' active' : ''}`}
                onClick={() => setSrFilter(f)}
              >
                {f === 'all' ? '전체' : STATUS_LABEL[f]}
              </button>
            ))}
          </div>

          {srLoading ? (
            <div className="loading-state">⏳ 불러오는 중...</div>
          ) : siteRequests.length === 0 ? (
            <div className="empty-state">
              <span>📭</span>
              <p>신청 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="sr-list">
              {siteRequests.map((req) => (
                <div key={req.id} className="sr-item">
                  <div className="sr-item-main">
                    <div className="sr-item-header">
                      <span className="sr-site-name">{req.site_name}</span>
                      <span
                        className="sr-status-badge"
                        style={{ color: STATUS_COLOR[req.status], borderColor: STATUS_COLOR[req.status] }}
                      >
                        {STATUS_LABEL[req.status]}
                      </span>
                    </div>
                    <a
                      className="sr-site-url"
                      href={req.site_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      🔗 {req.site_url}
                    </a>
                    <div className="sr-item-meta">
                      <span className="admin-category-badge">{req.category}</span>
                      {req.requester && <span className="sr-requester">👤 {req.requester}</span>}
                      <span className="sr-date">
                        {new Date(req.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    {req.description && (
                      <p className="sr-description">{req.description}</p>
                    )}
                  </div>
                  <div className="sr-item-actions">
                    <button
                      className="btn btn-sm sr-btn-register"
                      onClick={() => setRegisterTarget(req)}
                      title="게임 갤러리에 바로 등록"
                    >
                      🚀 바로 등록
                    </button>
                    {req.status !== 'approved' && (
                      <button
                        className="btn btn-sm sr-btn-approve"
                        onClick={() => handleSrStatus(req.id, 'approved')}
                      >
                        ✅ 승인
                      </button>
                    )}
                    {req.status !== 'rejected' && (
                      <button
                        className="btn btn-sm sr-btn-reject"
                        onClick={() => handleSrStatus(req.id, 'rejected')}
                      >
                        🚫 거절
                      </button>
                    )}
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleSrDelete(req.id)}
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
          <div className="admin-panel">
            <div ref={formRef}>
              <div className="admin-section-title">
                {editingId ? '✏️ 게임 수정' : '➕ 새 게임 추가'}
              </div>
              <form className="game-form" onSubmit={handleSubmit} noValidate>
                <div className="form-thumb-preview">
                  {form.thumbnail && !thumbPreviewError ? (
                    <img
                      src={form.thumbnail}
                      alt="썸네일 미리보기"
                      onError={() => setThumbPreviewError(true)}
                    />
                  ) : (
                    <div className="form-thumb-placeholder">
                      <span>🖼️</span>
                      <p>썸네일 URL을 입력하면<br />미리보기가 표시됩니다</p>
                    </div>
                  )}
                </div>

                <div className={`form-group ${errors.title && touched.title ? 'form-group--error' : ''}`}>
                  <label htmlFor="f-title">
                    제목 <span className="form-required">*</span>
                  </label>
                  <input
                    id="f-title"
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="예) Flappy Bird"
                    autoComplete="off"
                  />
                  {errors.title && touched.title && (
                    <span className="form-error-msg">{errors.title}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="f-desc">설명</label>
                  <textarea
                    id="f-desc"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="게임에 대한 간단한 설명을 입력하세요."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="f-category">카테고리</label>
                  <select
                    id="f-category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className={`form-group ${errors.thumbnail && touched.thumbnail ? 'form-group--error' : ''}`}>
                  <label htmlFor="f-thumbnail">썸네일 URL</label>
                  <div className="form-input-icon-wrap">
                    <span className="form-input-icon">🖼️</span>
                    <input
                      id="f-thumbnail"
                      type="url"
                      name="thumbnail"
                      value={form.thumbnail}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="https://example.com/image.png"
                    />
                  </div>
                  {errors.thumbnail && touched.thumbnail && (
                    <span className="form-error-msg">{errors.thumbnail}</span>
                  )}
                </div>

                <div className={`form-group ${errors.preview_url && touched.preview_url ? 'form-group--error' : ''}`}>
                  <label htmlFor="f-preview">
                    미리보기 URL
                    <span className="form-hint">iframe으로 인게임 미리보기에 사용됩니다</span>
                  </label>
                  <div className="form-input-icon-wrap">
                    <span className="form-input-icon">👁️</span>
                    <input
                      id="f-preview"
                      type="url"
                      name="preview_url"
                      value={form.preview_url}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="https://example.com/play"
                    />
                  </div>
                  {errors.preview_url && touched.preview_url && (
                    <span className="form-error-msg">{errors.preview_url}</span>
                  )}
                </div>

                <div className={`form-group ${errors.external_url && touched.external_url ? 'form-group--error' : ''}`}>
                  <label htmlFor="f-external">
                    외부 게임 URL
                    <span className="form-hint">게임 사이트로 이동하는 링크입니다</span>
                  </label>
                  <div className="form-input-icon-wrap">
                    <span className="form-input-icon">🔗</span>
                    <input
                      id="f-external"
                      type="url"
                      name="external_url"
                      value={form.external_url}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="https://example.com"
                    />
                  </div>
                  {errors.external_url && touched.external_url && (
                    <span className="form-error-msg">{errors.external_url}</span>
                  )}
                </div>

                {/* Bento 메타 필드 */}
                <div className="submit-form-row">
                  <div className="form-group">
                    <label htmlFor="f-flag">FLAG 스티커</label>
                    <select
                      id="f-flag"
                      name="flag"
                      value={form.flag}
                      onChange={handleChange}
                    >
                      {FLAGS.map((f) => (
                        <option key={f} value={f}>{f || '없음'}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="f-play_count">플레이 수</label>
                    <input
                      id="f-play_count"
                      type="number"
                      name="play_count"
                      min="0"
                      value={form.play_count}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="submit-form-row">
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8 }}>
                    <input
                      id="f-featured"
                      type="checkbox"
                      name="featured"
                      checked={!!form.featured}
                      onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <label htmlFor="f-featured" style={{ marginBottom: 0, cursor: 'pointer' }}>
                      ⭐ FEATURED (2×2 대형 카드)
                    </label>
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8 }}>
                    <input
                      id="f-is_mine"
                      type="checkbox"
                      name="is_mine"
                      checked={!!form.is_mine}
                      onChange={(e) => setForm((p) => ({ ...p, is_mine: e.target.checked }))}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <label htmlFor="f-is_mine" style={{ marginBottom: 0, cursor: 'pointer' }}>
                      🏠 MINE (내 앱 배지)
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary form-submit-btn"
                    disabled={submitting}
                  >
                    {submitting
                      ? '⏳ 처리 중...'
                      : editingId
                        ? '💾 수정 완료'
                        : '➕ 게임 추가'}
                  </button>
                  {(editingId || isFormDirty) && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancel}
                      disabled={submitting}
                    >
                      취소
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div>
              <div className="admin-section-title">
                🗂️ 등록된 게임 목록
                <span className="admin-count-badge">{games.length}</span>
              </div>

              {loading && (
                <div className="loading-state">⏳ 불러오는 중...</div>
              )}
              {fetchError && (
                <div className="error-state">⚠️ {fetchError}</div>
              )}

              {!loading && !fetchError && (
                <div className="admin-game-list">
                  {games.length === 0 ? (
                    <div className="empty-state">
                      <span>🕹️</span>
                      <p>등록된 게임이 없습니다.<br />왼쪽 폼에서 추가해보세요!</p>
                    </div>
                  ) : (
                    games.map((game) => (
                      <div
                        key={game.id}
                        className={`admin-game-item ${editingId === game.id ? 'admin-game-item--editing' : ''}`}
                      >
                        <img
                          className="admin-game-thumb"
                          src={game.thumbnail || '/placeholder.svg'}
                          alt={game.title}
                          onError={(e) => { e.target.src = '/placeholder.svg'; }}
                        />
                        <div className="admin-game-info">
                          <strong>{game.title}</strong>
                          <div className="admin-game-meta">
                            <span className="admin-category-badge">{game.category}</span>
                            {game.external_url && (
                              <a
                                href={game.external_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-game-link"
                                title="게임 사이트 방문"
                              >
                                🔗
                              </a>
                            )}
                          </div>
                          {game.description && (
                            <p className="admin-game-desc">{game.description}</p>
                          )}
                        </div>
                        <div className="admin-game-actions">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleFetchThumbnail(game)}
                            disabled={fetchingThumbId === game.id}
                            title="OG 이미지 자동 수집"
                          >
                            {fetchingThumbId === game.id ? '⏳' : '🖼️'}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleCheckIframe(game)}
                            disabled={checkingIframeId === game.id}
                            title={`iframe 차단 체크 (현재: ${game.iframe_blocked === true ? '차단' : game.iframe_blocked === false ? '허용' : '미확인'})`}
                          >
                            {checkingIframeId === game.id ? '⏳' : game.iframe_blocked === true ? '🔒' : game.iframe_blocked === false ? '✅' : '🔍'}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleEdit(game)}
                            title="수정"
                          >
                            ✏️
                          </button>
                          {deleteConfirmId === game.id ? (
                            <div className="delete-confirm">
                              <span>삭제?</span>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(game.id)}
                              >
                                확인
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeleteConfirmId(game.id)}
                              title="삭제"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )
      }
    </div>
  );
}

export default AdminPanel;
