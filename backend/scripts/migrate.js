// Ejecuta en orden los archivos SQL de backend/migrations contra la base de
// datos configurada en backend/.env. Uso: npm run migrate (en backend/).
//
// Soporta la directiva DELIMITER (necesaria para triggers y procedimientos)
// y omite la carpeta migrations/reversos.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { readdirSync, readFileSync, statSync } = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function dividirSentencias(sql) {
  const lineas = String(sql).replace(/^\uFEFF/, '').split(/\r?\n/);
  const sentencias = [];
  let delimitador = ';';
  let buffer = [];

  for (const linea of lineas) {
    const cambio = linea.match(/^\s*DELIMITER\s+(\S+)\s*$/i);
    if (cambio) {
      delimitador = cambio[1];
      continue;
    }

    buffer.push(linea);
    const texto = buffer.join('\n');
    if (texto.trimEnd().endsWith(delimitador)) {
      const sentencia = texto.trimEnd().slice(0, -delimitador.length).trim();
      if (sentencia) sentencias.push(sentencia);
      buffer = [];
    }
  }

  const resto = buffer.join('\n').trim();
  if (resto) sentencias.push(resto);
  return sentencias;
}

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
  const archivos = readdirSync(carpeta)
    .filter((f) => f.endsWith('.sql') && statSync(path.join(carpeta, f)).isFile())
    .sort();

  console.log(`Migraciones en: ${carpeta}`);
  for (const archivo of archivos) {
    console.log(`Ejecutando ${archivo}...`);
    const sql = readFileSync(path.join(carpeta, archivo), 'utf8');
    const sentencias = dividirSentencias(sql);
    for (const sentencia of sentencias) {
      await connection.query(sentencia);
    }
    console.log(`OK ${archivo} (${sentencias.length} sentencias)`);
  }

  await connection.end();
  console.log('Migraciones completadas.');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Error al ejecutar migraciones:', err.message);
    process.exit(1);
  });
}

module.exports = { dividirSentencias };
