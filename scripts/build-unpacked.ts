import fs from 'fs';
import path from 'path';
import { templates } from '../src/templates';

// Minimal elegant base64-encoded purple icons (gradient background with white accent)
const ICON_16 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMElEQVR42mP8z8BQD8SMyMAMasAmgCsYmIEYgJoGgKshH6IOfB0YVDAUDFgBBAAA//8D6gIDT78/0gAAAABJRU5ErkJggg==';

const ICON_48 = 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABJklEQVR42u2ZsQtBURzHf0pSJA6DwaAsZLAoZfAnZGEwqCwG6S/IpMFiUcrgD8isZDAYDAbv9Tud9969967vvdN3p089da/f9/v9vve9ruu67vSDoT/XAIgBiAGIAYgBiAnAGADYbH5VIs6V9P+I0T3Bf6eAr9mAnmUv6O/M0Tf/GZgD0Iitg66C/tYcbXOfgDkAtb90YFpId0F/6ybtvKdgDkB91oGJIL0L+ptatPMeAnMA6rMOVAnpX9DftKJtdwtmALTMOrAhpH9Bf1OLNt0tmAHQeFfLgXFBegz6W1W06WbBDIDer9VyYFRId0B/K4tWbhowBiCHpQPjQrIbf9mZ7scB37mAtS9bYFrIP6C/FcdvWfEUMAYgBiAGIAYgBiAmsMsN2CqQZtOaofkAAAAASUVORK5CYII=';

const ICON_128 = 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAABmklEQVR42u3YMRHAQAzAsM68g8GgXv0mY6CDPtlByb3PeR/wZQMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAMMAAFYAsAHAADDAADDAADDAADDAADDAAMAsO/zPA+/bIABYIABYIABYIABYIABYIAp298AnWwGgHHeidIAAAAASUVORK5CYII=';

const OUTPUT_DIR = path.join(process.cwd(), 'extension');
const ICONS_DIR = path.join(OUTPUT_DIR, 'icons');

function ensureDirectoryExistence(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeExtensionFiles() {
  console.log('🚀 Starting unpacking and building extension into /extension ...');

  // Create directories
  ensureDirectoryExistence(OUTPUT_DIR);
  ensureDirectoryExistence(ICONS_DIR);

  // Write source files
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), templates.manifest);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'popup.html'), templates.popupHtml);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'popup.js'), templates.popupJs);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'background.js'), templates.background);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'content.js'), templates.content);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'store_ru.txt'), templates.storeRu);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'store_en.txt'), templates.storeEn);

  // Write binary icons
  fs.writeFileSync(path.join(ICONS_DIR, 'icon16.png'), Buffer.from(ICON_16, 'base64'));
  fs.writeFileSync(path.join(ICONS_DIR, 'icon48.png'), Buffer.from(ICON_48, 'base64'));
  fs.writeFileSync(path.join(ICONS_DIR, 'icon128.png'), Buffer.from(ICON_128, 'base64'));

  // Also duplicate in public/extension for web hosting / static serving
  const PUBLIC_OUTPUT_DIR = path.join(process.cwd(), 'public', 'extension');
  const PUBLIC_ICONS_DIR = path.join(PUBLIC_OUTPUT_DIR, 'icons');
  ensureDirectoryExistence(PUBLIC_OUTPUT_DIR);
  ensureDirectoryExistence(PUBLIC_ICONS_DIR);

  fs.writeFileSync(path.join(PUBLIC_OUTPUT_DIR, 'manifest.json'), templates.manifest);
  fs.writeFileSync(path.join(PUBLIC_OUTPUT_DIR, 'popup.html'), templates.popupHtml);
  fs.writeFileSync(path.join(PUBLIC_OUTPUT_DIR, 'popup.js'), templates.popupJs);
  fs.writeFileSync(path.join(PUBLIC_OUTPUT_DIR, 'background.js'), templates.background);
  fs.writeFileSync(path.join(PUBLIC_OUTPUT_DIR, 'content.js'), templates.content);
  fs.writeFileSync(path.join(PUBLIC_OUTPUT_DIR, 'store_ru.txt'), templates.storeRu);
  fs.writeFileSync(path.join(PUBLIC_OUTPUT_DIR, 'store_en.txt'), templates.storeEn);

  fs.writeFileSync(path.join(PUBLIC_ICONS_DIR, 'icon16.png'), Buffer.from(ICON_16, 'base64'));
  fs.writeFileSync(path.join(PUBLIC_ICONS_DIR, 'icon48.png'), Buffer.from(ICON_48, 'base64'));
  fs.writeFileSync(path.join(PUBLIC_ICONS_DIR, 'icon128.png'), Buffer.from(ICON_128, 'base64'));

  console.log('✅ Unpacked extension built successfully to /extension and /public/extension!');
}

writeExtensionFiles();
