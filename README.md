<div align="center">

# norara

여러 웹 게임을 한 곳에 모아두고 iframe으로 바로 플레이할 수 있는 게임 갤러리

</div>

---

## Tech Stack

| 영역 | 기술 |
|------|------|
| Frontend | React 18, Vite 5, CSS (레트로 픽셀 테마) |
| Backend | Node.js 24, Express.js 4 |
| Database | SQLite (`better-sqlite3`) |
| Ports | Frontend `:3000` · Backend `:5000` |

---

## 구조

```
norara/
├── backend/
│   ├── middleware/auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── games.js
│   ├── db.js
│   └── server.js
└── frontend/
    └── src/
        ├── components/
        ├── context/AuthContext.jsx
        ├── App.jsx
        └── main.jsx
```

---

## 실행

Node.js 24+ 필요합니다.

**백엔드**

```bash
cd backend
npm install
node server.js
# → http://localhost:5000
```

**프론트엔드** (새 터미널)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

프론트엔드의 `/api` 요청은 vite 프록시를 통해 `:5000`으로 넘어갑니다.

---

## 사용법

### 일반 사용자

1. `http://localhost:3000` 접속
2. 카테고리 필터 또는 검색으로 게임 탐색
3. 게임 카드 클릭 → iframe 미리보기 또는 외부 링크로 플레이

### 관리자

헤더에 링크가 없고 URL로 직접 접근합니다.

```
http://localhost:3000/#/secret-admin
```

기본 계정: `admin` / `admin1234`

---

## API

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| `GET` | `/api/games` | 게임 목록 (`?search=`, `?category=` 지원) | - |
| `GET` | `/api/games/:id` | 게임 단건 조회 | - |
| `POST` | `/api/games` | 게임 등록 | admin |
| `PUT` | `/api/games/:id` | 게임 수정 | admin |
| `DELETE` | `/api/games/:id` | 게임 삭제 | admin |
| `POST` | `/api/auth/login` | 로그인 (JWT 발급) | - |
| `GET` | `/api/auth/me` | 내 정보 | 로그인 |
| `GET` | `/api/auth/users` | 유저 목록 | admin |
| `PATCH` | `/api/auth/users/:id/role` | 권한 변경 | admin |

---

## 카테고리

`액션` · `퍼즐` · `RPG` · `스포츠` · `파티` · `기타`

---

## 배포

**환경 변수**

```bash
# backend/.env
JWT_SECRET=your-secret-key-here
PORT=5000
```

**서버 배포**

```bash
cd frontend && npm run build
# dist/ 폴더를 Nginx 등으로 서빙

cd backend && pm2 start server.js --name norara-api
# Nginx에서 /api → localhost:5000 프록시 설정
```

---

## 트러블슈팅

**포트 충돌**

```bash
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

**DB 초기화**

```bash
cd backend && rm games.db && node server.js
```

**프록시 안 될 때**

`frontend/vite.config.js`에서 `/api` target이 `http://localhost:5000`인지 확인.
