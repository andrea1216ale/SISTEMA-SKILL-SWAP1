const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIMES = {
  'image/jpeg': 'IMAGEN',
  'image/png': 'IMAGEN',
  'image/gif': 'IMAGEN',
  'image/webp': 'IMAGEN',
  'application/pdf': 'CERTIFICADO',
  'application/msword': 'DOCUMENTO',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCUMENTO',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, name);
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIMES[file.mimetype]) return cb(null, true);
  cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

module.exports = { upload, ALLOWED_MIMES, UPLOADS_DIR };
