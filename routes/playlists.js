const express = require("express");
const jwt = require("jsonwebtoken");
const Playlist = require("../models/Playlist");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Get all playlists of logged-in user
router.get("/", authMiddleware, async (req, res) => {
  const playlists = await Playlist.find({ userId: req.userId });
  res.json(playlists);
});

// Get playlist with song details
router.get("/:id", authMiddleware, async (req, res) => {
    const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.userId }).populate("songs");
  
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
  
    res.json(playlist);
  });
  
// Create a new playlist
router.post("/", authMiddleware, async (req, res) => {
  const { name } = req.body;
  const playlist = new Playlist({ userId: req.userId, name, songs: [] });

  await playlist.save();
  res.status(201).json(playlist);
});

// Add song to playlist
router.post("/:id/songs", authMiddleware, async (req, res) => {
  const { songId } = req.body;

  // Ensure songId is a string
  if (!songId || typeof songId !== "string") {
    return res.status(400).json({ message: "Invalid song ID" });
  }

  const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.userId });

  if (!playlist) {
    return res.status(404).json({ message: "Playlist not found" });
  }

  // Prevent duplicate song entries
  if (playlist.songs.includes(songId)) {
    return res.status(400).json({ message: "Song already exists in the playlist" });
  }

  playlist.songs.push(songId);
  await playlist.save();

  res.json({ message: "Song added successfully", playlist });
});
    

// Remove song from playlist
router.delete("/:id/songs/:songId", authMiddleware, async (req, res) => {
  const { songId } = req.params;

  // Ensure songId is a string
  if (!songId || typeof songId !== "string") {
    return res.status(400).json({ message: "Invalid song ID" });
  }

  const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.userId });

  if (!playlist) {
    return res.status(404).json({ message: "Playlist not found" });
  }

  // Check if song exists in the playlist
  if (!playlist.songs.includes(songId)) {
    return res.status(400).json({ message: "Song not found in the playlist" });
  }

  // Remove song from playlist
  playlist.songs = playlist.songs.filter(id => id !== songId);
  await playlist.save();

  res.json({ message: "Song removed successfully", playlist });
});


// Delete a playlist
router.delete("/:id", authMiddleware, async (req, res) => {
  const playlist = await Playlist.findOneAndDelete({ _id: req.params.id, userId: req.userId });

  if (!playlist) return res.status(404).json({ message: "Playlist not found" });

  res.json({ message: "Playlist deleted" });
});

module.exports = router;
