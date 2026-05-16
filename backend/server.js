require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./db');
const gamesRouter = require('./routes/games');
const authRouter = require('./routes/auth');
const siteRequestsRouter = require('./routes/siteRequests');
const contactRouter = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: '너무 많은 시도입니다. 15분 후 다시 시도해주세요.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRouter);
app.use('/api/games', gamesRouter);
app.use('/api/site-requests', siteRequestsRouter);
app.use('/api/contact', contactRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API server running on http://0.0.0.0:${PORT}`);
});
