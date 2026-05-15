const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// 테이블 자동 생성
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_requests (
      id          SERIAL PRIMARY KEY,
      site_name   VARCHAR(200) NOT NULL,
      site_url    VARCHAR(500) NOT NULL,
      category    VARCHAR(50)  NOT NULL DEFAULT '기타',
      description TEXT,
      requester   VARCHAR(100),
      status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);
}
ensureTable().catch(console.error);

// POST /api/site-requests  — 누구나 신청 가능
router.post('/', async (req, res) => {
  try {
    const { site_name, site_url, category, description, requester } = req.body;
    if (!site_name || !site_name.trim())
      return res.status(400).json({ error: '사이트 이름은 필수 항목입니다.' });
    if (!site_url || !/^https?:\/\/.+/.test(site_url.trim()))
      return res.status(400).json({ error: '올바른 URL을 입력해주세요. (http:// 또는 https://)' });

    const { rows } = await pool.query(
      `INSERT INTO site_requests (site_name, site_url, category, description, requester)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        site_name.trim(),
        site_url.trim(),
        category || '기타',
        description?.trim() || '',
        requester?.trim() || ''
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/site-requests error:', err);
    res.status(500).json({ error: '신청 중 오류가 발생했습니다.' });
  }
});

// GET /api/site-requests  — 관리자 전용
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM site_requests';
    const params = [];
    if (status && status !== 'all') {
      query += ' WHERE status = $1';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/site-requests error:', err);
    res.status(500).json({ error: '목록 조회 중 오류가 발생했습니다.' });
  }
});

// PATCH /api/site-requests/:id/status  — 관리자 전용 (상태 변경)
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status))
      return res.status(400).json({ error: '유효하지 않은 상태값입니다.' });

    const { rows } = await pool.query(
      'UPDATE site_requests SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: '신청을 찾을 수 없습니다.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /api/site-requests/:id/status error:', err);
    res.status(500).json({ error: '상태 변경 중 오류가 발생했습니다.' });
  }
});

// POST /api/site-requests/:id/register  — 승인 + 게임 갤러리 등록 (트랜잭션)
router.post('/:id/register', requireAuth, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { title, description, category, thumbnail, preview_url, external_url } = req.body;

    if (!title || !title.trim())
      return res.status(400).json({ error: '게임 제목은 필수 항목입니다.' });

    await client.query('BEGIN');

    // 1) site_request를 approved로 변경
    const { rows: reqRows } = await client.query(
      'UPDATE site_requests SET status=$1 WHERE id=$2 RETURNING *',
      ['approved', req.params.id]
    );
    if (reqRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '신청을 찾을 수 없습니다.' });
    }

    // 2) games 테이블에 INSERT
    const { rows: gameRows } = await client.query(
      `INSERT INTO games (title, description, category, thumbnail, preview_url, external_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        title.trim(),
        description?.trim() || '',
        category || '기타',
        thumbnail?.trim() || '',
        preview_url?.trim() || '',
        external_url?.trim() || ''
      ]
    );

    await client.query('COMMIT');
    res.status(201).json({ request: reqRows[0], game: gameRows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/site-requests/:id/register error:', err);
    res.status(500).json({ error: '갤러리 등록 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// DELETE /api/site-requests/:id  — 관리자 전용
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM site_requests WHERE id=$1 RETURNING id',
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: '신청을 찾을 수 없습니다.' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/site-requests/:id error:', err);
    res.status(500).json({ error: '삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
