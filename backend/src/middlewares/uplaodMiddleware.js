// uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Klasör var mı, yoksa oluştur
const uploadDir = path.join(__dirname, '..', 'uploads', 'comments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${file.fieldname}${ext}`);
  }
});

const upload = multer({ storage });

module.exports = upload;
