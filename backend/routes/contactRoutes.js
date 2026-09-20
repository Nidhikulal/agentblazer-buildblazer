const express = require("express");
const ContactMessage = require("../models/ContactMessage");
const { protect } = require("../middleware/authMiddleware");
const { publicFormLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/", publicFormLimiter, async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email and message are required" });
    }

    const contact = await ContactMessage.create(req.body);

    res.status(201).json({
      message: "Message sent successfully",
      contact
    });
  } catch (error) {
    res.status(400).json({ message: "Could not send message", error: error.message });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Could not load messages", error: error.message });
  }
});

router.put("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["new", "read", "replied"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!message) return res.status(404).json({ message: "Message not found" });

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: "Could not update message", error: error.message });
  }
});

module.exports = router;
