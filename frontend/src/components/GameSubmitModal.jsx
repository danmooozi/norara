import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['액션', '퍼즐', 'RPG', '스포츠', '파티', '기타'];

const EMPTY_FORM = {
  title: '',
  description: '',
  category: '액션',
  thumbnail: '',
  preview_url: '',
  external_url: ''
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

function GameSubmitModal({ onClose, onSuccess }) {
  const { token } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

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
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '등록에 실패했습니다.');
      }
      const newGame = await res.json();
      onSuccess(newGame);
      onClose();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="submit-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div className="submit-modal-header">
          <span className="submit-modal-icon">🕹️</span>
          <h2 className="submit-modal-title">GAME 등록</h2>
          <p className="submit-modal-sub">새로운 게임을 갤러리에 추가해요</p>
        </div>

        <form className="submit-form" onSubmit={handleSubmit} noValidate>
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
              placeholder="게임 제목을 입력하세요"
              maxLength={80}
            />
            {errors.title && <span className="submit-field-error">{errors.title}</span>}
          </div>

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

          <div className="submit-form-group">
            <label className="submit-label">게임 설명</label>
            <textarea
              className="submit-textarea"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="게임에 대한 간단한 설명을 입력하세요"
              rows={3}
              maxLength={500}
            />
          </div>

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

          <div className="submit-form-row">
            <div className="submit-form-group">
              <label className="submit-label">미리보기 URL</label>
              <input
                className={`submit-input${errors.preview_url ? ' input-error' : ''}`}
                type="url"
                name="preview_url"
                value={form.preview_url}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="https://game-site.com"
              />
              {errors.preview_url && <span className="submit-field-error">{errors.preview_url}</span>}
            </div>

            <div className="submit-form-group">
              <label className="submit-label">외부 링크 URL</label>
              <input
                className={`submit-input${errors.external_url ? ' input-error' : ''}`}
                type="url"
                name="external_url"
                value={form.external_url}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="https://game-site.com"
              />
              {errors.external_url && <span className="submit-field-error">{errors.external_url}</span>}
            </div>
          </div>

          {submitError && <div className="login-error">{submitError}</div>}

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
              {submitting ? '등록 중...' : '🎮 등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GameSubmitModal;
