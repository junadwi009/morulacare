// Deterministic SVG rasterization, not a redraw. The source vector remains unchanged.
// Tool-only install: npm install --prefix tools/asset-cache/renderer --save-exact @resvg/resvg-js@2.6.2
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const { Resvg } = require(join(root, 'tools/asset-cache/renderer/node_modules/@resvg/resvg-js'));
const { PNG } = require(join(root, 'mobile/node_modules/pngjs'));
const directory = join(root, 'mobile/assets/brand');
const bytes = readFileSync(join(directory, 'morula-flower.svg'));
const source = bytes.toString('utf8');
const viewBox = source.match(/viewBox="([^"]+)"/)[1];
const [minX, minY, width, height] = viewBox.split(/\s+/).map(Number);
const paths = [...source.matchAll(/<path\b[^>]*\/>/gs)].map(match => match[0]);
if (paths.length !== 1 || !paths[0].includes('fill="#F8CA0F"')) throw new Error('Unexpected source artwork');
const specs = [
  { name: 'app-icon.png', size: 1024, artWidth: 700, background: '#FFFFFF' },
  { name: 'adaptive-icon.png', size: 1024, artWidth: 576, background: null },
  { name: 'adaptive-monochrome.png', size: 1024, artWidth: 576, background: null, monochrome: true },
  { name: 'favicon.png', size: 64, artWidth: 58, background: null },
  { name: 'web-icon-192.png', size: 192, artWidth: 172, background: null },
  { name: 'web-icon-512.png', size: 512, artWidth: 460, background: null },
  { name: 'splash-mark.png', size: 1024, artWidth: 900, background: null },
];
const assets = [];
for (const spec of specs) {
  const scale = spec.artWidth / width;
  const dx = (spec.size - width * scale) / 2 - minX * scale;
  const dy = (spec.size - height * scale) / 2 - minY * scale;
  const background = spec.background ? `<rect width="${spec.size}" height="${spec.size}" fill="${spec.background}"/>` : '';
  const artwork = spec.monochrome ? paths.join('').replaceAll('#F8CA0F', '#000000') : paths.join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.size}" height="${spec.size}" viewBox="0 0 ${spec.size} ${spec.size}">${background}<g transform="translate(${dx} ${dy}) scale(${scale})">${artwork}</g></svg>`;
  const pngBytes = new Resvg(svg).render().asPng();
  const png = PNG.sync.read(pngBytes);
  let transparent = 0, bounds = [png.width, png.height, -1, -1];
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    const p = (y * png.width + x) * 4;
    if (png.data[p + 3] < 255) transparent++;
    // Colored/monochrome artwork, ignoring opaque white app-icon background.
    if (png.data[p + 3] > 0 && (!spec.background || png.data[p] < 250 || png.data[p + 1] < 250 || png.data[p + 2] < 250)) {
      bounds = [Math.min(bounds[0], x), Math.min(bounds[1], y), Math.max(bounds[2], x), Math.max(bounds[3], y)];
    }
  }
  if (spec.background && transparent) throw new Error('App icon must be opaque');
  if (!spec.background && !transparent) throw new Error('Expected transparent canvas');
  writeFileSync(join(directory, spec.name), pngBytes);
  assets.push({ ...spec, width: png.width, height: png.height, alphaPixels: transparent, artworkBounds: bounds, sha256: createHash('sha256').update(pngBytes).digest('hex') });
}
const path = paths[0];
const d = path.match(/\bd="([^"]+)"/)[1];
const component = `import React from 'react';\nimport Svg, { Path } from 'react-native-svg';\n\n// Exact yellow flower path from assets/brand/morula-flower.svg.\nexport function BrandSymbol({ size = 36 }: { size?: number }) {\n  return <Svg width={size} height={size} viewBox=${JSON.stringify(viewBox)} preserveAspectRatio="xMidYMid meet" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Path fill="#F8CA0F" fillRule="evenodd" d=${JSON.stringify(d)}/></Svg>;\n}\n`;
writeFileSync(join(root, 'mobile/src/BrandSymbol.tsx'), component);
writeFileSync(join(directory, 'flower-assets.json'), JSON.stringify({ source: 'morula-flower.svg', sourceSha256: createHash('sha256').update(bytes).digest('hex'), renderer: '@resvg/resvg-js', rendererVersion: require(join(root, 'tools/asset-cache/renderer/node_modules/@resvg/resvg-js/package.json')).version, adaptiveSafeZone: '576px artwork width on 1024px canvas; inside central Android safe area', assets }, null, 2) + '\n');
console.log(`Generated ${assets.length} flower PNGs and BrandSymbol from original SVG path.`);
