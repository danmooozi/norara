const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'games.db');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT '기타',
    thumbnail TEXT,
    preview_url TEXT,
    external_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const count = db.prepare('SELECT COUNT(*) as cnt FROM games').get();
if (count.cnt === 0) {
  const insert = db.prepare(`
    INSERT INTO games (title, description, category, thumbnail, preview_url, external_url)
    VALUES (@title, @description, @category, @thumbnail, @preview_url, @external_url)
  `);

  const sampleGames = [
    {
      title: '플래피 버드',
      description: '파이프 사이를 통과하며 얼마나 멀리 날아갈 수 있는지 도전. 탭 하나로 새를 조종하는 타이밍 게임.',
      category: '액션',
      thumbnail: 'https://upload.wikimedia.org/wikipedia/en/0/0a/Flappy_bird_gameplay.png',
      preview_url: 'https://flappybird.io',
      external_url: 'https://flappybird.io'
    },
    {
      title: '2048',
      description: '숫자 타일을 밀어 같은 숫자끼리 합쳐서 2048을 만들면 클리어. 한 번 시작하면 끝내기 어려운 중독성 있는 퍼즐.',
      category: '퍼즐',
      thumbnail: 'https://play2048.co/meta/og-image.png',
      preview_url: 'https://play2048.co',
      external_url: 'https://play2048.co'
    },
    {
      title: '스네이크',
      description: '먹이를 먹으면 몸이 길어지는 뱀을 조종해 벽과 자신의 몸통에 부딪히지 않도록 하는 게임.',
      category: '액션',
      thumbnail: 'https://www.google.com/logos/fnbx/snake_arcade/v17/snake_arcade_logo.png',
      preview_url: 'https://playsnake.org',
      external_url: 'https://playsnake.org'
    },
    {
      title: '테트리스',
      description: '떨어지는 블록을 쌓아 가로줄을 완성해 없애는 게임. 블록이 천장에 닿기 전에 얼마나 버틸 수 있을지 도전.',
      category: '퍼즐',
      thumbnail: 'https://tetris.com/res/img/media/tetris-effect-connected-key-art.jpg',
      preview_url: 'https://tetris.com/play-tetris',
      external_url: 'https://tetris.com/play-tetris'
    },
    {
      title: '팩맨',
      description: '미로를 돌아다니며 점을 먹고 유령을 피하는 아케이드의 전설. 구글 로고 버전으로 무료로 즐길 수 있음.',
      category: '액션',
      thumbnail: 'https://www.google.com/logos/2010/pacman10-i.gif',
      preview_url: 'https://www.google.com/logos/2010/pacman10-hp.html',
      external_url: 'https://www.google.com/logos/2010/pacman10-hp.html'
    },
    {
      title: '지뢰 찾기',
      description: '숫자 힌트를 보고 지뢰가 없는 칸을 모두 열면 승리. 집중력과 논리력이 필요한 클래식 퍼즐.',
      category: '퍼즐',
      thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Minesweeper_on_Windows_XP.png/300px-Minesweeper_on_Windows_XP.png',
      preview_url: 'https://minesweeper.online',
      external_url: 'https://minesweeper.online'
    },
    {
      title: '스도쿠',
      description: '9×9 칸에 1~9 숫자를 겹치지 않게 채우는 숫자 퍼즐. 난이도별로 즐길 수 있는 두뇌 운동.',
      category: '퍼즐',
      thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Sudoku-by-L2G-20050714.svg/250px-Sudoku-by-L2G-20050714.svg.png',
      preview_url: 'https://sudoku.com',
      external_url: 'https://sudoku.com'
    },
    {
      title: '체스',
      description: 'AI 또는 친구와 즐기는 전통 체스. 전략적 사고와 수 읽기 능력을 키울 수 있는 보드 게임의 고전.',
      category: '기타',
      thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/ChessSet.jpg/300px-ChessSet.jpg',
      preview_url: 'https://www.chess.com/play/computer',
      external_url: 'https://www.chess.com'
    }
  ];

  const insertMany = db.transaction((games) => {
    for (const game of games) {
      insert.run(game);
    }
  });

  insertMany(sampleGames);
  console.log('Sample game data seeded successfully.');
}

// ── Users Table ──
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
const adminExists = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
if (!adminExists) {
  const hashed = bcrypt.hashSync(adminPassword, 10);
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run('admin', hashed, 'admin');
  console.log('[Auth] 관리자 계정 생성 완료');
} else if (process.env.ADMIN_PASSWORD) {
  const hashed = bcrypt.hashSync(adminPassword, 10);
  db.prepare("UPDATE users SET password = ? WHERE username = 'admin'").run(hashed);
}

module.exports = db;
