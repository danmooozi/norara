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
    category TEXT DEFAULT 'Arcade',
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
      title: 'Flappy Bird',
      description: 'Navigate a bird through a series of pipes by tapping to keep it airborne. A classic endless runner that tests your timing and reflexes.',
      category: 'Arcade',
      thumbnail: 'https://upload.wikimedia.org/wikipedia/en/0/0a/Flappy_bird_gameplay.png',
      preview_url: 'https://flappybird.io',
      external_url: 'https://flappybird.io'
    },
    {
      title: '2048',
      description: 'Slide numbered tiles on a grid to combine them and create a tile with the number 2048. A highly addictive puzzle game.',
      category: 'Puzzle',
      thumbnail: 'https://play2048.co/meta/og-image.png',
      preview_url: 'https://play2048.co',
      external_url: 'https://play2048.co'
    },
    {
      title: 'Snake Game',
      description: 'Control a growing snake to eat food while avoiding walls and your own tail. A timeless classic from the early days of mobile gaming.',
      category: 'Arcade',
      thumbnail: 'https://www.google.com/logos/fnbx/snake_arcade/v17/snake_arcade_logo.png',
      preview_url: 'https://playsnake.org',
      external_url: 'https://playsnake.org'
    },
    {
      title: 'Tetris',
      description: 'Arrange falling blocks to complete horizontal lines and prevent the stack from reaching the top. The ultimate block-stacking puzzle game.',
      category: 'Puzzle',
      thumbnail: 'https://tetris.com/res/img/media/tetris-effect-connected-key-art.jpg',
      preview_url: 'https://tetris.com/play-tetris',
      external_url: 'https://tetris.com/play-tetris'
    },
    {
      title: 'Pac-Man',
      description: 'Guide Pac-Man through a maze, eating dots and avoiding ghosts. One of the most iconic arcade games of all time.',
      category: 'Arcade',
      thumbnail: 'https://www.google.com/logos/2010/pacman10-i.gif',
      preview_url: 'https://www.google.com/logos/2010/pacman10-hp.html',
      external_url: 'https://www.google.com/logos/2010/pacman10-hp.html'
    },
    {
      title: 'Minesweeper',
      description: 'Clear a minefield without detonating any mines using number clues about neighboring mines. A classic logic puzzle game.',
      category: 'Puzzle',
      thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Minesweeper_on_Windows_XP.png/300px-Minesweeper_on_Windows_XP.png',
      preview_url: 'https://minesweeper.online',
      external_url: 'https://minesweeper.online'
    },
    {
      title: 'Sudoku',
      description: 'Fill a 9×9 grid with digits so each column, row, and 3×3 section contains all digits from 1 to 9. A beloved number placement puzzle.',
      category: 'Puzzle',
      thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Sudoku-by-L2G-20050714.svg/250px-Sudoku-by-L2G-20050714.svg.png',
      preview_url: 'https://sudoku.com',
      external_url: 'https://sudoku.com'
    },
    {
      title: 'Chess',
      description: 'The classic strategy board game. Play against an AI or challenge a friend in this timeless game of skill and tactics.',
      category: 'Strategy',
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

// 관리자 계정 초기 생성 (admin / admin1234)
const adminExists = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
if (!adminExists) {
  const hashed = bcrypt.hashSync('admin1234', 10);
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run('admin', hashed, 'admin');
  console.log('[Auth] 관리자 계정 생성: admin / admin1234');
}

module.exports = db;
