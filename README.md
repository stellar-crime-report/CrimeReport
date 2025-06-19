# CrimeReport

CrimeReport is a web application that allows users to report and view crime incidents on an interactive map. Users can mark locations, provide details about incidents, and view all reports in their area.

## Project Structure

```
crimeReport/
  ├── backend/      # Node.js + Express + PostgreSQL
  └── frontend/     # React app
```

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- PostgreSQL

### Setup

#### 1. Backend
```
cd backend
npm install
# Configure your PostgreSQL connection in .env
npm run dev
```

#### 2. Frontend
```
cd frontend
npm install
npm start
```

---

## Features
- Interactive map for reporting/viewing crimes
- Form to submit crime details (type, description, time)
- All markers visible to all users
- Marker clustering/counting for overlapping reports

---

## License
MIT 