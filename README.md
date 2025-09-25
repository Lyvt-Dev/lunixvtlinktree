# Community Lounge Backend Setup

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

   Server läuft anschließend auf `http://localhost:3000`.

## API Endpunkte
- `GET /api/comments`
  - Liefert alle Kommentare aus `data/comments.json`.
- `POST /api/comments`
  - Erwartet JSON: `{ text, displayName, avatar, timestamp? }`
  - Speichert den Kommentar in `data/comments.json`.

## Frontend Nutzung
- Passe `api.commentsEndpoint` in `assets/javascript/config.js` an (z. B. für Deployment-URL).
- Backend (`server.js`) muss laufen, damit Kommentare geladen/gespeichert werden können.

## Datenablage
- Kommentare liegen in `data/comments.json`.
- Datei wird beim ersten Start automatisch angelegt.
