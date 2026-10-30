// Configuración central de autenticación (JWT) y constantes de roles.
// La clave secreta se lee de backend/.env (JWT_SECRET); en desarrollo se usa
// un valor por defecto para que el arranque no dependa de configuraciones.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatorio en producción');
}

module.exports = {
  jwt: {
    secreto: process.env.JWT_SECRET || 'clave-desarrollo-sgifep-no-usar-en-produccion',
    expiraEn: process.env.JWT_EXPIRA_EN || '8h'
  },
  ROL_ADMINISTRADOR: 'administrador',
  ROL_COMPRAS: 'compras',
  ROL_BODEGA: 'bodega',
  ROL_CAJA: 'caja',
  ROL_VENTAS: 'ventas',
  ROL_REPARTO: 'reparto'
};