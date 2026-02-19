# 🎬 CineVerse — Movie Browser

A modern movie browsing app built with React, Redux-Saga, and the TMDB API.

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd movie-browser
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up your API key

Create a `.env` file in the root of the project:
```bash
cp .env.example .env
```

Then open `.env` and replace the placeholder with your real TMDB API key:
```
VITE_TMDB_API_KEY=your_actual_api_key_here
```

> Get a free API key at: https://www.themoviedb.org/settings/api

### 4. Start the development server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎮 Keyboard Navigation

| Key          | Action                          |
|--------------|---------------------------------|
| `Arrow Keys` | Navigate between movie cards    |
| `Enter`      | Open focused movie details      |
| `Escape`     | Go back from detail page        |
| `Tab`        | Disabled (no action)            |

> Mouse scrolling is disabled. Use keyboard arrows to navigate the grid.

---

## ✨ Features

- 🔥 Browse **Popular** movies
- 📡 Browse **Airing Now** movies
- 💙 **Favorites** — saved to localStorage
- 🔍 **Search** with 500ms debounce and rate limiting (5 req/10s)
- 📄 **Pagination** for all tabs including search
- 🎬 **Movie Detail Page** with full info and add/remove favorites
- ⌨️ Full **keyboard navigation** (arrow keys, Enter, Escape)

---

## 🛠 Tech Stack

- **React 18** + **Vite**
- **Redux Toolkit** + **Redux-Saga**
- **React Router v6**
- **CSS Modules** (per component)
- **TMDB API**

---

## 📁 Project Structure

```
src/
├── api/            — TMDB API config & helpers
├── components/     — Reusable UI components (each with .jsx + .module.css)
├── pages/          — Page-level components
├── store/          — Redux store, slices, sagas
├── hooks/          — Custom React hooks
└── utils/          — localStorage, rate limiter utilities
```
