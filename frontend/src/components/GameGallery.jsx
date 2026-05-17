import { useState, useEffect, useCallback } from 'react';
import SearchBar from './SearchBar.jsx';
import GameCard from './GameCard.jsx';
import PreviewModal from './PreviewModal.jsx';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// featured 카드를 2번째(index 1)에 두어 4열 그리드에서 항상 가운데(col 2-3) 위치
function arrangeWithFeatured(allGames, featuredId) {
  if (!featuredId || allGames.length === 0) return allGames;
  const featured = allGames.find(g => g.id === featuredId);
  if (!featured) return allGames;
  const others = allGames.filter(g => g.id !== featuredId);
  return [others[0], featured, ...others.slice(1)].filter(Boolean);
}

function GameGallery({ randomTrigger = 0 }) {
  const [games, setGames] = useState([]);
  const [displayGames, setDisplayGames] = useState([]);
  const [featuredId, setFeaturedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedGame, setSelectedGame] = useState(null);
  const [shuffleAnim, setShuffleAnim] = useState(false);

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

      const dbFeatured = data.find(g => g.featured);
      const featured = dbFeatured ?? data[Math.floor(Math.random() * data.length)];
      const fid = featured?.id ?? null;
      setFeaturedId(fid);
      setDisplayGames(arrangeWithFeatured(data, fid));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchGames, 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  useEffect(() => {
    if (randomTrigger === 0) return;
    if (displayGames.length === 0) return;
    const pick = displayGames[Math.floor(Math.random() * displayGames.length)];
    setSelectedGame(pick);
  }, [randomTrigger]);

  const handleShuffle = useCallback(() => {
    setShuffleAnim(true);
    setTimeout(() => {
      const shuffled = shuffle(games);
      const fid = shuffled[Math.floor(Math.random() * shuffled.length)]?.id ?? null;
      setFeaturedId(fid);
      setDisplayGames(arrangeWithFeatured(shuffled, fid));
      setShuffleAnim(false);
    }, 200);
  }, [games]);

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
          <p>{displayGames.length}개의 게임</p>
        )}
        {!loading && !error && games.length > 1 && (
          <button className="shuffle-btn" onClick={handleShuffle} title="랜덤 섞기">
            SHUFFLE
          </button>
        )}
      </div>

      {loading && <div className="loading-state">LOADING...</div>}
      {error && <div className="error-state">⚠ {error}</div>}

      {!loading && !error && (
        <div className={`game-grid bento-grid${shuffleAnim ? ' game-grid--shuffling' : ''}`}>
          {displayGames.length === 0 ? (
            <div className="empty-state">
              <span>🕹️</span>
              <p>게임이 없어요. 검색어나 카테고리를 바꿔보세요!</p>
            </div>
          ) : (
            displayGames.map((game, i) => (
              <GameCard
                key={game.id}
                game={game}
                index={i}
                isFeatured={game.id === featuredId}
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
