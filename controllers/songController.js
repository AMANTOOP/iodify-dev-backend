const Song = require("../models/Song");

// Save Songs to DB (without duplicates)
const saveSongs = async (req, res) => {
  try {
    const { songs } = req.body;
    if (!songs || songs.length === 0) return res.status(400).json({ error: "No songs provided" });

    const savedSongs = [];

    for (const song of songs) {
      const existingSong = await Song.findOne({ id: song.id }); // Ensure uniqueness
      if (!existingSong) {
        const newSong = await Song.create(song);
        savedSongs.push(newSong);
      }
    }

    res.status(201).json({ message: "Songs saved successfully", savedSongs });
  } catch (error) {
    console.error("Error saving songs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get All Songs from DB
const getSongs = async (req, res) => {
  try {
    const songs = await Song.find();
    res.json(songs);
  } catch (error) {
    console.error("Error fetching songs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  };

  
  
};

// Search for a song by title (case-insensitive)
const searchSongByName = async (req, res) => {
    try {
      const { name } = req.query; // Use "name" instead of "title"
      if (!name) return res.status(400).json({ error: "Song name is required" });
  
      const songs = await Song.find({ name: { $regex: name, $options: "i" } }); // Case-insensitive search
  
      res.json(songs);
    } catch (error) {
      console.error("Error searching for song by name:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

//find songs in db with id for playlist
const searchSongById = async (req, res) => {
  try {
    const { songIds } = req.body
    if (!songIds || !Array.isArray(songIds)) {
      return res.status(400).json({ message: "Invalid song IDs" })
    }

    // Fetch songs from MongoDB using their IDs
    const songs = await Song.find({ id: { $in: songIds } })
    res.json(songs)
  } catch (error) {
    res.status(500).json({ message: "Error fetching songs", error: error.message })
  }
};
module.exports = { saveSongs, getSongs, searchSongByName, searchSongById };
