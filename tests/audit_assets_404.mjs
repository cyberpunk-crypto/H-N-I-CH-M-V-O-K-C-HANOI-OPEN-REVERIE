import fs from 'node:fs';
import path from 'node:path';

function getAllFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'lib') {
        results = results.concat(getAllFiles(fullPath, exts));
      }
    } else {
      if (exts.some(ext => file.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const codeFiles = getAllFiles('src', ['.js', '.mjs']).concat(getAllFiles('styles', ['.css'])).concat(['index.html']);

const assetRegex = /assets\/[a-zA-Z0-9_\-\.\/]+/g;
const referencedAssets = new Set();

codeFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = assetRegex.exec(content)) !== null) {
    let p = match[0];
    p = p.replace(/['"`,\;)\\]+$/, '');
    referencedAssets.add(p);
  }
});

console.log('Total project-code referenced assets:', referencedAssets.size);
let missing = [];
referencedAssets.forEach(a => {
  const localPath = path.join(...a.split('/'));
  if (!fs.existsSync(localPath)) {
    missing.push(a);
  }
});

if (missing.length === 0) {
  console.log('SUCCESS: All ' + referencedAssets.size + ' referenced assets EXIST in project! 0 404 errors!');
} else {
  console.error('MISSING ASSETS (' + missing.length + '):', missing);
}
