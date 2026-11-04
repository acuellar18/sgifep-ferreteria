const nodemailer = require('nodemailer');

// Transporte SMTP configurado desde .env (nunca expone credenciales en código).
function crearTransporte() {
  const port = Number(process.env.SMTP_PORT) || 465;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function remitente() {
  return process.env.MAIL_FROM || `SGIFEP <${process.env.SMTP_USER || 'noreply@sgifep.local'}>`;
}

// Disponible: devuelve true si hay credenciales SMTP configuradas.
function disponible() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

module.exports = { crearTransporte, remitente, disponible };
