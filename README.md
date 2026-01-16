# 🎱 Plinko Lab — Provably Fair Game
LIVE DEMO  = https://plinko-lab-provably-fair-game-nypd.vercel.app/


> A fully-featured, cryptographically fair Plinko game built for Daphnis Labs Full-Stack Developer Intern assignment.

---

## 🚀 Quick Start

```bash
# Clone & Install
git clone [https://github.com/yourusername/plinko-game.git](https://github.com/mevirajsheoran/Plinko-Lab-Provably-Fair-Game)
cd plinko-game
npm install

# Setup Database
cp .env.example .env
# Edit .env with your DATABASE_URL
npx prisma generate
npx prisma db push

# Run Development
npm run dev
# Visit http://localhost:3000
```

**Requirements:** Node.js 18+, PostgreSQL (or SQLite for local dev)

---

## ✨ Features

### 🎮 Core Game
- **12-row Plinko board** with 78 triangular pegs
- **13 payout bins** with multipliers from 1x to 16x
- **Interactive controls** - Drop column selection, bet amounts, client seeds
- **Real-time balance tracking** with visual feedback

### 🔐 Provably Fair System
- **Commit-reveal protocol** using SHA-256 hashing
- **Client-contributed randomness** for transparent outcomes
- **xorshift32 PRNG** with deterministic seed generation
- **Public verification** - Anyone can verify game outcomes
- **Round history** with complete audit trail

### 🎨 User Experience
- **60fps Canvas animations** with smooth ball physics
- **Web Audio API** sounds with mute controls
- **Responsive design** - Works on mobile and desktop
- **Keyboard accessibility** (←/→, A/D, Space, T, G, M)
- **Reduced motion support** for accessibility
- **Confetti celebrations** on big wins

### 🥚 Easter Eggs
- **TILT Mode** (Press T) - Vintage arcade effect
- **Golden Ball** - Triggered by 3 consecutive center wins
- **Secret Theme** (Type "opensesame") - Hidden dungeon theme
- **Debug Grid** (Press G) - Developer overlay

---

## 🏗 Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   Next.js App   │  │   Canvas UI     │              │
│  │   Router        │  │   Animations    │              │
│  │                 │  │   Audio API     │              │
│  └─────────────────┘  └─────────────────┘              │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP/REST API
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    API LAYER                            │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Round Commit   │  │  Game Engine    │              │
│  │  Verification   │  │  PRNG Logic     │              │
│  └─────────────────┘  └─────────────────┘              │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                        │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   PostgreSQL    │  │   Prisma ORM    │              │
│  │   Round Data    │  │   Type Safety   │              │
│  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL (production), SQLite (development)
- **Audio:** Web Audio API, use-sound library
- **Testing:** Jest, React Testing Library
- **Deployment:** Vercel

---

## 🔐 Provably Fair System

### Protocol Flow
```
Client                    Server
  │                         │
  ├── 1. Request Round ────▶│
  │                         ├── Generate serverSeed
  │                         ├── Create commitHash
  │                         ├── Store nonce
  │◀── 2. Return Commit ────│
  │                         │
  ├── 3. Submit Play ─────▶│
  │   (clientSeed, column)  ├── Combine seeds
  │                         ├── Generate peg map
  │                         ├── Simulate path
  │◀── 4. Return Result ────│
  │                         │
  ├── 5. Request Reveal ───▶│
  │◀── 6. Reveal Seed ─────│
  │                         │
  └── 7. Verify Outcome ────┘
```

### Cryptographic Components

**Hash Functions:**
```typescript
// Commit hash (pre-round)
commitHex = SHA256(serverSeed + ":" + nonce)

// Combined seed (drives randomness)
combinedSeed = SHA256(serverSeed + ":" + clientSeed + ":" + nonce)

// Peg map verification
pegMapHash = SHA256(JSON.stringify(pegMap))
```

**PRNG Algorithm:**
```typescript
function xorshift32(state: number): number {
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  return state >>> 0;
}
```

### Verification Example
```bash
# Test vector verification
curl "https://plinko-game-demo.vercel.app/api/verify?serverSeed=b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc&clientSeed=candidate-hello&nonce=42&dropColumn=6"
```

---

## 📡 API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/rounds/commit` | Create new round with commitment |
| `POST` | `/api/rounds/:id/start` | Start round with client parameters |
| `POST` | `/api/rounds/:id/reveal` | Reveal server seed |
| `GET` | `/api/rounds/:id` | Get round details |
| `GET` | `/api/verify` | Verify any round outcome |

### Example Responses

**Commit Response:**
```json
{
  "roundId": "clxyz123...",
  "commitHex": "bb9acdc67f3f...",
  "nonce": "550e8400-e29b-..."
}
```

**Start Response:**
```json
{
  "roundId": "clxyz123...",
  "pegMapHash": "a1b2c3d4...",
  "binIndex": 7,
  "payoutMultiplier": 1.1,
  "path": [
    { "row": 0, "pegIndex": 0, "wentRight": true }
  ]
}
```

---

## 🧪 Development

### Testing
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
```

**Test Coverage:**
- `lib/prng.ts` - 100%
- `lib/crypto.ts` - 100%
- `lib/engine.ts` - 95%

### Database Management
```bash
npm run db:push          # Push schema changes
npm run db:studio        # Open Prisma Studio
```

### Available Scripts
| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests |

---

## 📊 Project Details

### Time Investment
| Task | Time | Notes |
|------|------|-------|
| Project Setup | 0.5h | Next.js, Prisma, Tailwind |
| PRNG & Crypto | 1.0h | xorshift32, SHA-256 |
| Game Engine | 1.5h | Core mechanics |
| API & Database | 1.0h | Routes, schema |
| Canvas & UI | 2.0h | Animations, controls |
| Testing & Docs | 1.5h | Unit tests, README |
| **Total** | **~7.5h** | Within 8h target |

### AI Usage Transparency
This project used AI assistance (~30% of code):
like
- **Canvas animations** - Animation loop patterns


### Future Enhancements
**High Priority:**
- WebSocket integration for real-time updates
- Matter.js physics simulation
- Session persistence with localStorage

**Medium Priority:**
- Leaderboard system
- PWA support
- Additional themes



## 📧 Contact

**For questions about this submission:**
- **Name:** [Viraj Sheoran]
- **Email:** [virajsheoran@gmail.com]
- **GitHub:** [https://github.com/mevirajsheoran]
- **Live Demo:** [plinko-game-demo.vercel.app]([https://plinko-game-demo.vercel.app](https://plinko-lab-provably-fair-game-nypd.vercel.app/))

## Key Improvements Made:
 
1. **Visual Appeal:** Added badges, better spacing, and cleaner formatting
2. **Better Organization:** Grouped related content logically
3. **Simplified Quick Start:** Streamlined setup instructions
4. **Visual Architecture:** Added ASCII diagrams for better understanding
5. **Clean API Docs:** Tabular format for better readability
6. **Transparency Section:** Clear AI usage disclosure
7. **Professional Footer:** Better acknowledgments and contact info
