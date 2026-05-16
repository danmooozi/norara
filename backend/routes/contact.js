const express = require('express');
const router = express.Router();
const { Client } = require('@notionhq/client');

const DB_ID = process.env.NOTION_CONTACT_DB_ID;

function getClient() {
  return new Client({ auth: process.env.NOTION_TOKEN });
}

router.post('/', async (req, res) => {
  if (!process.env.NOTION_TOKEN || !DB_ID) {
    return res.status(503).json({ error: 'Notion 연동이 설정되지 않았습니다.' });
  }

  const { name, email, message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: '내용은 필수 항목입니다.' });

  try {
    await getClient().pages.create({
      parent: { database_id: DB_ID },
      properties: {
        제목: { title: [{ text: { content: name?.trim() || '익명' } }] },
        이메일: { email: email?.trim() || null },
        내용: { rich_text: [{ text: { content: message.trim() } }] },
        상태: { select: { name: '확인 전' } }
      }
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('POST /api/contact error:', err);
    res.status(500).json({ error: '전송 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
