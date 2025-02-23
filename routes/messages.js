const express = require("express");
const Message = require("../models/message");
const router = express.Router();

router.post("/send", async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;
    
    const newMessage = new Message({ sender, receiver, message });
    await newMessage.save();

    // // Update conversation
    // await Conversation.findOneAndUpdate(
    //   { participants: { $all: [sender, receiver] } },
    //   { lastMessage: message, lastMessageAt: Date.now() },
    //   { upsert: true, new: true }
    // );

    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:user1/:user2", async (req, res) => {
    try {
      const messages = await Message.find({
        $or: [
          { sender: req.params.user1, receiver: req.params.user2 },
          { sender: req.params.user2, receiver: req.params.user1 }
        ]
      }).sort("timestamp");
  
      res.status(200).json(messages);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
module.exports = router;