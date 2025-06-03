# Real-time Task Manager

This project contains a simple Node.js/React application for managing tasks in real time.

- `server/` – Express API with PostgreSQL and Socket.IO.
- `client/` – React single page application using CDN builds.

## Usage

1. Set up PostgreSQL and create the tables using `server/schema.sql`.
2. Configure environment variables based on `server/.env.example`.
3. Install server dependencies and start the backend:
   ```bash
   cd server
   npm install
   npm start
   ```
4. Open `client/index.html` in a browser.
