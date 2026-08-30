const http = require('https');
http.get('https://registry.npmjs.org/react', (res) => {
  console.log('NPM Registry status code:', res.statusCode);
}).on('error', (e) => {
  console.error('Error:', e);
});
