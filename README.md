<div align="center">

# 🕹️ norara

**여러 웹 게임을 한 곳에서 탐색하고 iframe으로 미리보기할 수 있는 중앙 집중식 게임 갤러리**

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## ✨ Overview

웹 게임은 어디에나 흩어져 있지만, 한 곳에서 관리하고 바로 플레이할 수 있는 공간은 없었습니다.  
norara는 북마크 대신 **갤러리 UI + iframe 미리보기**로 즐겨찾는 웹 게임을 중앙 관리합니다.

---

## 🛠️ Tech Stack

| 영역 | 기술 |
|------|------|
| **Frontend** | React 18, Vite 5, CSS (레트로 픽셀 테마) |
| **Backend** | Node.js 20, Express.js 4 |
| **Database** | SQLite (`better-sqlite3`) |
| **Ports** | Frontend `:3000` · Backend `:5000` |

---

## 📁 Project Structure

```
norara/
├── backend/
│   ├── middleware/
│   │   └── auth.js            # JWT 인증 미들웨어
│   ├── routes/
│   │   ├── auth.js            # 인증 라우트
│   │   └── games.js           # 게임 CRUD 라우트
│   ├── db.js                  # SQLite 초기화 및 시드
│   ├── server.js              # Express 앱 엔트리포인트
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # UI 컴포넌트
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 🚀 Quick Start

**사전 요구사항:** Node.js 20+, npm 9+

### 1. 저장소 클론

```bash
git clone https://github.com/[your-username]/norara.git
cd norara
```

### 2. 백엔드 실행

```bash
cd backend
npm install
node server.js
# → http://localhost:5000
```

### 3. 프론트엔드 실행

```bash
# 새 터미널에서
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

> 프론트엔드는 `/api` 요청을 `localhost:5000`으로 자동 프록시합니다.

---

## 📖 How to Use

### 일반 사용자

1. `http://localhost:3000` 접속
2. 카테고리 필터 또는 검색창으로 게임 탐색
3. 게임 카드 클릭 → iframe 미리보기 또는 외부 링크로 플레이

> [스크린샷: 갤러리 메인 화면]

### 관리자

어드민 페이지는 URL을 직접 입력해 접근합니다 (헤더에 노출되지 않음).

```
http://localhost:3000/#/secret-admin
```

1. 관리자 계정으로 로그인
2. 게임 추가 / 수정 / 삭제
3. 유저 목록 및 권한 관리

> [스크린샷: 어드민 패널 화면]

---

## 🔌 API Endpoints

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| `GET` | `/api/games` | 게임 목록 조회 (검색·카테고리 필터) | ✗ |
| `GET` | `/api/games/:id` | 게임 단건 조회 | ✗ |
| `POST` | `/api/games` | 게임 등록 | ✅ Admin |
| `PUT` | `/api/games/:id` | 게임 수정 | ✅ Admin |
| `DELETE` | `/api/games/:id` | 게임 삭제 | ✅ Admin |
| `POST` | `/api/auth/login` | 로그인 (JWT 발급) | ✗ |
| `GET` | `/api/auth/me` | 현재 유저 정보 | ✅ |
| `GET` | `/api/auth/users` | 유저 목록 조회 | ✅ Admin |
| `PATCH` | `/api/auth/users/:id/role` | 유저 권한 변경 | ✅ Admin |

### Query Parameters (`GET /api/games`)

```
?search=tetris        # 제목 검색
?category=퍼즐        # 카테고리 필터
```

---

## 🗂️ Categories

| 값 | 설명 |
|----|------|
| `액션` | 아케이드, 반응형 게임 |
| `퍼즐` | 두뇌 게임, 논리 퍼즐 |
| `RPG` | 역할극, 어드벤처 |
| `스포츠` | 스포츠 시뮬레이션 |
| `파티` | 멀티플레이, 파티 게임 |
| `기타` | 음악, 도구, 기타 |

---

## 🎮 Sample Games (Seed Data)

DB 초기화 시 아래 게임이 자동으로 삽입됩니다.

| 제목 | 카테고리 |
|------|----------|
| 플래피 버드 | 액션 |
| 2048 | 퍼즐 |
| 스네이크 게임 | 액션 |
| 테트리스 | 퍼즐 |
| 팩맨 | 액션 |

---

## 🚢 Deployment

### 환경 변수

프로덕션 환경에서는 다음 환경 변수를 설정하세요.

```bash
# backend/.env
JWT_SECRET=your-secret-key-here
PORT=5000
```

### 일반 서버 배포

```bash
# 프론트엔드 빌드
cd frontend && npm run build
# dist/ 폴더를 Nginx 등 정적 서버로 서빙

# 백엔드 실행 (PM2 권장)
npm install -g pm2
cd backend && pm2 start server.js --name "game-gallery-api"
```

### Docker (선택)

```dockerfile
# [Dockerfile 예시 — 직접 구성 필요]
```

> Nginx reverse proxy 설정 시 `/api` 경로를 `localhost:5000`으로 프록시하도록 구성하세요.

---

## 🔧 Troubleshooting

<details>
<summary><strong>better-sqlite3 빌드 오류</strong></summary>

```bash
npm install --build-from-source
# 또는 Python / node-gyp 설치 후 재시도
npm install -g node-gyp
```

</details>

<details>
<summary><strong>포트 충돌 (EADDRINUSE)</strong></summary>

```bash
# 사용 중인 프로세스 종료
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

</details>

<details>
<summary><strong>프론트엔드에서 API 연결 실패</strong></summary>

`frontend/vite.config.js`의 프록시 설정을 확인하세요.

```js
proxy: {
  '/api': { target: 'http://localhost:5000', changeOrigin: true }
}
```

</details>

<details>
<summary><strong>DB 초기화 / 재설정</strong></summary>

```bash
cd backend
rm games.db
node server.js   # 재실행 시 DB 및 시드 데이터 자동 생성
```

</details>

---

## 💡 Roadmap

- [ ] 게임 즐겨찾기 / 평점 기능
- [ ] 태그 기반 검색 및 필터
- [ ] 다크/라이트 테마 전환
- [ ] 게임 플레이 통계 (조회수, 클릭수)
- [ ] OAuth 소셜 로그인
- [ ] 게임 썸네일 자동 크롤링

---

## 📄 License

[MIT](./LICENSE) © [your-name]
