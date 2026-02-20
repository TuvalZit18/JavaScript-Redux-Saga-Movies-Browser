<div align="center">

# 🎬 Zman Masach | זמן מסך

### Time Screen — A keyboard-first movie browser powered by TMDB

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Redux](https://img.shields.io/badge/Redux_Toolkit-1.9-764ABC?style=for-the-badge&logo=redux&logoColor=white)
![Redux Saga](https://img.shields.io/badge/Redux_Saga-1.2-999999?style=for-the-badge&logo=redux-saga&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-6-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![CSS Modules](https://img.shields.io/badge/CSS_Modules-✓-000000?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![TMDB](https://img.shields.io/badge/TMDB_API-v3-01B4E4?style=for-the-badge&logo=themoviedatabase&logoColor=white)

</div>

---

## 📋 Overview

Zman Masach (זמן מסך — Hebrew for "Screen Time") is a single-page movie browser built with React + Redux-Saga. It features a fully keyboard-driven navigation system, real-time search with rate limiting, and a favorites system backed by localStorage. Mouse scrolling is intentionally disabled — all navigation is done via keyboard.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A free TMDB API key from [themoviedb.org](https://www.themoviedb.org/settings/api)

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd movie-browser

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env

# 4. Add your TMDB API key to .env
VITE_TMDB_API_KEY=your_api_key_here

# 5. Start the development server
npm run dev
```

---

## ⌨️ Keyboard Navigation Guide

> **Important:** Mouse scrolling is disabled by design. All navigation is keyboard-only.

### Focus Contexts

The app has 4 focus contexts that form a vertical flow. The **active context glows** with a turquoise border so you always know where you are.

```
┌─────────────────────────────────┐
│         🔍 SEARCH BAR           │  ← Type to search
└─────────────────────────────────┘
              ↕  ↑↓
┌─────────────────────────────────┐
│      🗂️  FILTER TABS            │  ← Popular / Airing Now / Favorites
└─────────────────────────────────┘
              ↕  ↑↓
┌─────────────────────────────────┐
│       🎬 MOVIE GRID             │  ← Browse movies
└─────────────────────────────────┘
              ↕  ↑↓
┌─────────────────────────────────┐
│      📄 PAGINATION              │  ← Navigate pages
└─────────────────────────────────┘
```

### On App Start

**The app starts with focus on the Filter Tabs.** You can immediately use `←` `→` to switch between Popular, Airing Now, and Favorites, or press `↓` to enter the movie grid.

---

### 🔍 Search Bar

| Key      | Action                               |
| -------- | ------------------------------------ |
| `Click`  | Activate search context              |
| `↓`      | Move focus down to Filter Tabs       |
| `Escape` | Clear search + return to Filter Tabs |

> Search triggers after **2+ characters** with a **500ms debounce**. Rate limited to **5 requests per 10 seconds**. On the Favorites tab, search filters locally with no API call.

---

### 🗂️ Filter Tabs

| Key     | Action                                      |
| ------- | ------------------------------------------- |
| `←` `→` | Move highlight between tabs                 |
| `Enter` | Confirm highlighted tab → fetch immediately |
| `↑`     | Move up to Search Bar                       |
| `↓`     | Move down to Movie Grid                     |

> Navigating to a tab with arrow keys starts a **2-second timer** — if you stay on it, the request fires automatically. Pressing `Enter` confirms immediately.

---

### 🎬 Movie Grid

| Key     | Action                                            |
| ------- | ------------------------------------------------- |
| `←` `→` | Move between cards in a row                       |
| `↑`     | Move up one row (first row → back to Filter Tabs) |
| `↓`     | Move down one row (last row → go to Pagination)   |
| `Enter` | Open movie detail page                            |

> The focused card is highlighted with a turquoise glow.

---

### 📄 Pagination

| Key     | Action                                             |
| ------- | -------------------------------------------------- |
| `←` `→` | Move highlight between page numbers (no fetch yet) |
| `Enter` | Confirm selected page → fetch                      |
| `↑`     | Return to Movie Grid                               |

> Highlighting a page does **not** load it immediately — press `Enter` to confirm. This prevents accidental page loads when navigating through numbers.

---

### 🎬 Movie Detail Page

| Key      | Action                |
| -------- | --------------------- |
| `Escape` | Go back to movie grid |

---

## 🏗️ Architecture

### Tech Stack

| Layer              | Technology               |
| ------------------ | ------------------------ |
| UI Framework       | React 18                 |
| State Management   | Redux Toolkit            |
| Async Side Effects | Redux-Saga               |
| Routing            | React Router v6          |
| Styling            | CSS Modules              |
| Build Tool         | Vite                     |
| API                | TMDB v3                  |
| Persistence        | localStorage (favorites) |

### State Flow

```
Component dispatches action (e.g. fetchPopularRequest)
  → Redux Toolkit slice: sets loading = true  (synchronous)
  → Redux-Saga intercepts via takeLatest
      → Calls TMDB API
      → On success: dispatches fetchPopularSuccess
      → On failure: dispatches fetchPopularFailure
  → Redux Toolkit slice: updates movies[], loading = false  (synchronous)
  → Component re-renders with new data
```

### Key Design Decisions

- **`takeLatest`** in sagas — cancels previous in-flight requests on new dispatch, preventing race conditions
- **`thunk: false`** in store — thunks explicitly disabled, sagas are the only async mechanism
- **`focusContext`** state in `App.jsx` — single source of truth for which UI section owns keyboard input
- **300ms cooldown guard** on every context switch — prevents queued keypresses from bleeding into the new context
- **TMDB page cap at 500** — prevents HTTP 400 errors on high page numbers
- **Rate limiter** (`utils/rateLimiter.js`) — sliding window, max 5 search requests per 10 seconds
- **`memo` + `useCallback` + `useMemo`** throughout — minimizes unnecessary re-renders
- **Lazy loaded pages** via `React.lazy + Suspense` — faster initial load

### Project Structure

```
src/
├── api/
│   └── tmdb.js                 # TMDB API config + fetch helpers
├── components/
│   ├── FilterTabs/             # Category tabs with sliding bubble indicator
│   ├── Footer/                 # App footer
│   ├── Header/                 # App header
│   ├── MovieCard/              # Individual movie card with hover effects
│   ├── MovieGrid/              # 4-column responsive grid
│   ├── Pagination/             # Page navigation with keyboard support
│   └── SearchBar/              # Debounced search input
├── hooks/
│   └── useKeyboardNavigation.js # Grid arrow key navigation hook
├── pages/
│   ├── HomePage/               # Main grid page
│   └── MovieDetailPage/        # Full movie detail view
├── store/
│   ├── sagas/
│   │   ├── moviesSaga.js       # All async API calls via Redux-Saga
│   │   └── rootSaga.js         # Combines all sagas
│   ├── slices/
│   │   ├── favoritesSlice.js   # Favorites state + localStorage sync
│   │   └── moviesSlice.js      # Movies, search, pagination state
│   └── store.js                # Redux store with saga middleware
└── utils/
    ├── localStorage.js         # localStorage read/write helpers
    └── rateLimiter.js          # Sliding window rate limiter
```

---

## ✅ Requirements Checklist

- [x] Display popular movies on homepage
- [x] Filter by Popular, Airing Now, Favorites
- [x] Search input with 2+ character minimum
- [x] 500ms debounce on search
- [x] Rate limiting: 5 requests / 10 seconds
- [x] Pagination for Popular and Airing Now
- [x] Movie detail page (in-app, not new tab)
- [x] Add/Remove favorites on detail page
- [x] Favorites stored in localStorage
- [x] Tab key disabled globally
- [x] Mouse scrolling disabled (CSS + JS)
- [x] 4 cards per row
- [x] Category switch: click = immediate, focus = 2s delay
- [x] Full keyboard navigation (arrows, Enter, Escape)
- [x] React + Redux-Saga

---

## 🔑 Environment Variables

```env
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

Get your free API key at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)

---

<div align="center">

## 👤 Author

**Tuval Zitelbach**

[![GitHub](https://img.shields.io/badge/GitHub-your--username-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/your-username)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-your--profile-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/your-profile)

---

Powered by [TMDB](https://www.themoviedb.org/) &nbsp;·&nbsp; Built by Tuval Zitelbach &nbsp;·&nbsp; זמן מסך

</div>
