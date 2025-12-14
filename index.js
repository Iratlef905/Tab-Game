const http = require('http');
const PORT = 8131;
const { register, ranking, updateGameResult } = require('./modules/serverRoutes');

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.url === '/register' && req.method === 'POST') {
        register(req, res);
    } else if (req.url === '/ranking' && req.method === 'POST') {
        ranking(req, res);
    } else if (req.url === '/updateResult' && req.method === 'POST') {
        updateGameResult(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, () => {
    console.log(`server runs on http://localhost:${PORT}`);
    console.log(' available endpoints:');
    console.log('  POST /register');
    console.log('  POST /ranking  ');
});