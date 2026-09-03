const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/home/phantom/Project/Trading-Journal/src/context/initialData.ts', 'utf8').replace('export const initialTrades: Trade[] = ', '').replace(';', ''));
console.log("Total trades:", data.length);
