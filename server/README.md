# Task Manager Backend

Node.js Express API for user authentication and task management with PostgreSQL and Socket.IO for real time updates.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and update connection settings.
3. Run database migrations using `schema.sql`.
4. Start the server:
   ```bash
   npm start
   ```

### Docker

Une configuration Docker Compose est disponible à la racine du projet pour
exécuter PostgreSQL et l'API ensemble :

```bash
docker-compose up
```

L'application Node se connectera automatiquement au service `db` défini dans ce
fichier.
