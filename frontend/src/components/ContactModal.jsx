import { useState } from 'react';

const EMPTY_FORM = { name: '', email: '', message: '' };

function validate(form) {
  const errors = {};
  if (!form.message.trim()) errors.message = '내용은 필수 항목입니다.';
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = '올바른 이메일 형식이 아닙니다.';
  return errors;
}

function ContactModal({ onClose }) {
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
    setErrors((prev) => ({ ...prev, [name]: validate(form)[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setTouched(Object.fromEntries(Object.keys(form).map((k) => [k, true])));
    const newErrors = validate(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '전송 중 오류가 발생했습니다.');
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
            <span className="site-req-done-icon">📨</span>
            <h2 className="site-req-done-title">전송 완료!</h2>
            <p className="site-req-done-msg">
              문의해주셔서 감사해요.<br />
              빠르게 확인하고 답변드릴게요 🐥
            </p>
            <button className="submit-confirm-btn" style={{ marginTop: '24px' }} onClick={onClose}>
              닫기
            </button>
          </div>
        ) : (
          <>
            <div className="submit-modal-header">
              <span className="submit-modal-icon">📨</span>
              <h2 className="submit-modal-title">개발자에게 문의</h2>
              <p className="submit-modal-sub">버그 제보, 제안, 뭐든지 환영해요</p>
            </div>

            <form className="submit-form" onSubmit={handleSubmit} noValidate>
              <div className="submit-form-group">
                <label className="submit-label">이름 / 닉네임 (선택)</label>
                <input
                  className="submit-input"
                  type="text"
                  name="name"
                  placeholder="익명으로 남겨도 괜찮아요"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={50}
                />
              </div>

              <div className="submit-form-group">
                <label className="submit-label">이메일 (선택)</label>
                <input
                  className={`submit-input${errors.email ? ' input-error' : ''}`}
                  type="email"
                  name="email"
                  placeholder="답장 받을 이메일 (선택)"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={100}
                />
                {errors.email && <span className="submit-field-error">{errors.email}</span>}
              </div>

              <div className="submit-form-group">
                <label className="submit-label">내용 <span className="submit-required">*</span></label>
                <textarea
                  className={`submit-textarea${errors.message ? ' input-error' : ''}`}
                  name="message"
                  placeholder="문의 내용을 입력해주세요"
                  value={form.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={1000}
                  rows={5}
                />
                {errors.message && <span className="submit-field-error">{errors.message}</span>}
              </div>

              {submitError && (
                <p className="submit-field-error" style={{ textAlign: 'center' }}>
                  ⚠️ {submitError}
                </p>
              )}

              <div className="submit-form-actions">
                <button type="button" className="submit-cancel-btn" onClick={onClose} disabled={submitting}>
                  취소
                </button>
                <button type="submit" className="submit-confirm-btn" disabled={submitting}>
                  {submitting ? '전송 중...' : '보내기 📨'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ContactModal;
