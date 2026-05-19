const multer = require("multer");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// const storage = multer.memoryStorage();
const s3Upload = multer({ storage });

async function uploadToS3(fileBuffer, fileName, mimeType) {
  const fileN = `${Date.now()}-${fileName}`;

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${process.env.AWS_BUCKET_FOLDER}/${fileN}`,
    Body: fileBuffer,
    ContentType: mimeType,
  };
  const command = new PutObjectCommand(params);
  await s3.send(command);

  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_BUCKET_FOLDER}/${fileN}`;
}

// Strip the key
function getS3KeyFromUrl(url) {
  const urlObj = new URL(url);
  return urlObj.pathname.slice(1); // removes leading "/"
}

async function deleteFromS3(url) {
  //send entire URL
  const key = getS3KeyFromUrl(url);

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  };
  const command = new DeleteObjectCommand(params);
  await s3.send(command);

  return true;
}

module.exports = { upload, uploadToS3, s3Upload, deleteFromS3 };
