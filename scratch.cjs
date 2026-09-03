const fs = require('fs');

const dataStr = fs.readFileSync('/home/phantom/Project/Trading-Journal/src/utils/calculations.ts', 'utf8');
console.log("Sort logic applied:", dataStr.includes('localeCompare'));
