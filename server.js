var express = require("express");
require("dotenv").config();
var bodyParser = require("body-parser");
var crypto = require("crypto");
const jwt = require("jsonwebtoken");
var cors = require("cors");
const {
  sendPasswordResetEmail,
  otpNotification,
  mailNotification,
  uploadFile,
} = require("./graphMailer");
const { upload, s3Upload, uploadToS3, deleteFromS3 } = require("./fileUpload");

const app = express();
app.use(bodyParser.json());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      return callback(null, true); // Allow any origin
    },
    credentials: true,
  }),
);

const users = [{ email: "mr.joshuakusimanu@yahoo.com", id: 1 }];

// middle ware to validate token
const tokenValidate = (request, response, next) => {
  try {
    const auth = request.headers.authorization;
    if (!auth) {
      return response
        .status(401)
        .json({ success: false, error: "No Authorization in header" });
    }
    const token = auth.split(" ")[1];
    if (!token) {
      return response
        .status(401)
        .json({ success: false, error: "Invalid token format" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // if it is valid, proceed (next)
    next();
  } catch (error) {
    console.log(error);
    return response.status(404).json({
      success: false,
      error: `INDVALID TOKEN DATA - UNAUTHORIZED`,
    });
  }
};

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

// app.post("/api/uploadfile", tokenValidate, upload.single("file"), uploadFile);

app.post(
  "/api/uploadfile",
  tokenValidate,
  s3Upload.single("file"),
  async (request, response) => {
    try {
      if (!request.file) {
        return response.status(400).json({
          success: false,
          error: "NO FILE UPLOADED",
        });
      }

      const imageUrl = await uploadToS3(
        request.file.buffer,
        request.file.originalname,
        request.file.mimetype,
      );

      return response.status(200).json({
        success: true,
        imageUrl,
      });
    } catch (error) {
      console.log(error);
      return response.status(500).json({
        success: false,
        error: "UPLOAD FAILED",
      });
    }
  },
);

app.delete("/api/deletes3file", tokenValidate, async (request, response) => {
  try {
    const { key } = request.body;
    const result = await deleteFromS3(key);
    if (result) {
      return response
        .status(200)
        .json({ success: true, message: `FILE REMOVED` });
    } else {
      return response
        .status(400)
        .json({ success: false, error: `UNABLE TO REMOVE FILE` });
    }
  } catch (error) {
    console.log(`error from deleting file: ${key} - `, error);
    return response
      .status(500)
      .json({ success: false, error: `DELETE FAILED${error.message}` });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
