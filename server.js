const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");

app.use(cors());
app.use(express.json());

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(COMMENTS_FILE);
  } catch (error) {
    const initialPayload = JSON.stringify([], null, 2);
    await fs.writeFile(COMMENTS_FILE, initialPayload, "utf-8");
  }
}

async function readComments() {
  const raw = await fs.readFile(COMMENTS_FILE, "utf-8");
  return JSON.parse(raw);
}

async function writeComments(comments) {
  await fs.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 2), "utf-8");
}

app.get("/api/comments", async (_req, res) => {
  try {
    const comments = await readComments();
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

    const newEntry = {
      text: String(text).trim(),
      displayName: String(displayName).trim(),
      avatar: String(avatar).trim(),
      timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
    };

    const comments = await readComments();
    comments.unshift(newEntry);
    await writeComments(comments);

    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Fehler beim Speichern eines Kommentars", error);
    res.status(500).json({ message: "Kommentar konnte nicht gespeichert werden." });
  }
});

ensureDataFile()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Community Lounge API läuft auf Port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Initialisierung fehlgeschlagen", error);
    process.exit(1);
  });
