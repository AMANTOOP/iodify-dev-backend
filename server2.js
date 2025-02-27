const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = 3000;
const cors = require("cors");
app.use(cors({ origin: "http://localhost:3001" })); // Allow frontend URL

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
        console.log(SPOTIFY_ACCESS_TOKEN);
    } catch (error) {
        console.error("Error getting access token:", error);
    }
}

// Fetch trending songs (featured playlists)
app.get("/trending", async (req, res) => {
    if (!SPOTIFY_ACCESS_TOKEN) await getSpotifyAccessToken();

    const { offset = 0, limit = 10 } = req.query; // Get offset and limit from query params

    try {
        const response = await axios.get(
            `https://api.spotify.com/v1/playlists/4nqbYFYZOCospBb4miwHWy/tracks?limit=${limit}&offset=${offset}`,
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

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    getSpotifyAccessToken();
});
