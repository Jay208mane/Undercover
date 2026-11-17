# 🕵️ Undercover

A web-based social deduction party game supporting 3-20 players.

## Tech Stack

| Layer    | Stack                                         |
| -------- | --------------------------------------------- |
| Frontend | React 19 · Vite 6 · TypeScript 5 · Tailwind 4 |
| Backend  | Node.js · Express · Socket.IO · TypeScript    |
| Database | MongoDB · Mongoose                            |
| Shared   | Shared types / constants package              |

---

## Prerequisites

- Node.js **≥ 18** (tested on v24)
- npm **≥ 9**
- MongoDB running locally (or set `MONGODB_URI` in `.env`)

---

## Setup

### 1. Clone / enter the project

```bash
cd Undercover
```

### 2. Create `.env` from the example

```bash
copy .env.example .env     # Windows
# or
cp .env.example .env       # macOS / Linux
```

Edit `.env` and change `JWT_SECRET` to a long random string before deploying.

### 3. Install all dependencies

```bash
npm install
```

---

## Running the application

### Development (both frontend + backend together)

```bash
npm run dev
```

| Service  | URL                              |
| -------- | -------------------------------- |
| Frontend | http://localhost:5173            |
| Backend  | http://localhost:4000            |
| Health   | http://localhost:4000/api/health |

### Run separately

```bash
npm run dev:client   # Frontend only  → http://localhost:5173
npm run dev:server   # Backend only   → http://localhost:4000
```

---

## Build for production

```bash
npm run build
```

Output:

- `client/dist/` — static frontend (serve with nginx / Vercel / etc.)
- `server/dist/` — compiled Node.js server

---

## Project structure

```
Undercover/
├── client/          React + Vite frontend
│   └── src/
│       ├── game/    Shared game engine (pure TS)
│       ├── pages/   Route-level screens
│       ├── hooks/   Custom React hooks
│       └── styles/  Global CSS + design tokens
├── server/          Node.js + Express + Socket.IO backend
│   └── src/
│       ├── game/    Server-side game logic
│       ├── models/  Mongoose schemas
│       ├── routes/  REST endpoints
│       └── sockets/ Socket.IO event handlers
├── shared/          Types + constants used by both
└── docs/            Design docs, API reference
```

---

## Game roles

| Role      | Sees         | Knows their role? |
| --------- | ------------ | ----------------- |
| Civilian  | Common word  | ✅ Yes            |
| Imposter  | Similar word | ❌ No — hidden    |
| Mr. White | Nothing      | ✅ Yes            |

> **Important:** The Imposter is **never told** they are the Imposter.
> The server holds actual roles. Only a `PlayerView` (word + optional label) is sent per socket.

## Single-device voting

After discussion, the group selects one active player on the shared screen for elimination. No individual ballots or vote totals are recorded. If the group cannot decide, it can return to the same discussion round without eliminating anyone.

## Single-device mode

The local game supports 3-20 players, configurable Imposter counts, optional Mr. White, English/Marathi/Hindi word sets, custom word pairs, and a configurable discussion timer. Players privately pick one shuffled face-down card; only the selected player's information is revealed, and tapping the screen hides it before the next pick.

The game proceeds through discussion, shared elimination, role reveal, and (for Mr. White) a secret-word guess. Established faction win conditions are checked first. If exactly two players remain with no established winner, Civilians win. An eliminated Mr. White still gets the chance to guess before a normal ending is evaluated.

### Multilingual word bank

The shared word bank is maintained in [`shared/data/wordPairs.ts`](./shared/data/wordPairs.ts) and re-exported from `client/src/data/wordPairs.ts`. It contains 250 related pairs with English, Marathi, and Hindi words. The requested category counts are Food and Drinks (35), Animals and Birds (25), Countries and Places (25), Household Objects (30), Technology and Gadgets (25), Movies and Entertainment (25), Sports and Games (25), Professions (20), Nature and Geography (20), and Random and Funny (20).

The selected category is a preference for the first pair. Every non-custom game then shuffles the remaining pairs across all categories, so no pair repeats until the full 250-pair cycle is exhausted. A new game starts a fresh cycle; custom word pairs continue to use the supplied pair. The online game advances the same cycle on the server and sends each player's updated word privately.

To add pairs, append rows to the `rows` table in `shared/data/wordPairs.ts` with a unique ID, category slug, and natural civilian/undercover words in all three languages. Update `WORD_PAIR_CATEGORY_COUNTS` in `shared/data/wordPairsValidation.ts` whenever a category's target count changes. Run `npm run validate:words` to check the total, category counts, translations, unique IDs/terms, and duplicate or reversed pairs.

### Local scoring and leaderboards

Only members of the winning role receive points:

- Civilians: 2 points per Civilian.
- Imposters: twice the starting number of Civilians per Imposter.
- Mr. White: twice the starting player count for Mr. White.

The all-time and current-game leaderboards are stored in the browser's local storage. A new game starts a fresh current-game board; all-time scores persist until reset. Group voting does not record individual votes or vote statistics.

---

## Development phases

- [x] Phase 1 — Foundation (this build)
- [x] Phase 2 — Mobile UI foundation
- [x] Phase 3 — Single-device game: private card picking, discussion timer, group elimination, Mr. White guess, results, scoring, leaderboards, and English/Marathi/Hindi UI
- [ ] Phase 4 — Online multiplayer (Socket.IO rooms)
- [ ] Phase 5 — Spectator and voice chat
- [ ] Phase 6 — Additional polish and broader platform testing

---

## Available scripts

| Command                  | Description                     |
| ------------------------ | ------------------------------- |
| `npm run dev`            | Start both client + server      |
| `npm run dev:client`     | Frontend only                   |
| `npm run dev:server`     | Backend only                    |
| `npm run build`          | Production build (both)         |
| `npm run lint`           | Lint all workspaces             |
| `npm run format`         | Prettier format all files       |
| `npm test`               | Run tests (all workspaces)      |
| `npm run validate:words` | Validate multilingual word data |
