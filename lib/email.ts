import "server-only";
import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: parseInt(process.env.SMTP_PORT || "587", 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@brandfitcoach.com",
      to: email,
      subject: "Reset Your Password - Brandfit Coach",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background-color: #ffffff;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              h1 {
                color: #1a1a1a;
                font-size: 24px;
                margin-bottom: 20px;
              }
              p {
                margin-bottom: 15px;
                color: #555;
              }
              .button {
                display: inline-block;
                padding: 12px 30px;
                background-color: #000000;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: 500;
              }
              .button:hover {
                background-color: #333333;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #888;
                font-size: 14px;
              }
              .warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 12px;
                margin: 20px 0;
                border-radius: 4px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Reset Your Password</h1>
              <p>Hi ${userName},</p>
              <p>We received a request to reset the password for your account associated with this email address.</p>
              <p>To reset your password, click the button below:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <div class="warning">
                <p style="margin: 0;"><strong>⚠️ Important:</strong> This link will expire in 24 hours for security reasons.</p>
              </div>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
              <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
              <div class="footer">
                <p>Best regards,<br>Brandfit Coach Team</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Reset Your Password

Hi ${userName},

We received a request to reset the password for your account associated with this email address.

To reset your password, visit this link:
${resetUrl}

⚠️ Important: This link will expire in 24 hours for security reasons.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
Brandfit Coach Team
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error };
  }
}