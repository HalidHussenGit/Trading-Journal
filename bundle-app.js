const fs = require('fs');
const path = require('path');

console.log('Building TypeScript / React application bundle...');

// Lightweight TS -> JS transpiler function
function transpileTS(code) {
  return code
    // Remove type annotations
    .replace(/:\s*([A-Za-z0-9_<>\[\]\|\&\ \?]+)/g, (match, p1) => {
      if (match.startsWith(': React.') || match.startsWith(': string') || match.startsWith(': number') || match.startsWith(': boolean') || match.startsWith(': any') || match.startsWith(': void')) return '';
      return '';
    })
    .replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, '')
    .replace(/type\s+\w+\s*=[\s\S]*?;/g, '')
    .replace(/import\s+type\s+[\s\S]*?;/g, '')
    .replace(/export\s+type\s+[\s\S]*?;/g, '')
    .replace(/export\s+interface\s+[\s\S]*?\}/g, '');
}

console.log('Transpilation helper initialized.');
