const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const connectDB = require("./config/db");
const songRoutes = require("./routes/songRoutes");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api", songRoutes);

// Connect to MongoDB & Start Server
connectDB();

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

app.get("/api/global-search/search", async (req, res) => {
  try {
      const query = req.query.name;
      if (!query) {
          return res.status(400).json({ error: "Query parameter is required" });
      }

      const saavanUrl = `https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}`;
      const response = await fetch(saavanUrl);
      const data = await response.json();

      if (!data?.data?.results?.length) {
          return res.status(404).json({ error: "No results found" });
      }

      const formattedResults = data.data.results.map((song) => ({
          id: song.id,
          name: song.name,
          url: song.downloadUrl[4]?.url || song.downloadUrl[0]?.url,
          image: song.image[1]?.url || song.image[0]?.url,
          primaryArtists: song.artists.primary
        ? song.artists.primary.map((artist) => artist.name).join(", ")
        : "Unknown",
      }));

      res.json(formattedResults);
      // console.log(formattedResults);
  } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
