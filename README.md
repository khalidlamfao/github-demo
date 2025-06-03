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
4. Visit `http://localhost:3001/` in your browser.
5. The client HTML loads Babel from https://unpkg.com, so an internet connection is required.

## Docker Setup

You can also run the database and server using Docker Compose. This will start a
PostgreSQL container initialized with `server/schema.sql` and launch the Node.js
API connected to it.

```bash
docker-compose up
```

The application will be available on `http://localhost:3001` and will use the database
defined in the `db` service.
