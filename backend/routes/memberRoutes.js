const express = require("express");
const MembershipApplication = require("../models/MembershipApplication");
const { protect } = require("../middleware/authMiddleware");
const { isCollegeEmail, ALLOWED_DOMAIN } = require("../utils/validateCollegeEmail");
const otpService = require("../utils/otpService");

const router = express.Router();

// Step 1: student enters their college email -> we send a one-time code to it.
router.post("/request-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!isCollegeEmail(email)) {
      return res.status(400).json({ message: `Please use your official college email (${ALLOWED_DOMAIN})` });
    }

    await otpService.requestOtp(email);

    res.json({ message: "Verification code sent to your college email." });
  } catch (error) {
    res.status(500).json({ message: "Could not send verification code", error: error.message });
  }
});

// Step 2: student enters the code they received -> we mark that email as verified.
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and verification code are required" });
    }

    await otpService.verifyOtp(email, otp);

    res.json({ message: "Email verified successfully." });
  } catch (error) {
    res.status(400).json({ message: error.message || "Verification failed" });
  }
});

// Step 3: submit the actual application - only allowed once that email is verified.
router.post("/", async (req, res) => {
  try {
    const { name, email, usn } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }
    if (!usn || !usn.trim()) {
      return res.status(400).json({ message: "USN is required" });
    }
    if (!isCollegeEmail(email)) {
      return res.status(400).json({ message: `Please use your official college email (${ALLOWED_DOMAIN})` });
    }

    const verification = await otpService.getVerification(email);

    if (!verification) {
      return res.status(403).json({ message: "Please verify your college email before submitting." });
    }

    const application = await MembershipApplication.create(req.body);

    // One-time use: consume the verification once the application is in.
    await otpService.consumeVerification(verification);

    res.status(201).json({
      message: "Membership application submitted successfully",
      application
    });
  } catch (error) {
    res.status(400).json({
      message: "Could not submit membership application",
      error: error.message
    });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const applications = await MembershipApplication.find().sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Could not load applications", error: error.message });
  }
});

router.put("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const application = await MembershipApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!application) return res.status(404).json({ message: "Application not found" });

    res.json(application);
  } catch (error) {
    res.status(400).json({ message: "Could not update application", error: error.message });
  }
});

module.exports = router;