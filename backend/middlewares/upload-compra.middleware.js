const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { HttpError } = require('../utils/http-error');

const DIRECTORIO = path.join(__dirname, '..', 'storage', 'compras');
fs.mkdirSync(DIRECTORIO, { recursive: true });

const EXTENSIONES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png'
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DIRECTORIO),
  filename: (_req, file, cb) => {
    const extension = EXTENSIONES[file.mimetype] || '';
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!EXTENSIONES[file.mimetype]) {
      return cb(new HttpError(400, 'Solo se permiten archivos PDF, JPG o PNG'));
    }
    return cb(null, true);
  }
}).single('archivo');

function subirArchivoCompra(req, res, next) {
  upload(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new HttpError(400, 'El archivo no puede superar los 5 MB'));
      }
      return next(new HttpError(400, 'No se pudo cargar el archivo'));
    }
    return next(err);
  });
}

module.exports = { subirArchivoCompra, DIRECTORIO };
