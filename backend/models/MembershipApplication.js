const mongoose = require("mongoose");

const membershipApplicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    year: { type: String, default: "" },
    branch: { type: String, default: "" },
    interests: [{ type: String }],
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("MembershipApplication", membershipApplicationSchema);
