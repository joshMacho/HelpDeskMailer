const { Client } = require("@microsoft/microsoft-graph-client");
var { ClientSecretCredential } = require("@azure/identity");

// require("isomorphic-fetch");

require("dotenv").config();

const credentials = new ClientSecretCredential(
  process.env.AZURE_TENANT_ID,
  process.env.AZURE_CLIENT_ID,
  process.env.AZURE_CLIENT_SECRET,
);

const client = Client.initWithMiddleware({
  authProvider: {
    getAccessToken: async () => {
      const tokenResponse = await credentials.getToken(
        "https://graph.microsoft.com/.default",
      );
      return tokenResponse.token;
    },
  },
});

async function sendPasswordResetEmail(to, token) {
  const resetLink = `${process.env.FRONTEND_URL}/auth/reset?token=${token}`;

  const message = {
    message: {
      subject: "Reset your password",
      body: {
        contentType: "HTML",
        content: `
          <div style="font-family: Arial, sans-serif">
            <h2>Password Reset</h2>
            <p>You requested a password reset.</p>
            <p>
              <a href="${resetLink}" 
                 style="background:#1677ff;color:#fff;padding:10px 16px;border-radius:4px;text-decoration:none">
                Reset Password
              </a>
            </p>
            <p>This link expires in 15 minutes.</p>
            <p>If you didn’t request this, ignore this email.</p>
          </div>
        `,
      },
      toRecipients: [{ emailAddress: { address: to } }],
    },
    saveToSentItems: "false",
  };

  try {
    const mailer = await client
      .api(`/users/${process.env.MAIL_FROM}/sendMail`)
      .post(message);
    return { success: true };
  } catch (error) {
    console.log("error sending mail to: ", to);
    return { success: false, error: error.message };
  }
}

// send otp notification
async function otpNotification(to, name, period, OTP) {
  const message = {
    message: {
      subject: "Your Authorization Code",
      body: {
        contentType: "HTML",
        content: `
        <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f6f8;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px;">
    <tr>
      <td align="center">
        
        <!-- Container -->
        <table width="400" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; padding:30px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h2 style="margin:0; color:#333;">🔐 OTP Verification</h2>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="color:#555; font-size:15px; line-height:1.6; text-align:center;">
              Hello ${(name || "Customer").toUpperCase()},<br><br>
              Use the One-Time Password (OTP) below to complete your authentication.  
              This code will expire shortly.
            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td align="center" style="padding:25px 0;">
              <div style="display:inline-block; padding:15px 25px; font-size:28px; letter-spacing:5px; background:#f0f4ff; color:#2d5bff; border-radius:8px; font-weight:bold;">
                ${OTP}
              </div>
            </td>
          </tr>

          <!-- Expiry Note -->
          <tr>
            <td style="color:#888; font-size:13px; text-align:center;">
              This OTP is valid for <strong>${period} minutes</strong>.
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:20px 0;">
              <hr style="border:none; border-top:1px solid #eee;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="color:#999; font-size:12px; text-align:center;">
              If you didn’t request this, please ignore this email.<br>
              © 2026 NSIA Insurance
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>`,
      },
      toRecipients: [{ emailAddress: { address: to } }],
    },
    saveToSentItems: false,
  };
}

// send email link notification
async function mailNotification(request) {
  const { receipient, to, link, proposal_type } = request.body;

  const message = {
    message: {
      subject: `${(proposal_type || "").toUpperCase()} PROPOSAL FORM - NSIA`,
      body: {
        contentType: "HTML",
        content: `
        <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f6f8;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px;">
    <tr>
      <td align="center">
        
        <table width="400" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; padding:30px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h2 style="margin:0; color:#333;">🔗 Secure Access Link</h2>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="color:#555; font-size:15px; line-height:1.6; text-align:center;">
              Hello ${(receipient || "Customer").toUpperCase()},<br><br>
              Your requested ${(proposal_type || "").toUpperCase()} proposal form.<br>
              Click the button below to continue your proposal form. This link will expire shortly for your security.
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td align="center" style="padding:25px 0;">
              <a href="${link}" 
                 style="display:inline-block; padding:14px 24px; font-size:16px; 
                 background:#2d5bff; color:#ffffff; text-decoration:none; 
                 border-radius:8px; font-weight:bold;">
                 Access Your Link
              </a>
            </td>
          </tr>

          <!-- Expiry -->
          <tr>
            <td style="color:#888; font-size:13px; text-align:center;">
              This link is valid for <strong>6 hours</strong>.
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td style="padding-top:15px; text-align:center;">
              <p style="word-break:break-all; font-size:12px; color:#666;">
                Or copy and paste this link into your browser:<br>
                ${link}
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:20px 0;">
              <hr style="border:none; border-top:1px solid #eee;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="color:#999; font-size:12px; text-align:center;">
              If you didn’t request this, please ignore this email.<br>
              © 2026 NSIA Insurance
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>`,
      },
      toRecipients: [{ emailAddress: { address: to } }],
    },
    saveToSentItems: false,
  };

  try {
    const mailer = await client
      .api(`/users/${process.env.MAIL_FROM}/sendMail`)
      .post(message);
    return { success: true, data: mailer };
  } catch (error) {
    console.log(
      `Error from sending proposal notification: to: ${to}, - `,
      error,
    );
    return { success: false, error: error.message };
  }
}

module.exports = {
  mailNotification,
  sendPasswordResetEmail,
  otpNotification,
};
