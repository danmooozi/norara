const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/games
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }
    if (category && category !== 'All') {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    let query = 'SELECT * FROM games';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/games error:', err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// GET /api/games/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM games WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/games/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// POST /api/games
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, category, thumbnail, preview_url, external_url } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO games (title, description, category, thumbnail, preview_url, external_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description || '', category || '기타', thumbnail || '', preview_url || '', external_url || '']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/games error:', err);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// PUT /api/games/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { rows: existing } = await pool.query('SELECT * FROM games WHERE id = $1', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    const e = existing[0];
    const { title, description, category, thumbnail, preview_url, external_url } = req.body;
    const { rows } = await pool.query(
      `UPDATE games
       SET title=$1, description=$2, category=$3, thumbnail=$4, preview_url=$5, external_url=$6
       WHERE id=$7 RETURNING *`,
      [
        title !== undefined ? title : e.title,
        description !== undefined ? description : e.description,
        category !== undefined ? category : e.category,
        thumbnail !== undefined ? thumbnail : e.thumbnail,
        preview_url !== undefined ? preview_url : e.preview_url,
        external_url !== undefined ? external_url : e.external_url,
        req.params.id
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/games/:id error:', err);
    res.status(500).json({ error: 'Failed to update game' });
  }
});

// DELETE /api/games/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM games WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    await pool.query('DELETE FROM games WHERE id = $1', [req.params.id]);
    res.json({ message: 'Game deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/games/:id error:', err);
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

// POST /api/games/:id/fetch-thumbnail  — OG 이미지 자동 수집
router.post('/:id/fetch-thumbnail', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM games WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: '게임을 찾을 수 없습니다.' });

    const game = rows[0];
    const targetUrl = game.external_url || game.preview_url;
    if (!targetUrl) return res.status(400).json({ error: 'URL이 없습니다.' });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let html;
    try {
      html = await fetch(targetUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; norara-bot/1.0)' }
      }).then(r => r.text());
    } finally {
      clearTimeout(timeout);
    }

    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    if (!match?.[1]) return res.status(404).json({ error: 'OG 이미지를 찾을 수 없습니다.' });

    const ogImage = match[1].startsWith('//') ? `https:${match[1]}` : match[1];
    const { rows: updated } = await pool.query(
      'UPDATE games SET thumbnail = $1 WHERE id = $2 RETURNING *',
      [ogImage, req.params.id]
    );
    res.json(updated[0]);
  } catch (err) {
    console.error('POST /api/games/:id/fetch-thumbnail error:', err);
    res.status(500).json({ error: '썸네일 수집 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
