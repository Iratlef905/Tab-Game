const { readUsers, writeUsers } = require('./utils');
const { getRanking } = require('./gameLogic');
const crypto = require('crypto');

function hashPassword(password) {
    return crypto
        .createHash('sha256')
        .update(password)
        .digest('hex');
}

function register(req, res) {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            const { nick, password } = JSON.parse(body);

            if (!nick || !password) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Nickname and password needed' }));
                return;
            }

            const users = readUsers();

            if (users[nick]) {
                // user exists
                if (users[nick] === hashPassword(password)) {
                    res.end(JSON.stringify({}));
                } else {
                    res.end(JSON.stringify({ error: 'Wrong password or username is already taken' }));
                }
            } else {
                // new user registration
                users[nick] = hashPassword(password);
                writeUsers(users);
                res.end(JSON.stringify({}));
            }

        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error processing request' }));
        }
    });
}

function ranking(req, res) {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            const { group, size } = data;

            console.log('📊 Requisição de ranking recebida:', { group, size });

            // checking
            if (group === undefined || size === undefined) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Undefined group or size' }));
                return;
            }

            const groupNum = parseInt(group);
            const sizeNum = parseInt(size);

            if (isNaN(groupNum) || groupNum < 1 || groupNum > 99) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid group' }));
                return;
            }

            if (isNaN(sizeNum) || sizeNum % 2 === 0 || sizeNum < 7 || sizeNum > 15) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid size' }));
                return;
            }

            // gets rankig
            const rankingData = getRanking(groupNum, sizeNum);
            
            console.log(`✅ Ranking retornado para grupo ${groupNum}, tamanho ${sizeNum}: ${rankingData.length} registros`);
            
            // returns ranking
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ranking: rankingData }));

        } catch (err) {
            console.error('Error getting ranking info:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error processing request' }));
        }
    });
}

module.exports = { register, ranking };