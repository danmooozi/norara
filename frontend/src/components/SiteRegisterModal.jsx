import { useState } from 'react';

const CATEGORIES = ['액션', '퍼즐', 'RPG', '스포츠', '파티', '기타'];

function validate(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = '게임 제목은 필수 항목입니다.';
  if (form.thumbnail && !/^https?:\/\/.+/.test(form.thumbnail))
    errors.thumbnail = '올바른 URL을 입력해주세요.';
  if (form.preview_url && !/^https?:\/\/.+/.test(form.preview_url))
    errors.preview_url = '올바른 URL을 입력해주세요.';
  if (form.external_url && !/^https?:\/\/.+/.test(form.external_url))
    errors.external_url = '올바른 URL을 입력해주세요.';
  return errors;
}

function SiteRegisterModal({ request, token, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title:        request.site_name || '',
    description:  request.description || '',
    category:     request.category || '기타',
    thumbnail:    '',
    preview_url:  request.site_url || '',
    external_url: request.site_url || '',
  });
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [thumbErr, setThumbErr] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'thumbnail') setThumbErr(false);
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const errs = validate({ ...form, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: errs[name] }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errs = validate(form);
    setErrors((prev) => ({ ...prev, [name]: errs[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const allTouched = Object.fromEntries(Object.keys(form).map((k) => [k, true]));
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/site-requests/${request.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '등록에 실패했습니다.');
      }
      const data = await res.json();
      onSuccess(data.game);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="submit-modal site-register-modal">
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div className="submit-modal-header">
          <span className="submit-modal-icon">🚀</span>
          <h2 className="submit-modal-title" style={{ color: 'var(--nora-green)' }}>
            갤러리 바로 등록
          </h2>
          <p className="submit-modal-sub">
            신청 정보를 확인하고 수정한 뒤 등록하세요
          </p>
        </div>

        {/* 신청 원본 정보 요약 */}
        <div className="sr-reg-origin">
          <span className="sr-reg-origin-label">신청 원본</span>
          <span className="sr-reg-origin-name">{request.site_name}</span>
          <a
            className="sr-reg-origin-url"
            href={request.site_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {request.site_url}
          </a>
          {request.requester && (
            <span className="sr-reg-origin-requester">👤 {request.requester}</span>
          )}
        </div>

        <form className="submit-form" onSubmit={handleSubmit} noValidate>
          {/* 썸네일 미리보기 */}
          <div className="form-thumb-preview">
            {form.thumbnail && !thumbErr ? (
              <img
                src={form.thumbnail}
                alt="썸네일 미리보기"
                onError={() => setThumbErr(true)}
              />
            ) : (
              <div className="form-thumb-placeholder">
                <span>🖼️</span>
                <p>썸네일 URL을 입력하면<br />미리보기가 표시됩니다</p>
              </div>
            )}
          </div>

          {/* 제목 */}
          <div className="submit-form-group">
            <label className="submit-label">
              게임 제목 <span className="submit-required">*</span>
            </label>
            <input
              className={`submit-input${errors.title ? ' input-error' : ''}`}
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={200}
            />
            {errors.title && <span className="submit-field-error">{errors.title}</span>}
          </div>

          {/* 설명 */}
          <div className="submit-form-group">
            <label className="submit-label">설명</label>
            <textarea
              className="submit-textarea"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="게임에 대한 간단한 설명을 입력하세요."
              maxLength={500}
            />
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

          {/* 썸네일 */}
          <div className="submit-form-group">
            <label className="submit-label">썸네일 URL</label>
            <input
              className={`submit-input${errors.thumbnail ? ' input-error' : ''}`}
              type="url"
              name="thumbnail"
              value={form.thumbnail}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://example.com/image.png"
            />
            {errors.thumbnail && <span className="submit-field-error">{errors.thumbnail}</span>}
          </div>

          {/* 미리보기 URL */}
          <div className="submit-form-group">
            <label className="submit-label">
              미리보기 URL
              <span style={{ fontSize: '.6rem', color: 'var(--nora-muted)', marginLeft: 6, fontFamily: 'inherit' }}>
                iframe 인게임 미리보기
              </span>
            </label>
            <input
              className={`submit-input${errors.preview_url ? ' input-error' : ''}`}
              type="url"
              name="preview_url"
              value={form.preview_url}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://example.com/play"
            />
            {errors.preview_url && <span className="submit-field-error">{errors.preview_url}</span>}
          </div>

          {/* 외부 URL */}
          <div className="submit-form-group">
            <label className="submit-label">외부 게임 URL</label>
            <input
              className={`submit-input${errors.external_url ? ' input-error' : ''}`}
              type="url"
              name="external_url"
              value={form.external_url}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://example.com"
            />
            {errors.external_url && <span className="submit-field-error">{errors.external_url}</span>}
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
              style={{ background: 'var(--nora-green)', borderColor: '#22cc66', color: '#0e1a12' }}
              disabled={submitting}
            >
              {submitting ? '⏳ 등록 중...' : '🚀 갤러리에 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SiteRegisterModal;
