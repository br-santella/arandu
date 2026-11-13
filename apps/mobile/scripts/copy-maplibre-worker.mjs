// maplibre-gl v6 loads its tile worker as a separate module file, which Metro
// does not bundle. Copy it into public/ (served at the web root) so it always
// matches the installed library version. Runs on `npm install` (postinstall).
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs');
const destDir = join(root, 'public/maplibre');
mkdirSync(destDir, { recursive: true });
copyFileSync(src, join(destDir, 'maplibre-gl-worker.mjs'));
console.log('maplibre worker copied to public/maplibre/');
