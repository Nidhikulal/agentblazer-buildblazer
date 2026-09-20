const express = require("express");
const Event = require("../models/Event");
const TeamMember = require("../models/TeamMember");
const MembershipApplication = require("../models/MembershipApplication");
const ContactMessage = require("../models/ContactMessage");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [events, teamMembers, applications, messages] = await Promise.all([
      Event.countDocuments(),
      TeamMember.countDocuments({ active: true }),
      MembershipApplication.countDocuments(),
      ContactMessage.countDocuments()
    ]);

    res.json({
      events,
      teamMembers,
      membershipApplications: applications,
      contactMessages: messages
    });
  } catch (error) {
    res.status(500).json({ message: "Could not load stats", error: error.message });
  }
});

router.get("/admin", protect, async (req, res) => {
  try {
    const [events, teamMembers, applications, messages, pendingApplications, newMessages] =
      await Promise.all([
        Event.countDocuments(),
        TeamMember.countDocuments({ active: true }),
        MembershipApplication.countDocuments(),
        ContactMessage.countDocuments(),
        MembershipApplication.countDocuments({ status: "pending" }),
        ContactMessage.countDocuments({ status: "new" })
      ]);

    res.json({
      events,
      teamMembers,
      membershipApplications: applications,
      contactMessages: messages,
      pendingApplications,
      newMessages
    });
  } catch (error) {
    res.status(500).json({ message: "Could not load admin stats", error: error.message });
  }
});

module.exports = router;
