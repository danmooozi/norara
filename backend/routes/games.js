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
    const { title, description, category, thumbnail, preview_url, external_url, featured, flag, is_mine, play_count } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO games (title, description, category, thumbnail, preview_url, external_url, featured, flag, is_mine, play_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [title, description || '', category || '게임', thumbnail || '', preview_url || '', external_url || '',
       featured || false, flag || null, is_mine || false, play_count || 0]
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
    const { title, description, category, thumbnail, preview_url, external_url, featured, flag, is_mine, play_count } = req.body;
    const { rows } = await pool.query(
      `UPDATE games
       SET title=$1, description=$2, category=$3, thumbnail=$4, preview_url=$5, external_url=$6,
           featured=$7, flag=$8, is_mine=$9, play_count=$10
       WHERE id=$11 RETURNING *`,
      [
        title       !== undefined ? title       : e.title,
        description !== undefined ? description : e.description,
        category    !== undefined ? category    : e.category,
        thumbnail   !== undefined ? thumbnail   : e.thumbnail,
        preview_url !== undefined ? preview_url : e.preview_url,
        external_url!== undefined ? external_url: e.external_url,
        featured    !== undefined ? featured    : (e.featured    ?? false),
        flag        !== undefined ? flag        : (e.flag        ?? null),
        is_mine     !== undefined ? is_mine     : (e.is_mine     ?? false),
        play_count  !== undefined ? play_count  : (e.play_count  ?? 0),
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

// POST /api/games/:id/check-iframe  — X-Frame-Options 차단 여부 확인
router.post('/:id/check-iframe', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM games WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: '게임을 찾을 수 없습니다.' });

    const game = rows[0];
    const targetUrl = game.preview_url || game.external_url;
    if (!targetUrl) return res.status(400).json({ error: 'URL이 없습니다.' });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let blocked = false;
    try {
      const response = await fetch(targetUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; norara-bot/1.0)' }
      });
      const xfo = response.headers.get('x-frame-options');
      const csp = response.headers.get('content-security-policy');
      if (xfo && /deny|sameorigin/i.test(xfo)) blocked = true;
      if (!blocked && csp && /frame-ancestors\s+['"]?none['"]?/i.test(csp)) blocked = true;
    } finally {
      clearTimeout(timeout);
    }

    const { rows: updated } = await pool.query(
      'UPDATE games SET iframe_blocked = $1 WHERE id = $2 RETURNING *',
      [blocked, req.params.id]
    );
    res.json({ iframe_blocked: blocked, game: updated[0] });
  } catch (err) {
    console.error('POST /api/games/:id/check-iframe error:', err);
    res.status(500).json({ error: 'iframe 체크 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
