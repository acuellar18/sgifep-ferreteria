// Ejecuta en orden los archivos SQL de backend/migrations contra la base de
// datos configurada en backend/.env. Uso: npm run migrate (en backend/).

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { readdirSync, readFileSync } = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  const carpeta = path.join(__dirname, '..', 'migrations');
  const archivos = readdirSync(carpeta).filter((f) => f.endsWith('.sql')).sort();

  console.log(`Migraciones en: ${carpeta}`);
  for (const archivo of archivos) {
    console.log(`Ejecutando ${archivo}...`);
    const sql = readFileSync(path.join(carpeta, archivo), 'utf8');
    await connection.query(sql);
    console.log(`OK ${archivo}`);
  }

  await connection.end();
  console.log('Migraciones completadas.');
}

main().catch((err) => {
  console.error('Error al ejecutar migraciones:', err.message);
  process.exit(1);
});