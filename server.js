const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const connectDB = require("./config/db");
const fs = require("fs");
const axios = require("axios");

const authRoutes = require("./routes/auth");
const playlistRoutes = require("./routes/playlists");
const songRoutes = require("./routes/songRoutes");
const userRoutes = require("./routes/users");
const messageRoutes = require("./routes/messages");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Routes
app.use("/api", songRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

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

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("sendMessage", async (data) => {
    const { sender, receiver, message } = data;

    // Save message in DB
    const newMessage = new Message({ sender, receiver, message });
    await newMessage.save();

    // Send message in real-time
    io.emit("receiveMessage", newMessage);
  });
  socket.broadcast.emit("receiveMessage", message);
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const SPOTIFY_CLIENT_ID = "bf035b8431bc4791967c3bee0be6ba2c";
const SPOTIFY_CLIENT_SECRET = "5bd28e848ffd40afb844aae28c0f43cb";
let SPOTIFY_ACCESS_TOKEN = "";

async function getSpotifyAccessToken() {
    try {
        const response = await axios.post("https://accounts.spotify.com/api/token",
            new URLSearchParams({ grant_type: "client_credentials" }),
            {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
        SPOTIFY_ACCESS_TOKEN = response.data.access_token;
        // console.log(SPOTIFY_ACCESS_TOKEN);
    } catch (error) {
        console.error("Error getting access token:", error);
    }
}

// Fetch trending songs (featured playlists)
app.get("/api/trending", async (req, res) => {
    if (!SPOTIFY_ACCESS_TOKEN) await getSpotifyAccessToken();

    const { offset = 0, limit = 10 } = req.query; // Get offset and limit from query params

    try {
        const response = await axios.get(
            `https://api.spotify.com/v1/playlists/${process.env.PLAYLIST_ID}/tracks?limit=${limit}&offset=${offset}`,
            { headers: { Authorization: `Bearer ${SPOTIFY_ACCESS_TOKEN}` } }
        );

        // Extract song names from response
        const songs = response.data.items.map(item => item.track.name);
        
        res.json(songs);
    } catch (error) {
        console.error("Error fetching songs:", error.response?.data || error);
        res.status(500).json({ error: "Failed to fetch trending songs" });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  getSpotifyAccessToken();
});
