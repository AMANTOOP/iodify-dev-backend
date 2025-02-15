const mongoose = require("mongoose");

const PlaylistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  songs: [{ type: String }],
});

module.exports = mongoose.model("Playlist", PlaylistSchema);
