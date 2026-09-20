const express = require("express");
const crypto = require("crypto");
const MembershipApplication = require("../models/MembershipApplication");
const OtpVerification = require("../models/OtpVerification");
const { protect } = require("../middleware/authMiddleware");
const { publicFormLimiter, otpLimiter } = require("../middleware/rateLimiter");
const { isCollegeEmail, ALLOWED_DOMAIN } = require("../utils/validateCollegeEmail");
const { sendOtpEmail } = require("../utils/sendEmail");

const router = express.Router();

// Step 1: student enters their college email -> we send a one-time code to it.
router.post("/request-otp", otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!isCollegeEmail(email)) {
      return res.status(400).json({ message: `Please use your official college email (${ALLOWED_DOMAIN})` });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Replace any previous pending code for this email.
    await OtpVerification.deleteMany({ email: normalizedEmail });
    await OtpVerification.create({ email: normalizedEmail, otp, verified: false, expiresAt });

    await sendOtpEmail(normalizedEmail, otp);

    res.json({ message: "Verification code sent to your college email." });
  } catch (error) {
    res.status(500).json({ message: "Could not send verification code", error: error.message });
  }
});

// Step 2: student enters the code they received -> we mark that email as verified.
router.post("/verify-otp", otpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and verification code are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = await OtpVerification.findOne({ email: normalizedEmail });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Code expired or not found. Please request a new one." });
    }
    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ message: "Incorrect verification code." });
    }

    record.verified = true;
    await record.save();

    res.json({ message: "Email verified successfully." });
  } catch (error) {
    res.status(500).json({ message: "Verification failed", error: error.message });
  }
});

// Step 3: submit the actual application - only allowed once that email is verified.
router.post("/", publicFormLimiter, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }
    if (!isCollegeEmail(email)) {
      return res.status(400).json({ message: `Please use your official college email (${ALLOWED_DOMAIN})` });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const verification = await OtpVerification.findOne({ email: normalizedEmail, verified: true });

    if (!verification) {
      return res.status(403).json({ message: "Please verify your college email before submitting." });
    }

    const application = await MembershipApplication.create(req.body);

    // One-time use: consume the verification once the application is in.
    await OtpVerification.deleteOne({ _id: verification._id });

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