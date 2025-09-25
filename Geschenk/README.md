# Community Lounge Backend Setup (SQLite)

## Voraussetzungen
- Node.js 18+
- npm oder yarn

## Installation
1. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

2. **Backend starten**
   ```bash
   npm start
   ```

   Der Server läuft anschließend auf `http://localhost:3000` und erzeugt bei Bedarf `data/comments.db`.

## API Endpunkte
- `GET /api/comments`
  - Liefert alle Kommentare aus der SQLite-Tabelle `comments`.
- `POST /api/comments`
  - Erwartet JSON `{ text, displayName, avatar, timestamp? }` und legt einen Datensatz in `comments` ab.

## Datenbank
- Datei: `data/comments.db`
- Tabelle `comments` wird automatisch angelegt (`id`, `text`, `display_name`, `avatar`, `created_at`).
- Zum manuellen Prüfen kannst du z. B. `sqlite3 data/comments.db "SELECT * FROM comments;"` verwenden.

## Frontend Nutzung
- Passe `api.commentsEndpoint` in `assets/javascript/config.js` an (z. B. für Deployment-URL oder Tunnel-URL).
- Backend (`server.js`) muss laufen, damit Kommentare geladen/gespeichert werden können.
