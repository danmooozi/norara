function PreviewModal({ game, onClose }) {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <h3>🎮 {game.title}</h3>
          <div className="modal-header-actions">
            <span className="game-card-category">{game.category}</span>
            <button className="modal-close" onClick={onClose} title="Close">✕</button>
          </div>
        </div>

        <div className="modal-iframe-container">
          {game.preview_url ? (
            <iframe
              className="modal-iframe"
              src={game.preview_url}
              title={`Preview: ${game.title}`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              allowFullScreen
            />
          ) : (
            <div className="modal-no-preview">
              <span>🚫</span>
              <p>미리보기를 지원하지 않는 게임입니다.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <p>{game.description || 'No description available.'}</p>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {game.external_url && (
              <a
                className="btn btn-primary"
                href={game.external_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                PLAY FULL
              </a>
            )}
            <button className="btn btn-secondary" onClick={onClose}>
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreviewModal;
