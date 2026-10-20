import { copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origen = resolve(root, 'src', 'styles', 'sidebar.css');
const destino = resolve(root, 'public', 'assets-modulos', 'sidebar.css');

if (!existsSync(origen)) {
  console.error(`No existe ${origen}`);
  process.exit(1);
}

copyFileSync(origen, destino);
console.log('Sidebar compartido sincronizado en public/assets-modulos/sidebar.css');
