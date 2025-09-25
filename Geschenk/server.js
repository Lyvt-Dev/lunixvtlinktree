const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "comments.db");

let db;

app.use(cors());
app.use(express.json());

async function initializeDatabase() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  return new Promise((resolve, reject) => {
    const database = new sqlite3.Database(DB_FILE, (error) => {
      if (error) {
        reject(error);
        return;
      }

      const createTableSql = `
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          text TEXT NOT NULL,
          display_name TEXT NOT NULL,
          avatar TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `;

      database.run(createTableSql, (runError) => {
        if (runError) {
          database.close(() => reject(runError));
          return;
        }
        resolve(database);
      });
    });
  });
}

const fetchComments = () =>
  new Promise((resolve, reject) => {
    db.all(
      `SELECT id, text, display_name AS displayName, avatar, created_at AS timestamp
       FROM comments
       ORDER BY datetime(created_at) DESC`,
      (error, rows) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(
          rows.map((row) => ({
            id: row.id,
            text: row.text,
            displayName: row.displayName,
            avatar: row.avatar,
            timestamp: row.timestamp,
          }))
        );
      }
    );
  });

const insertComment = ({ text, displayName, avatar, timestamp }) =>
  new Promise((resolve, reject) => {
    const trimmedText = String(text).trim();
    const trimmedName = String(displayName).trim();
    const trimmedAvatar = String(avatar).trim();

    const createdAt = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();

    const sql = `INSERT INTO comments (text, display_name, avatar, created_at) VALUES (?, ?, ?, ?)`;
    const params = [trimmedText, trimmedName, trimmedAvatar, createdAt];

    db.run(sql, params, function (error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        id: this.lastID,
        text: trimmedText,
        displayName: trimmedName,
        avatar: trimmedAvatar,
        timestamp: createdAt,
      });
    });
  });

app.get("/api/comments", async (_req, res) => {
  try {
    const comments = await fetchComments();
    res.json(comments);
  } catch (error) {
    console.error("Fehler beim Lesen der Kommentare", error);
    res.status(500).json({ message: "Kommentare konnten nicht geladen werden." });
  }
});

app.post("/api/comments", async (req, res) => {
  try {
    const { text, displayName, avatar, timestamp } = req.body || {};

    if (!text || !displayName || !avatar) {
      return res
        .status(400)
        .json({ message: "Es fehlen Informationen für den Kommentar." });
    }

    const newEntry = await insertComment({ text, displayName, avatar, timestamp });

    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Fehler beim Speichern eines Kommentars", error);
    res.status(500).json({ message: "Kommentar konnte nicht gespeichert werden." });
  }
});

initializeDatabase()
  .then((database) => {
    db = database;
    app.listen(PORT, () => {
      console.log(`Community Lounge API läuft auf Port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Initialisierung fehlgeschlagen", error);
    process.exit(1);
  });
