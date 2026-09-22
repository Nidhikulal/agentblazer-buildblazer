const express = require("express");
const TeamMember = require("../models/TeamMember");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const members = await TeamMember.find({ active: true }).sort({ section: 1, order: 1, name: 1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: "Could not load team", error: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const section = req.body.section === "committee" ? "committee" : "core";
    const count = await TeamMember.countDocuments({ active: true, section });

    let order = Number(req.body.order);
    if (!Number.isFinite(order) || order < 1) order = count + 1; // no position given -> put last
    order = Math.max(1, Math.min(order, count + 1)); // clamp into the valid range

    // Make room: push everyone at or after this position down by one
    await TeamMember.updateMany(
      { active: true, section, order: { $gte: order } },
      { $inc: { order: 1 } }
    );

    const member = await TeamMember.create({ ...req.body, section, order });
    res.status(201).json(member);
  } catch (error) {
    res.status(400).json({ message: "Could not create member", error: error.message });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const existing = await TeamMember.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Member not found" });

    const section = req.body.section === "committee" || req.body.section === "core" ? req.body.section : existing.section;
    const oldOrder = existing.order;
    const sectionChanged = section !== existing.section;

    const countInNewSection = await TeamMember.countDocuments({
      active: true,
      section,
      _id: { $ne: existing._id }
    });

    let newOrder = Number(req.body.order);
    if (!Number.isFinite(newOrder) || newOrder < 1) newOrder = sectionChanged ? countInNewSection + 1 : oldOrder;
    newOrder = Math.max(1, Math.min(newOrder, countInNewSection + 1));

    if (sectionChanged) {
      // Close the gap left behind in the old section
      await TeamMember.updateMany(
        { active: true, section: existing.section, order: { $gt: oldOrder } },
        { $inc: { order: -1 } }
      );
      // Make room in the new section
      await TeamMember.updateMany(
        { active: true, section, order: { $gte: newOrder } },
        { $inc: { order: 1 } }
      );
    } else if (newOrder !== oldOrder) {
      if (newOrder < oldOrder) {
        // Moving up the list: shift everyone in between down by one
        await TeamMember.updateMany(
          { active: true, section, order: { $gte: newOrder, $lt: oldOrder }, _id: { $ne: existing._id } },
          { $inc: { order: 1 } }
        );
      } else {
        // Moving down the list: shift everyone in between up by one
        await TeamMember.updateMany(
          { active: true, section, order: { $gt: oldOrder, $lte: newOrder }, _id: { $ne: existing._id } },
          { $inc: { order: -1 } }
        );
      }
    }

    const member = await TeamMember.findByIdAndUpdate(
      req.params.id,
      { ...req.body, section, order: newOrder },
      { new: true, runValidators: true }
    );
    res.json(member);
  } catch (error) {
    res.status(400).json({ message: "Could not update member", error: error.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });

    member.active = false;
    await member.save();

    // Close the gap so the remaining members stay numbered 1, 2, 3...
    await TeamMember.updateMany(
      { active: true, section: member.section, order: { $gt: member.order } },
      { $inc: { order: -1 } }
    );

    res.json({ message: "Member removed" });
  } catch (error) {
    res.status(400).json({ message: "Could not remove member", error: error.message });
  }
});

module.exports = router;