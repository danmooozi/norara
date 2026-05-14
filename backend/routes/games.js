const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/games - fetch all games
router.get('/', (req, res) => {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM games';
    const conditions = [];
    const params = {};

    if (search) {
      conditions.push("(title LIKE @search OR description LIKE @search)");
      params.search = `%${search}%`;
    }
    if (category && category !== 'All') {
      conditions.push("category = @category");
      params.category = category;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const games = db.prepare(query).all(params);
    res.json(games);
  } catch (err) {
    console.error('GET /api/games error:', err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// GET /api/games/:id - fetch a single game
router.get('/:id', (req, res) => {
  try {
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (err) {
    console.error('GET /api/games/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// POST /api/games - create a new game (로그인 필요)
router.post('/', requireAuth, (req, res) => {
  try {
    const { title, description, category, thumbnail, preview_url, external_url } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const stmt = db.prepare(`
      INSERT INTO games (title, description, category, thumbnail, preview_url, external_url)
      VALUES (@title, @description, @category, @thumbnail, @preview_url, @external_url)
    `);
    const result = stmt.run({
      title: title || '',
      description: description || '',
      category: category || 'Arcade',
      thumbnail: thumbnail || '',
      preview_url: preview_url || '',
      external_url: external_url || ''
    });
    const newGame = db.prepare('SELECT * FROM games WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newGame);
  } catch (err) {
    console.error('POST /api/games error:', err);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// PUT /api/games/:id - update a game (로그인 필요)
router.put('/:id', requireAuth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Game not found' });
    }
    const { title, description, category, thumbnail, preview_url, external_url } = req.body;
    db.prepare(`
      UPDATE games
      SET title = @title,
          description = @description,
          category = @category,
          thumbnail = @thumbnail,
          preview_url = @preview_url,
          external_url = @external_url
      WHERE id = @id
    `).run({
      id: req.params.id,
      title: title !== undefined ? title : existing.title,
      description: description !== undefined ? description : existing.description,
      category: category !== undefined ? category : existing.category,
      thumbnail: thumbnail !== undefined ? thumbnail : existing.thumbnail,
      preview_url: preview_url !== undefined ? preview_url : existing.preview_url,
      external_url: external_url !== undefined ? external_url : existing.external_url
    });
    const updated = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('PUT /api/games/:id error:', err);
    res.status(500).json({ error: 'Failed to update game' });
  }
});

// DELETE /api/games/:id - delete a game (로그인 필요)
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Game not found' });
    }
    db.prepare('DELETE FROM games WHERE id = ?').run(req.params.id);
    res.json({ message: 'Game deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/games/:id error:', err);
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

module.exports = router;
