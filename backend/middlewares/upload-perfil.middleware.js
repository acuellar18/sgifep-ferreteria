const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { HttpError } = require('../utils/http-error');

const DIRECTORIO = path.join(__dirname, '..', 'storage', 'perfiles');
fs.mkdirSync(DIRECTORIO, { recursive: true });

const MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!MIMES.has(file.mimetype)) {
      return cb(new HttpError(400, 'La foto debe ser JPG, PNG o WebP'));
    }
    return cb(null, true);
  }
}).single('foto');

function subirFotoPerfil(req, res, next) {
  upload(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new HttpError(400, 'La foto no puede superar los 5 MB'));
      }
      return next(new HttpError(400, 'No se pudo cargar la foto'));
    }
    return next(err);
  });
}

function nombreArchivo(id) {
  return `perfil-${id}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;
}

module.exports = { subirFotoPerfil, DIRECTORIO, nombreArchivo };
