const nodemailer = require("nodemailer");

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS?.replace(/\s+/g, ""),
    },
  });

const sendResetEmail = async (to, resetUrl) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"AniMê" <${process.env.SMTP_USER}>`,
    to,
    subject: "Password Reset - AniMê",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #c15b2f;">Password Reset</h2>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; background: #c15b2f; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
           Reset Password
        </a>
        <p style="margin-top: 24px; color: #5c5247; font-size: 14px;">
          This link expires in 15 minutes. If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  });
};

module.exports = { sendResetEmail };
