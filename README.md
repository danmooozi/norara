<div align="center">

# norara

웹 게임·사이트를 한 곳에 모아두고 바로 플레이할 수 있는 게임 갤러리

</div>

---

## 기능

- **게임 갤러리** — 카드 형태로 게임 목록 표시, 카테고리·검색 필터
- **미리보기** — iframe 인게임 플레이 또는 외부 링크로 이동
- **PLAY 버튼** — 랜덤 게임 즉시 실행
- **사이트 추가 요청** — 누구나 갤러리 등록 신청 가능
- **개발자에게 문의** — 폼 제출 시 Notion 데이터베이스에 자동 저장
- **관리자 패널** — 게임 CRUD, 사이트 요청 승인/거절/갤러리 등록
- **커서 펫** — 마우스를 따라다니는 픽셀 아트 오리

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18, Vite 5, CSS (레트로 픽셀 테마) |
| Backend | Node.js 24, Express.js 4 |
| Database | PostgreSQL (Supabase) |
| 인증 | JWT |
| 보안 | Helmet.js, express-rate-limit, CORS |
| 외부 연동 | Notion API |

---

## 프로젝트 구조

```
norara/
├── .env.example          # 환경변수 예시 (루트에서 통합 관리)
├── start.sh              # 백엔드 + 프론트엔드 동시 실행
├── backend/
│   ├── middleware/auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── games.js
│   │   ├── siteRequests.js
│   │   └── contact.js
│   ├── db.js
│   ├── server.js
│   └── seed.js           # 초기 데이터 시딩 (최초 1회)
└── frontend/
    └── src/
        ├── components/
        ├── context/AuthContext.jsx
        ├── App.jsx
        └── main.jsx
```

---

## 로컬 실행

**Node.js 24+** 가 필요합니다.

### 1. 환경변수 설정

루트의 `.env.example`을 복사해 `.env`를 만들고 값을 채워주세요.

```bash
cp .env.example .env
```

```env
# === Backend ===
JWT_SECRET=랜덤_시크릿_키
ADMIN_PASSWORD=관리자_비밀번호
PORT=5000
NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://...

# === Frontend (선택) ===
NOTION_TOKEN=secret_...
NOTION_CONTACT_DB_ID=...
```

### 2. 의존성 설치

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. 실행

```bash
# 루트에서 한 번에 실행
bash start.sh
```

또는 개별 실행:

```bash
# 백엔드
cd backend && node server.js   # → http://localhost:5000

# 프론트엔드 (새 터미널)
cd frontend && npm run dev     # → http://localhost:3000
```

프론트엔드의 `/api` 요청은 Vite 프록시를 통해 `:5000`으로 전달됩니다.

---

## API

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/games` | 게임 목록 (`?search=`, `?category=`) | - |
| GET | `/api/games/:id` | 게임 단건 조회 | - |
| POST | `/api/games` | 게임 등록 | 관리자 |
| PUT | `/api/games/:id` | 게임 수정 | 관리자 |
| DELETE | `/api/games/:id` | 게임 삭제 | 관리자 |
| POST | `/api/auth/login` | 로그인 (JWT 발급) | - |
| GET | `/api/auth/me` | 내 정보 조회 | 로그인 |
| POST | `/api/site-requests` | 사이트 추가 요청 | - |
| GET | `/api/site-requests` | 요청 목록 조회 | 관리자 |
| PATCH | `/api/site-requests/:id/status` | 요청 상태 변경 | 관리자 |
| POST | `/api/site-requests/:id/register` | 요청 승인 + 갤러리 등록 | 관리자 |
| DELETE | `/api/site-requests/:id` | 요청 삭제 | 관리자 |
| POST | `/api/contact` | 문의 제출 → Notion 저장 | - |

---

## 카테고리

`액션` · `퍼즐` · `RPG` · `스포츠` · `파티` · `기타`

---

## 배포

```bash
# 프론트엔드 빌드
cd frontend && npm run build
# dist/ 를 Nginx 등으로 서빙

# 백엔드 (PM2 권장)
cd backend && pm2 start server.js --name norara-api
```

`.env`의 `NODE_ENV=production`, `ALLOWED_ORIGIN`을 실제 도메인으로 설정해야 합니다.

---

## 트러블슈팅

**포트 충돌**

```bash
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

**프록시 안 될 때**

`frontend/vite.config.js`의 `/api` target이 `http://localhost:5000`인지 확인.
