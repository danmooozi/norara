const CATEGORIES = [
  { value: 'All',    label: '📂 전체' },
  { value: '액션',   label: '⚔️ 액션' },
  { value: '퍼즐',   label: '🧩 퍼즐' },
  { value: 'RPG',    label: '🗡️ RPG' },
  { value: '스포츠', label: '⚽ 스포츠' },
  { value: '파티',   label: '🎲 파티' },
  { value: '기타',   label: '📦 기타' },
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
