const http = require('http');
const PORT = 8131;
const { register } = require('./modules/serverRoutes');

const server = http.createServer((req, res) => {
    if (req.url === '/register' && req.method === 'POST') {
        register(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, () => console.log(`Server runs on http://localhost:${PORT}`));