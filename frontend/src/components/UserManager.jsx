import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function UserManager({ showToast }) {
  const { token, user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [roleLoadingId, setRoleLoadingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('유저 목록을 불러오지 못했습니다.');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    setRoleLoadingId(userId);
    try {
      const res = await fetch(`/api/auth/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '권한 변경에 실패했습니다.');
      }
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      showToast(`✅ ${updated.username}의 권한이 ${newRole === 'admin' ? '관리자' : '일반 유저'}로 변경되었습니다.`);
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setRoleLoadingId(null);
    }
  };

  const handleDelete = async (userId) => {
    try {
      const res = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '삭제에 실패했습니다.');
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setDeleteConfirmId(null);
      showToast('🗑️ 유저가 삭제되었습니다.');
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const userCount  = users.filter((u) => u.role === 'user').length;

  return (
    <div>
      {/* 통계 */}
      <div className="um-stats-row">
        <div className="um-stat-card">
          <span className="um-stat-icon">👥</span>
          <div>
            <div className="um-stat-value">{users.length}</div>
            <div className="um-stat-label">전체 유저</div>
          </div>
        </div>
        <div className="um-stat-card">
          <span className="um-stat-icon">👑</span>
          <div>
            <div className="um-stat-value">{adminCount}</div>
            <div className="um-stat-label">관리자</div>
          </div>
        </div>
        <div className="um-stat-card">
          <span className="um-stat-icon">🎮</span>
          <div>
            <div className="um-stat-value">{userCount}</div>
            <div className="um-stat-label">일반 유저</div>
          </div>
        </div>
      </div>

      {/* 목록 */}
      {loading && <div className="loading-state">⏳ 불러오는 중...</div>}
      {fetchError && <div className="error-state">⚠️ {fetchError}</div>}

      {!loading && !fetchError && (
        <div className="um-table-wrap">
          <table className="um-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>아이디</th>
                <th>권한</th>
                <th>가입일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="um-empty">등록된 유저가 없습니다.</td>
                </tr>
              ) : (
                users.map((u) => {
                  const isMe = u.id === me?.id;
                  const isRoleLoading = roleLoadingId === u.id;
                  return (
                    <tr key={u.id} className={isMe ? 'um-row--me' : ''}>
                      <td className="um-cell-id">#{u.id}</td>
                      <td className="um-cell-name">
                        <span className="um-username">
                          {u.role === 'admin' && <span className="um-crown">👑</span>}
                          {u.username}
                        </span>
                        {isMe && <span className="um-me-badge">나</span>}
                      </td>
                      <td className="um-cell-role">
                        <span className={`um-role-badge um-role-badge--${u.role}`}>
                          {u.role === 'admin' ? '관리자' : '일반 유저'}
                        </span>
                      </td>
                      <td className="um-cell-date">
                        {new Date(u.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric', month: '2-digit', day: '2-digit'
                        })}
                      </td>
                      <td className="um-cell-actions">
                        {isMe ? (
                          <span className="um-no-action">—</span>
                        ) : (
                          <div className="um-action-group">
                            {/* 권한 토글 */}
                            {u.role === 'user' ? (
                              <button
                                className="um-btn um-btn--promote"
                                onClick={() => handleRoleChange(u.id, 'admin')}
                                disabled={isRoleLoading}
                                title="관리자로 승격"
                              >
                                {isRoleLoading ? '⏳' : '👑 관리자 승격'}
                              </button>
                            ) : (
                              <button
                                className="um-btn um-btn--demote"
                                onClick={() => handleRoleChange(u.id, 'user')}
                                disabled={isRoleLoading}
                                title="일반 유저로 강등"
                              >
                                {isRoleLoading ? '⏳' : '🔽 권한 강등'}
                              </button>
                            )}

                            {/* 삭제 */}
                            {deleteConfirmId === u.id ? (
                              <div className="um-delete-confirm">
                                <span>삭제?</span>
                                <button
                                  className="um-btn um-btn--danger"
                                  onClick={() => handleDelete(u.id)}
                                >
                                  확인
                                </button>
                                <button
                                  className="um-btn um-btn--cancel"
                                  onClick={() => setDeleteConfirmId(null)}
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <button
                                className="um-btn um-btn--danger"
                                onClick={() => setDeleteConfirmId(u.id)}
                                title="유저 삭제"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UserManager;
