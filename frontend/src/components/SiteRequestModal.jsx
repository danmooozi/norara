import { useState } from 'react';

const CATEGORIES = ['액션', '퍼즐', 'RPG', '스포츠', '파티', '기타'];

const EMPTY_FORM = {
  site_name: '',
  site_url: '',
  category: '기타',
  description: '',
  requester: ''
};

function validate(form) {
  const errors = {};
  if (!form.site_name.trim())
    errors.site_name = '사이트 이름은 필수 항목입니다.';
  if (!form.site_url.trim())
    errors.site_url = 'URL은 필수 항목입니다.';
  else if (!/^https?:\/\/.+/.test(form.site_url.trim()))
    errors.site_url = '올바른 URL을 입력해주세요. (http:// 또는 https://)';
  return errors;
}

function SiteRequestModal({ onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const newErrors = validate({ ...form, [name]: value });
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
    setSubmitError('');
    const allTouched = Object.fromEntries(Object.keys(form).map((k) => [k, true]));
    setTouched(allTouched);
    const newErrors = validate(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/site-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '신청 중 오류가 발생했습니다.');
      }
      setDone(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="submit-modal site-req-modal">
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        {done ? (
          <div className="site-req-done">
            <span className="site-req-done-icon">🎉</span>
            <h2 className="site-req-done-title">신청 완료!</h2>
            <p className="site-req-done-msg">
              소중한 신청 감사해요.<br />
              검토 후 갤러리에 추가할게요 🐥
            </p>
            <button className="submit-confirm-btn" style={{ marginTop: '24px' }} onClick={onClose}>
              닫기
            </button>
          </div>
        ) : (
          <>
            <div className="submit-modal-header">
              <span className="submit-modal-icon">➕</span>
              <h2 className="submit-modal-title">사이트 추가 요청</h2>
              <p className="submit-modal-sub">갤러리에 추가하고 싶은 사이트를 알려주세요</p>
            </div>

            <form className="submit-form" onSubmit={handleSubmit} noValidate>
              {/* 사이트 이름 */}
              <div className="submit-form-group">
                <label className="submit-label">
                  사이트 이름 <span className="submit-required">*</span>
                </label>
                <input
                  className={`submit-input${errors.site_name ? ' input-error' : ''}`}
                  type="text"
                  name="site_name"
                  placeholder="예) 구글 공룡 게임"
                  value={form.site_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={100}
                />
                {errors.site_name && (
                  <span className="submit-field-error">{errors.site_name}</span>
                )}
              </div>

              {/* URL */}
              <div className="submit-form-group">
                <label className="submit-label">
                  사이트 URL <span className="submit-required">*</span>
                </label>
                <input
                  className={`submit-input${errors.site_url ? ' input-error' : ''}`}
                  type="url"
                  name="site_url"
                  placeholder="https://example.com"
                  value={form.site_url}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.site_url && (
                  <span className="submit-field-error">{errors.site_url}</span>
                )}
              </div>

              {/* 카테고리 */}
              <div className="submit-form-group">
                <label className="submit-label">카테고리</label>
                <select
                  className="submit-select"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* 설명 */}
              <div className="submit-form-group">
                <label className="submit-label">간단한 소개 (선택)</label>
                <textarea
                  className="submit-textarea"
                  name="description"
                  placeholder="어떤 사이트인지 간단히 설명해주세요"
                  value={form.description}
                  onChange={handleChange}
                  maxLength={300}
                />
              </div>

              {/* 신청자 */}
              <div className="submit-form-group">
                <label className="submit-label">신청자 닉네임 (선택)</label>
                <input
                  className="submit-input"
                  type="text"
                  name="requester"
                  placeholder="익명으로 남겨도 괜찮아요"
                  value={form.requester}
                  onChange={handleChange}
                  maxLength={50}
                />
              </div>

              {submitError && (
                <p className="submit-field-error" style={{ textAlign: 'center' }}>
                  ⚠️ {submitError}
                </p>
              )}

              <div className="submit-form-actions">
                <button
                  type="button"
                  className="submit-cancel-btn"
                  onClick={onClose}
                  disabled={submitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="submit-confirm-btn"
                  disabled={submitting}
                >
                  {submitting ? '신청 중...' : '신청하기 ✨'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default SiteRequestModal;
