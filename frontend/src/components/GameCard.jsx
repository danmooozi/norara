function GameCard({ game, onPreview }) {
  const handleImgError = (e) => {
    e.target.src = '/placeholder.svg';
  };

  return (
    <div className="game-card">
      <div className="game-card-thumbnail-wrap">
        <img
          className="game-card-thumbnail"
          src={game.thumbnail || '/placeholder.svg'}
          alt={game.title}
          onError={handleImgError}
        />
      </div>
      <div className="game-card-body">
        <span className={`game-card-category game-card-category--${(game.category || 'Arcade').toLowerCase()}`}>
          {({
            Arcade:'🕹️', Puzzle:'🧩', Strategy:'♟️', Action:'⚔️',
            RPG:'🗡️', Sports:'⚽', Party:'🎲', Music:'🎵', Tool:'🛠️', Other:'📦'
          })[game.category] || '🎮'} {game.category || 'Arcade'}
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
