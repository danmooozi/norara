import { useState } from 'react';

const CATEGORY_STYLE = {
  '액션': { bg: '#3d1a1a', color: '#ff6b6b', icon: '⚔️' },
  '퍼즐': { bg: '#1a2a3d', color: '#6bb5ff', icon: '🧩' },
  'RPG':  { bg: '#2a1a3d', color: '#c06bff', icon: '🗡️' },
  '스포츠': { bg: '#1a3d1a', color: '#6bff8e', icon: '⚽' },
  '파티': { bg: '#3d2e1a', color: '#ffd06b', icon: '🎲' },
  '기타': { bg: '#2a2a2a', color: '#aaaaaa', icon: '🎮' },
};

function GameCard({ game, onPreview }) {
  const [imgError, setImgError] = useState(false);
  const style = CATEGORY_STYLE[game.category] || CATEGORY_STYLE['기타'];
  const showPlaceholder = !game.thumbnail || imgError;

  return (
    <div className="game-card">
      <div className="game-card-thumbnail-wrap">
        {showPlaceholder ? (
          <div
            className="game-card-placeholder"
            style={{ background: style.bg }}
          >
            <span className="game-card-placeholder-icon">{style.icon}</span>
            <span className="game-card-placeholder-cat" style={{ color: style.color }}>
              {game.category || '기타'}
            </span>
          </div>
        ) : (
          <img
            className="game-card-thumbnail"
            src={game.thumbnail}
            alt={game.title}
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="game-card-body">
        <span className="game-card-category">
          {({
            '액션': '⚔️', '퍼즐': '🧩', 'RPG': '🗡️',
            '스포츠': '⚽', '파티': '🎲', '기타': '📦'
          })[game.category] || '🎮'} {game.category || '기타'}
        </span>
        <div className="game-card-title">{game.title}</div>
        <p className="game-card-desc">{game.description || 'No description available.'}</p>
        <div className="game-card-actions">
          {game.preview_url && (
            <button
              className="btn btn-primary"
              onClick={() => onPreview(game)}
            >
              PLAY
            </button>
          )}
          {game.external_url && (
            <a
              className="btn btn-secondary"
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
  );
}

export default GameCard;
