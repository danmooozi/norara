const CATEGORIES = [
  { value: 'All',  label: '📂 전체' },
  { value: '게임', label: '🎮 게임' },
  { value: '도구', label: '🔧 도구' },
  { value: '실험', label: '🧪 실험' },
];

function SearchBar({ search, category, onSearchChange, onCategoryChange }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        className="search-input"
        placeholder="🔍 게임 이름으로 검색..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select
        className="category-select"
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        {CATEGORIES.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
  );
}

export default SearchBar;
