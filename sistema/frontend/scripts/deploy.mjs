// Despliega el build del Sistema dentro de backend/public:
//   - dist/ -> backend/public/usuarios/   (aplicación React bajo /usuarios/)
//   - dist/login.html, dist/modulos.html y dist/img -> backend/public/
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const backendPublic = resolve(root, '..', '..', 'backend', 'public');

if (!existsSync(dist)) {
    console.error(`No existe ${dist}. Ejecuta primero: npm run build`);
    process.exit(1);
}

function deployDir(src, dest) {
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(dest, { recursive: true });
    cpSync(src, dest, { recursive: true });
    console.log(`Copiado: ${src} -> ${dest}`);
}

function deployFile(src, dest) {
    rmSync(dest, { force: true });
    cpSync(src, dest);
    console.log(`Copiado: ${src} -> ${dest}`);
}

deployDir(resolve(dist, 'assets'), resolve(backendPublic, 'usuarios', 'assets'));
deployFile(resolve(dist, 'index.html'), resolve(backendPublic, 'usuarios', 'index.html'));
deployFile(resolve(dist, 'login.html'), resolve(backendPublic, 'login.html'));
deployFile(resolve(dist, 'modulos.html'), resolve(backendPublic, 'modulos.html'));
deployDir(resolve(dist, 'img'), resolve(backendPublic, 'img'));

console.log('Despliegue completado en backend/public.');