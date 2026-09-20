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

module.exports = { sendOtpEmail };