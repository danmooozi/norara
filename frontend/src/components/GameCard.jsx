import { useState } from 'react';

const CAT_STYLE = {
  '게임': { color: '#5EE9D6', label: '게임' },
  '도구': { color: '#B891FF', label: '도구' },
  '실험': { color: '#FF8FD7', label: '실험' },
};

const ROTATIONS = [-1.0, 0.7, -0.4, 1.1, -0.6, 0.5, -0.9, 0.6, -0.3, 0.4];

function GameCard({ game, index = 0, isFeatured = false, onPreview }) {
  const [imgError, setImgError] = useState(false);
  const cat = CAT_STYLE[game.category] || CAT_STYLE['게임'];
  const showPlaceholder = !game.thumbnail || imgError;
  const rot = ROTATIONS[index % ROTATIONS.length];

  return (
    // bento-wrap: 그리드 span + 회전 + 클릭 — overflow: visible 유지 (테이프용)
    <div
      className={`bento-wrap${isFeatured ? ' bento-wrap--featured' : ''}`}
      style={{ '--card-rot': `${rot}deg` }}
      onClick={() => onPreview(game)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onPreview(game)}
    >
      {/* 테이프: wrap 기준으로 카드 위에 겹침 */}
      <div className="bento-tape" />

      {/* bento-card: 시각적 박스 + overflow: hidden으로 내부 클리핑 */}
      <div className="bento-card">
        {/* 썸네일 */}
        <div className="bento-thumb-wrap">
          {showPlaceholder ? (
            <div className="bento-thumb-placeholder">
              <span className="bento-placeholder-icon">🎮</span>
            </div>
          ) : (
            <img
              className="bento-thumb"
              src={game.thumbnail}
              alt={game.title}
              onError={() => setImgError(true)}
            />
          )}

          {/* NEW / PICK 깃발 */}
          {game.flag && (
            <div className={`bento-flag bento-flag--${game.flag.toLowerCase()}`}>
              {game.flag}
            </div>
          )}
        </div>

        {/* 카드 바디 */}
        <div className="bento-body">
          <div className="bento-cat-row">
            <span className="bento-cat-badge" style={{ color: cat.color, borderColor: cat.color }}>
              {cat.label}
            </span>
          </div>

          <div className="bento-title">{game.title}</div>

          {game.description && (
            <p className="bento-desc">{game.description}</p>
          )}

          <div className="bento-actions" onClick={(e) => e.stopPropagation()}>
            {game.preview_url && (
              <button
                className="bento-btn bento-btn--play"
                onClick={() => onPreview(game)}
              >
                ▶ PLAY
              </button>
            )}
            {game.external_url && (
              <a
                className="bento-btn bento-btn--site"
                href={game.external_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                GO SITE
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameCard;
