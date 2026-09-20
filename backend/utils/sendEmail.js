const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // true for port 465, false for 587/others
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendOtpEmail(to, otp) {
  await transporter.sendMail({
    from: `"AgentBlazer Club" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your AgentBlazer Club Verification Code",
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:auto">
        <h2>AgentBlazer Club</h2>
        <p>Use the code below to verify your college email and complete your membership application:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#5b6ee8">${otp}</p>
        <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `
  });
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Notifies the CSE department whenever someone submits the public contact form.
async function sendContactNotification({ name, email, subject, message }) {
  const to = process.env.CONTACT_RECIPIENT || "24g15.nidhi@sjec.ac.in";

  await transporter.sendMail({
    from: `"AgentBlazer Club Website" <${process.env.SMTP_USER}>`,
    to,
    replyTo: email,
    subject: `[Contact Form] ${subject && subject.trim() ? subject : "New message from " + name}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        ${subject ? `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>` : ""}
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap;border-left:3px solid #5b6ee8;padding-left:12px">${escapeHtml(message)}</p>
        <p style="color:#888;font-size:12px;margin-top:24px">Sent via the AgentBlazer Club website contact form. Reply-to is set to the sender's email.</p>
      </div>
    `
  });
}

module.exports = { sendOtpEmail, sendContactNotification };