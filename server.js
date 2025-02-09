const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Function to read JSON data
const readData = () => {
  const rawData = fs.readFileSync("data.json");
  return JSON.parse(rawData);
};

// Get all songs
app.get("/api/songs", (req, res) => {
  const songs = readData();
  res.json(songs);
});

// Get song by ID
app.get("/api/songs/:id", (req, res) => {
  const songs = readData();
  const song = songs.find((s) => s.id === req.params.id);

  if (!song) {
    return res.status(404).json({ error: "Song not found" });
  }

  res.json(song);
});

// Search songs by name or artist
app.get("/api/search", (req, res) => {
  const query = req.query.q?.toLowerCase(); // Get search query
  if (!query) {
    return res.status(400).json({ error: "Please provide a search query (q)" });
  }

  const songs = readData();
  const results = songs.filter(
    (song) =>
      song.name.toLowerCase().includes(query) ||
      song.primaryArtists.toLowerCase().includes(query)
  );

  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
