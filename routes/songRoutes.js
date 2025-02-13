const express = require("express");
const { saveSongs, getSongs, searchSongByName } = require("../controllers/songController");

const router = express.Router();

router.post("/save-songs", saveSongs); // Save Songs
router.get("/backup/songs", getSongs); // Get Songs
router.get("/backup/search", searchSongByName);

module.exports = router;
