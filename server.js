var express = require("express");
require("dotenv").config();
var bodyParser = require("body-parser");
var crypto = require("crypto");
const {
  sendPasswordResetEmail,
  otpNotification,
  mailNotification,
} = require("./graphMailer");

const app = express();
app.use(bodyParser.json());

const users = [{ email: "mr.joshuakusimanu@yahoo.com", id: 1 }];

app.post("/api/password-reset", async (request, response) => {
  const { email, token } = request.body;
  try {
    const isSent = await sendPasswordResetEmail(email, token);
    if (!isSent.success) return response.status(400).json(isSent);
    return response
      .status(200)
      .json({ success: true, message: "Reset email sent" });
  } catch (error) {
    console.error("Graph email error: ", error);
    return response
      .status(500)
      .json({ success: false, error: "Failed to send email" });
  }
});

app.post("/api/otpnotification", async (request, response) => {
  const { email, name, period, otp } = request.body;
  try {
    const isSent = await otpNotification(email, name, period, otp);
    return response
      .status(200)
      .json({ success: true, message: `Email sent`, data: isSent });
  } catch (error) {
    console.log(`error from sending otpnotification: `, error);
    if (error.body) {
      const parsed = JSON.parse(error.body);
      return response
        .status(500)
        .json({ success: false, error: parsed.message });
    } else {
      return response
        .status(500)
        .json({ success: false, error: error.message });
    }
  }
});

// propos

app.post("/api/proposalnotification", async (request, response) => {
  try {
    const isSent = await mailNotification(request);
    return response
      .status(200)
      .json({ success: true, message: `Email sent`, data: isSent });
  } catch (error) {
    console.log(`error from sending otpnotification: `, error);
    if (error.body) {
      const parsed = JSON.parse(error.body);
      return response
        .status(500)
        .json({ success: false, error: parsed.message });
    } else {
      return response
        .status(500)
        .json({ success: false, error: error.message });
    }
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
