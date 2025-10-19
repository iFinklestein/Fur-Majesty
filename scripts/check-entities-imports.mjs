// scripts/check-entities-imports.mjs
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const cwd = process.cwd();
const SRC_DIR = path.resolve(cwd, 'src');
const ENTITIES_REAL = path.resolve(SRC_DIR, 'api', 'entities.js');

// Collect import paths that end in api/entities(.js) and resolve them.
const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g;

const namedImports = new Set();
const filesScanned = new Set();

function walk(dir) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p);
    else if (/\.(jsx?|tsx?)$/.test(d.name)) scanFile(p);
  }
}

function scanFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  let m;
  while ((m = importRegex.exec(text))) {
    const [, namesChunk, rawSpecifier] = m;

    // Resolve specifier to an absolute file if possible
    let spec = rawSpecifier;

    // Normalize common aliases to src/
    if (spec.startsWith('@/')) spec = path.join('src', spec.slice(2));
    if (spec.startsWith('/src/')) spec = spec.slice(1); // drop leading slash

    let abs;
    if (spec.startsWith('.') || spec.startsWith('src/')) {
      // relative or normalized absolute
      abs = path.resolve(path.dirname(filePath), spec);
    } else {
      // bare import (ignore)
      continue;
    }

    // If no extension, try .js
    if (!/\.(js|jsx|ts|tsx)$/.test(abs)) abs = abs + '.js';

    // Does this point to api/entities.js?
    const looksLikeEntities =
      abs.endsWith(path.join('api', 'entities.js')) ||
      abs.endsWith(path.join('api', 'entities.jsx')) ||
      abs.endsWith(path.join('api', 'entities.ts')) ||
      abs.endsWith(path.join('api', 'entities.tsx'));

    if (!looksLikeEntities) continue;

    // Resolve symlinks/real path for robust compare
    let real;
    try { real = fs.realpathSync(abs); } catch { real = abs; }
    let realEntities;
    try { realEntities = fs.realpathSync(ENTITIES_REAL); } catch { realEntities = ENTITIES_REAL; }

    if (real !== realEntities) continue;

    // Record named imports
    namesChunk
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .forEach(n => {
        const clean = n.replace(/\s+as\s+.+$/i, '');
        if (clean) namedImports.add(clean);
      });
  }
  filesScanned.add(filePath);
}

// Gather named exports from entities.js
function getExportsFromEntities() {
  const src = fs.readFileSync(ENTITIES_REAL, 'utf8');
  const out = new Set();
  // export function|class|const|let var NAME
  const decl = /export\s+(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z0-9_]+)/g;
  let m;
  while ((m = decl.exec(src))) out.add(m[1]);
  // export { a, b as c }
  const reexport = /export\s*\{([^}]+)\}/g;
  while ((m = reexport.exec(src))) {
    m[1]
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .forEach(item => {
        const [name] = item.split(/\s+as\s+/);
        out.add(name.trim());
      });
  }
  return out;
}

// Run
walk(SRC_DIR);
const exportsSet = getExportsFromEntities();

const imports = [...namedImports].sort();
const exportsArr = [...exportsSet].sort();
const missing = imports.filter(n => !exportsSet.has(n)).sort();
const unused = exportsArr.filter(n => !namedImports.has(n)).sort();

console.log('Asked for (imports):', imports.join(', ') || '(none)');
console.log('Provided (exports): ', exportsArr.join(', ') || '(none)');
console.log('');
console.log('MISSING exports:', missing.length ? missing.join(', ') : '(none)');
console.log('UNUSED exports :', unused.length ? unused.join(', ') : '(none)');
