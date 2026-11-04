const nodemailer = require('nodemailer');

const { HttpError } = require('../utils/http-error');

const DESTINATARIO = process.env.CONTACTO_EMAIL || 'ferreteriaelpuente34@gmail.com';
const MAX_LARGO = { nombre: 120, correo: 160, asunto: 200, mensaje: 4000 };
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Limita envíos desde la misma IP: 5 mensajes por hora (sin base de datos).
const intentos = new Map();
const VENTANA_MS = 60 * 60 * 1000;
const MAX_POR_IP = 5;
const LIMPIEZA_MS = 15 * 60 * 1000;
let ultimaLimpieza = Date.now();

function limitarPorIp(ip) {
  const ahora = Date.now();
  if (ahora - ultimaLimpieza > LIMPIEZA_MS) {
    for (const [clave, registro] of intentos) {
      if (ahora - registro.inicio > VENTANA_MS) intentos.delete(clave);
    }
    ultimaLimpieza = ahora;
  }

  const clave = ip || 'desconocida';
  let registro = intentos.get(clave);
  if (!registro || ahora - registro.inicio > VENTANA_MS) {
    registro = { inicio: ahora, cantidad: 0 };
    intentos.set(clave, registro);
  }
  registro.cantidad += 1;
  if (registro.cantidad > MAX_POR_IP) {
    throw new HttpError(429, 'Demasiados mensajes enviados. Intenta de nuevo más tarde.');
  }
}

function limpiarCampos(datos = {}) {
  // Acepta variantes de nombre de campo (Nombre/nombre, Asunto/asunto, etc.)
  // porque el formulario usa la primera letra en mayúscula.
  const normalizado = {};
  for (const [clave, valor] of Object.entries(datos)) {
    normalizado[clave.toLowerCase()] = valor;
  }
  const { nombre, email, correo, asunto, mensaje } = normalizado;
  const correoLimpio = String(correo || email || '').trim();

  if (!nombre || !String(nombre).trim()) throw new HttpError(400, 'El nombre es requerido');
  if (!correoLimpio) throw new HttpError(400, 'El correo electrónico es requerido');
  if (!EMAIL_REGEX.test(correoLimpio)) throw new HttpError(400, 'El correo electrónico no es válido');
  if (!asunto || !String(asunto).trim()) throw new HttpError(400, 'El asunto es requerido');
  if (!mensaje || !String(mensaje).trim()) throw new HttpError(400, 'El mensaje es requerido');

  const campos = {
    nombre: String(nombre).trim(),
    correo: correoLimpio,
    asunto: String(asunto).trim(),
    mensaje: String(mensaje).trim()
  };

  if (campos.nombre.length > MAX_LARGO.nombre) throw new HttpError(400, 'El nombre es demasiado largo');
  if (campos.correo.length > MAX_LARGO.correo) throw new HttpError(400, 'El correo es demasiado largo');
  if (campos.asunto.length > MAX_LARGO.asunto) throw new HttpError(400, 'El asunto es demasiado largo');
  if (campos.mensaje.length > MAX_LARGO.mensaje) throw new HttpError(400, 'El mensaje es demasiado largo');

  return campos;
}

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function crearTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new HttpError(500, 'El servicio de correo no está configurado. Agrega SMTP_USER y SMTP_PASS en el archivo .env del backend.');
  }

  const port = Number(process.env.SMTP_PORT) || 465;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

// Servicio del formulario de contacto público: valida los datos y envía el
// mensaje al correo de la ferretería usando SMTP (Gmail). El correo del
// visitante queda en Reply-To para responder directamente desde el buzón.
class ContactoService {
  async recibirMensaje(datos, contexto = {}) {
    limitarPorIp(contexto.ip);
    const campos = limpiarCampos(datos);
    const transporter = crearTransporter();

    const remitente = process.env.MAIL_FROM || `Ferretería El Puente <${process.env.SMTP_USER}>`;
    const asunto = `Contacto web: ${campos.asunto}`;

    try {
      await transporter.sendMail({
        from: remitente,
        to: DESTINATARIO,
        replyTo: campos.correo,
        subject: asunto,
        text: [
          `Nombre: ${campos.nombre}`,
          `Correo: ${campos.correo}`,
          `Asunto: ${campos.asunto}`,
          '',
          campos.mensaje
        ].join('\n'),
        html: `<div style="margin:0; padding:24px; background-color:#f4f4f5; font-family:Arial,Helvetica,sans-serif;">
                 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e4e4e7;">
                   <tr>
                      <td style="background-color:#141414; padding:18px 28px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="vertical-align:middle; width:60px;">
                              <img src="cid:logo-ferreteria" alt="Ferretería El Puente" style="display:block; width:48px; height:48px; border:0;">
                            </td>
                            <td style="vertical-align:middle; text-align:right;">
                              <p style="margin:0; color:#ffffff; font-size:15px; font-weight:bold;">FERRETERÍA EL PUENTE</p>
                              <p style="margin:4px 0 0; color:#16a34a; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Nuevo mensaje desde la web</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                   <tr>
                     <td style="padding:28px;">
                       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; color:#18181b;">
                         <tr>
                           <td style="padding:8px 0; color:#71717a; width:90px;">Nombre</td>
                           <td style="padding:8px 0; font-weight:bold;">${escaparHtml(campos.nombre)}</td>
                         </tr>
                         <tr>
                           <td style="padding:8px 0; color:#71717a;">Correo</td>
                           <td style="padding:8px 0; font-weight:bold;">${escaparHtml(campos.correo)}</td>
                         </tr>
                         <tr>
                           <td style="padding:8px 0; color:#71717a;">Asunto</td>
                           <td style="padding:8px 0; font-weight:bold;">${escaparHtml(campos.asunto)}</td>
                         </tr>
                       </table>
                       <div style="margin:18px 0 0; padding:16px 18px; background-color:#f8f9fa; border-left:4px solid #16a34a; border-radius:6px; font-size:14px; color:#27272a; white-space:pre-wrap;">${escaparHtml(campos.mensaje)}</div>
                       <p style="margin:24px 0 0; font-size:12px; color:#a1a1aa;">Responder a este correo escribe directo a <span style="color:#16a34a;">${escaparHtml(campos.correo)}</span>.</p>
                     </td>
                   </tr>
                   <tr>
                     <td style="padding:14px 28px; background-color:#faf7f2; border-top:1px solid #e4e4e7;">
                       <p style="margin:0; font-size:11px; color:#a1a1aa;">Formulario de contacto — landing page Ferretería El Puente</p>
                     </td>
                   </tr>
                 </table>
                </div>`,
        attachments: [
          {
            filename: 'logo.png',
            path: require('path').join(__dirname, '..', 'public', 'img', 'logo.png'),
            cid: 'logo-ferreteria'
          }
        ]
      });
    } catch (err) {
      console.error('[contacto] error enviando correo:', err.message || err);
      throw new HttpError(502, 'No se pudo enviar el mensaje en este momento. Escríbenos por WhatsApp.');
    }

    return { enviado: true };
  }
}

module.exports = new ContactoService();
