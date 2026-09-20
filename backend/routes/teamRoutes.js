const express = require("express");
const TeamMember = require("../models/TeamMember");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const members = await TeamMember.find({ active: true }).sort({ order: 1, name: 1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: "Could not load team", error: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const member = await TeamMember.create(req.body);
    res.status(201).json(member);
  } catch (error) {
    res.status(400).json({ message: "Could not create member", error: error.message });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  } catch (error) {
    res.status(400).json({ message: "Could not update member", error: error.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json({ message: "Member removed" });
  } catch (error) {
    res.status(400).json({ message: "Could not remove member", error: error.message });
  }
});

module.exports = router;
