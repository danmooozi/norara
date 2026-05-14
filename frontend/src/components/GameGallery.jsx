import { useState, useEffect } from 'react';
import SearchBar from './SearchBar.jsx';
import GameCard from './GameCard.jsx';
import PreviewModal from './PreviewModal.jsx';

function GameGallery() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedGame, setSelectedGame] = useState(null);

  const fetchGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category && category !== 'All') params.append('category', category);
      const res = await fetch(`/api/games?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch games');
      const data = await res.json();
      setGames(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGames();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  return (
    <div>
      <div className="gallery-hero">
        <div className="gallery-hero-title">norara</div>
        <div className="gallery-hero-sub">퇴근하고 노라라~</div>
        <div className="gallery-hero-stars">★ ★ ★ ★ ★</div>
      </div>

      <SearchBar
        search={search}
        category={category}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
      />

      <div className="gallery-header">
        <h2>▶ GAME LIST</h2>
        {!loading && !error && (
          <p>{games.length}개의 게임</p>
        )}
      </div>

      {loading && <div className="loading-state">LOADING...</div>}
      {error && <div className="error-state">⚠ {error}</div>}

      {!loading && !error && (
        <div className="game-grid">
          {games.length === 0 ? (
            <div className="empty-state">
              <span>🕹️</span>
              <p>게임이 없어요. 검색어나 카테고리를 바꿔보세요!</p>
            </div>
          ) : (
            games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onPreview={setSelectedGame}
              />
            ))
          )}
        </div>
      )}

      {selectedGame && (
        <PreviewModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}

    </div>
  );
}

export default GameGallery;
