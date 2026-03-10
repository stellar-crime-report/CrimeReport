# 🛰️ CrimeReport

> **Civic tech that fights back.** Report crimes, visualize danger zones, and protect your community — powered by open-source and the Stellar blockchain.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![OnlyDust](https://img.shields.io/badge/OnlyDust-ODHack14-blueviolet)](https://app.onlydust.com)
[![Stellar](https://img.shields.io/badge/Stellar-Soroban-0E76FD?logo=stellar)](https://stellar.org)
[![Drips Wave](https://img.shields.io/badge/Drips-Stellar%20Wave-00c2cb)](https://www.drips.network/wave/stellar)

---

## 📍 What is CrimeReport?

**CrimeReport** is an open-source civic tech platform that empowers communities to anonymously report, track, and visualize local crime incidents on a live map. Each report is pinned to a real location with a red-flag marker, giving residents and authorities a bird's-eye view of danger zones in real time.

Built for the streets. Powered by the people. Rewarded on Stellar.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **Live Crime Map** | Interactive map with geolocated red-flag markers for each incident |
| 📝 **Anonymous Reporting** | Submit reports without revealing your identity |
| 🔔 **Real-time Updates** | Crime pins appear on the map as reports come in |
| 📊 **Crime Aggregation** | Cluster nearby incidents into hotspot zones |
| 🔐 **Stellar Identity** | Optional reporter reputation via Stellar accounts |
| 💰 **XLM Rewards** *(coming soon)* | Earn XLM for verified, high-quality reports via Soroban smart contracts |
| 📡 **Public API** | Query crime data by location, type, and time range |

---

## 🧰 Tech Stack

### Frontend
- **React.js / Next.js** — UI framework
- **Leaflet.js** — Interactive map rendering
- **TailwindCSS** — Styling

### Backend
- **Node.js / NestJS** — REST API
- **PostgreSQL + PostGIS** — Geospatial crime data storage
- **MongoDB** *(alternative)* — Document-based report storage

### Blockchain
- **Stellar / Soroban** — Smart contracts for reward distribution
- **Stellar SDK** — Wallet integration and XLM transactions

### Infrastructure
- **Vercel** — Frontend deployment
- **Railway** — Backend deployment
- **Supabase** — Managed PostgreSQL + Auth

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn
- PostgreSQL with PostGIS extension
- A free [Stellar testnet account](https://laboratory.stellar.org/#account-creator?network=test)

### 1. Clone the Repository

```bash
git clone https://github.com/stellar-crime-report/CrimeReport.git
cd CrimeReport
```

### 2. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/crimereport

# Map
NEXT_PUBLIC_MAP_API_KEY=your_google_maps_or_mapbox_key

# Stellar
STELLAR_NETWORK=testnet
STELLAR_SECRET_KEY=your_stellar_secret_key
SOROBAN_CONTRACT_ID=your_deployed_contract_id
```

### 4. Run the App

```bash
# Start backend
cd backend && npm run start:dev

# Start frontend (new terminal)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the live crime map. 🗺️

---

## 🗂️ Project Structure

```
CrimeReport/
├── frontend/               # Next.js + React app
│   ├── components/         # Map, ReportForm, CrimePin, etc.
│   ├── pages/              # Next.js routes
│   └── styles/             # TailwindCSS config
├── backend/                # NestJS REST API
│   ├── src/
│   │   ├── reports/        # Crime report CRUD endpoints
│   │   ├── auth/           # Anonymous auth + Stellar wallet auth
│   │   └── map/            # Geospatial query logic
├── contracts/              # Soroban smart contracts (Rust)
│   └── reward/             # XLM reward distribution contract
├── docs/                   # Technical documentation
└── README.md
```

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports` | List all crime reports |
| `POST` | `/reports` | Submit a new report |
| `GET` | `/reports/:id` | Get a single report |
| `GET` | `/reports/nearby?lat=&lng=&radius=` | Get reports near a location |
| `GET` | `/reports/hotspots` | Get clustered crime hotspots |

---

## 🤝 Contributing

We welcome contributions from developers, designers, writers, and civic tech enthusiasts of all experience levels.

👉 Read [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

Active issues are labeled and ready to pick up:
- [`good first issue`](../../issues?q=label%3A%22good+first+issue%22) — great for newcomers
- [`help wanted`](../../issues?q=label%3A%22help+wanted%22) — open for anyone
- [`stellar`](../../issues?q=label%3Astellar) — blockchain / Soroban tasks

---

## 🌊 Drips Stellar Wave

This project is participating in the **[Drips Stellar Wave Program](https://www.drips.network/wave/stellar)** — a monthly open-source contribution cycle where contributors earn XLM rewards for merged PRs.

**How to earn:**
1. Browse open issues tagged `wave`
2. Comment to claim an issue
3. Submit a PR that gets merged
4. Earn points → earn real rewards 💸

---

## 🗺️ Roadmap

- [x] Anonymous crime reporting with geolocation
- [x] Live map with red-flag markers
- [ ] Soroban smart contract for XLM reporter rewards
- [ ] Stellar wallet login (Freighter / LOBSTR)
- [ ] Mobile app (React Native)
- [ ] AI-powered crime pattern detection
- [ ] Multi-language support
- [ ] Admin moderation dashboard

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

## 💬 Community

| Platform | Link |
|----------|------|
| 🐦 Twitter/X | [@CrimeReportApp](https://twitter.com) |
| 💬 Discord | [Join our server](https://discord.gg) |
| 🐛 Issues | [GitHub Issues](../../issues) |

---

<p align="center">
  Built with ❤️ for safer communities · Powered by <a href="https://stellar.org">Stellar</a> · Open on <a href="https://github.com/stellar-crime-report/CrimeReport">GitHub</a>
</p>
