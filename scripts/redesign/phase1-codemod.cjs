/* Phase 1 codemod: presentation layer only.
 * Usage: node scripts/redesign/phase1-codemod.cjs [--dry]
 * - removes box/text shadows, backdrop-filter, drop-shadow
 * - flattens gradients (keeps image scrims that fade to transparent)
 * - maps the old neon palette to o1 tokens
 * - replaces pixel font with the sans token
 * - removes text-transform: uppercase
 */
const fs = require('fs');
const path = require('path');

const DRY = process.argv.includes('--dry');
const SRC = path.join(__dirname, '..', '..', 'frontend', 'src');
const SKIP = new Set(['hooks', 'config', 'data']);
const TOKEN_FILES = new Set(['o1-tokens.css']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(path.join(dir, e.name), out); continue; }
    if (/\.(jsx|css)$/.test(e.name) && !TOKEN_FILES.has(e.name)) out.push(path.join(dir, e.name));
  }
  return out;
}

/* ---------- colour maps ---------- */
const HEX = {};
const put = (tok, list) => list.forEach(h => (HEX[h] = tok));
put('var(--accent)', ['00f5ff', '20f8ff', '00b8ff', '00d2eb', '38bdf8', '0050ff', '0060ff', '0077ff', '0000ff', '0052ff']);
put('var(--green)', ['00ff88', '10b981', '059669']);
put('var(--red)', ['ff4466', 'cc0033', 'ff6688']);
put('var(--amber)', ['ffd700', 'ffaa00', 'ff9900', 'ffb81a', 'ffcc00', 'ffb84d', 'e2c542', 'ff5500', 'ff6600']);
put('var(--text-2)', ['c084fc', 'a855f7', 'd8b4fe', 'cbd5e1', 'e2e8f0', 'f1f5f9']);
put('var(--text-3)', ['88aacc', '94a3b8', '64748b']);
put('var(--bg)', ['020b1a', '000511', '040d1e', '011124']);
put('var(--surface)', ['041430', '061a3c']);

const RGB = [
  [[0, 245, 255], 'accent'], [[0, 184, 255], 'accent'], [[0, 82, 255], 'accent'], [[0, 255, 136], 'green'],
  [[16, 185, 129], 'green'], [[5, 150, 105], 'green'], [[255, 68, 102], 'red'],
  [[255, 215, 0], 'amber'], [[255, 170, 0], 'amber'], [[255, 153, 0], 'amber'], [[255, 110, 0], 'amber'],
  [[168, 85, 247], 'text-2'], [[192, 132, 252], 'text-2'], [[190, 241, 255], 'text-2'],
  [[2, 11, 26], 'bg'], [[4, 20, 48], 'surface'], [[4, 14, 36], 'surface'], [[6, 26, 60], 'surface-2'],
  [[0, 20, 40], 'bg'], [[2, 14, 32], 'bg'], [[3, 14, 34], 'bg'], [[0, 6, 18], 'bg'], [[2, 16, 28], 'bg'],
  [[4, 32, 54], 'surface'], [[10, 2, 8], 'bg'], [[30, 10, 20], 'bg']
];
const mix = (tok, a) => {
  const p = Math.round(Math.max(0, Math.min(1, a)) * 100);
  return p >= 100 ? `var(--${tok})` : `color-mix(in srgb, var(--${tok}) ${p}%, transparent)`;
};

/* ---------- helpers ---------- */
function findBalanced(src, open) { // src[open] === '('
  let d = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '(') d++;
    else if (src[i] === ')') { d--; if (d === 0) return i; }
  }
  return -1;
}

function firstColor(g) {
  const m = g.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/);
  return m ? m[0] : 'var(--surface)';
}

function flattenGradients(src, stats) {
  let out = '', i = 0;
  const re = /(linear|radial|conic)-gradient\(/g;
  let m;
  while ((m = re.exec(src))) {
    const start = m.index;
    const open = start + m[0].length - 1;
    const end = findBalanced(src, open);
    if (end < 0) continue;
    const body = src.slice(open + 1, end);
    const isScrim = /transparent|,\s*rgba?\([^)]*,\s*0(\.0+)?\s*\)/.test(body);
    if (isScrim) { stats.scrims++; re.lastIndex = end; continue; }
    out += src.slice(i, start) + firstColor(body);
    i = end + 1;
    re.lastIndex = end + 1;
    stats.gradients++;
  }
  return out + src.slice(i);
}

/* remove `key: <expr>` object properties in JS */
function removeProps(src, keyRe, stats, statKey, valueTest) {
  const re = new RegExp(`(^|[\\s,{])(${keyRe})\\s*:`, 'g');
  let out = '', last = 0, m;
  while ((m = re.exec(src))) {
    const keyStart = m.index + m[1].length;
    let i = m.index + m[0].length, d = 0, q = null;
    for (; i < src.length; i++) {
      const c = src[i];
      if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
      if (c === '"' || c === "'" || c === '`') { q = c; continue; }
      if (c === '(' || c === '[' || c === '{') d++;
      else if (c === ')' || c === ']') d--;
      else if (c === '}') { if (d === 0) break; d--; }
      else if (c === ',' && d === 0) { i++; break; }
    }
    const value = src.slice(m.index + m[0].length, i);
    if (valueTest && !valueTest.test(value)) continue;
    // JSX `style={{ a: 1 }}` and plain objects only; skip things that look like CSS-in-JS template (handled elsewhere)
    out += src.slice(last, keyStart);
    last = i;
    re.lastIndex = i;
    stats[statKey]++;
  }
  return out + src.slice(last);
}

function mapColors(src, stats) {
  // 8-digit hex with alpha
  src = src.replace(/#([0-9a-fA-F]{6})([0-9a-fA-F]{2})\b/g, (all, h, a) => {
    const t = HEX[h.toLowerCase()];
    if (!t) return all;
    stats.colors++;
    return `color-mix(in srgb, ${t} ${Math.round(parseInt(a, 16) / 2.55)}%, transparent)`;
  });
  // 6-digit & 3-digit hex
  src = src.replace(/(.{0,28})(#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?)\b/g, (all, ctx, hex) => {
    let h = hex.slice(1).toLowerCase();
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const isBg = /background(?:Color)?\s*:\s*['"`]?\s*$|background\s*:\s*['"`][^'"`]*$/.test(ctx);
    const isText = /(^|[^-\w])color\s*:\s*['"`]?\s*$/.test(ctx) || /fill\s*[:=]\s*['"`]?\s*$/.test(ctx);
    let t = HEX[h];
    if (h === 'ffffff') t = isBg ? 'var(--surface-2)' : (/border/i.test(ctx) ? 'var(--border-strong)' : 'var(--text)');
    else if (h === '000000') t = isText ? 'var(--on-accent)' : 'var(--bg)';
    if (!t) return all;
    stats.colors++;
    return ctx + t;
  });
  // rgba / rgb
  src = src.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/g, (all, r, g, b, a) => {
    r = +r; g = +g; b = +b;
    const hit = RGB.find(([c]) => c[0] === r && c[1] === g && c[2] === b);
    if (!hit) return all;
    stats.colors++;
    return mix(hit[1], a === undefined ? 1 : parseFloat(a));
  });
  return src;
}

function processCss(src, stats) {
  src = src.replace(/(?:^|[;{\s])(?:-webkit-)?(?:box-shadow|text-shadow|backdrop-filter)\s*:[^;{}]*;?/gm, m => { stats.shadows++; return m.match(/^[;{\s]/) ? m[0] : ''; });
  src = src.replace(/filter\s*:[^;{}]*drop-shadow[^;{}]*;?/g, () => { stats.shadows++; return ''; });
  src = src.replace(/text-transform\s*:\s*uppercase\s*(!important)?\s*;?/g, () => { stats.upper++; return ''; });
  src = src.replace(/'Press Start 2P',\s*monospace(\s*!important)?/g, (m, imp) => { stats.fonts++; return `var(--font-sans)${imp || ''}`; });
  return src;
}

function processJsx(src, stats) {
  src = removeProps(src, 'boxShadow|textShadow|backdropFilter|WebkitBackdropFilter', stats, 'shadows');
  src = removeProps(src, 'filter', stats, 'shadows', /drop-shadow/);
  src = removeProps(src, 'textTransform', stats, 'upper', /uppercase/);
  src = src.replace(/(["'])'?Press Start 2P'?,\s*monospace\1/g, () => { stats.fonts++; return "'var(--font-sans)'"; });
  src = src.replace(/"'Press Start 2P', monospace"/g, () => { stats.fonts++; return "'var(--font-sans)'"; });
  src = src.replace(/'Press Start 2P', monospace/g, () => { stats.fonts++; return 'var(--font-sans)'; });
  // embedded <style> template CSS blocks inside JSX
  src = src.replace(/(?:^|[;{\s])(?:-webkit-)?(?:box-shadow|text-shadow|backdrop-filter)\s*:[^;{}`]*;/gm, m => { stats.shadows++; return m.match(/^[;{\s]/) ? m[0] : ''; });
  src = src.replace(/text-transform\s*:\s*uppercase\s*(!important)?\s*;/g, () => { stats.upper++; return ''; });
  return src;
}

let total = { shadows: 0, gradients: 0, scrims: 0, colors: 0, fonts: 0, upper: 0 };
for (const file of walk(SRC)) {
  const orig = fs.readFileSync(file, 'utf8');
  const stats = { shadows: 0, gradients: 0, scrims: 0, colors: 0, fonts: 0, upper: 0 };
  let s = orig;
  s = /\.css$/.test(file) ? processCss(s, stats) : processJsx(s, stats);
  s = flattenGradients(s, stats);
  s = mapColors(s, stats);
  if (s !== orig) {
    if (!DRY) fs.writeFileSync(file, s);
    console.log(path.relative(SRC, file).padEnd(46), JSON.stringify(stats));
  }
  for (const k of Object.keys(total)) total[k] += stats[k];
}
console.log('TOTAL', JSON.stringify(total), DRY ? '(dry run)' : '');
