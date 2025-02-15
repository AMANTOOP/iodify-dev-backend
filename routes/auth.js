const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Register
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.findOne({ email });
    //check if user is already registered
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const salt = await bcrypt.genSalt(10); // Generate salt
    const hashedPassword = await bcrypt.hash(password, salt); // Hash password

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});


// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1d" });
  res.json({ token });
});

// Get User Info
router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    res.json(user);
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
});

module.exports = router;
