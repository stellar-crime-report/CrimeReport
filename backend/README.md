# CrimeReport Backend

## Setup

1. Install dependencies:
   ```sh
   npm install
   ```

2. Create a `.env` file in the backend directory with the following content:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/crimereport
   PORT=5000
   ```
   Replace `username`, `password`, and `crimereport` with your PostgreSQL credentials and database name.

3. Start the server:
   ```sh
   npm run dev
   ```
   Or, if you don't have nodemon:
   ```sh
   node index.js
   ```

## Endpoints
- `GET /` - Test route
- `GET /api/reports` - Get all crime reports (requires `crime_reports` table in your database) 