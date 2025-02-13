const mongoose = require("mongoose");

const songSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true }, // Unique ID to prevent duplicates
  name: String,
  url: String,
  image: String,
  primaryArtists: String,
}, { timestamps: true });

module.exports = mongoose.model("Song", songSchema);
