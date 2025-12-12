const { readUsers, writeUsers } = require('./utils');
const crypto = require('crypto');

function generateGameId(group, nick) {
    const timestamp = Date.now();
    const value = `${group}-${nick}-${timestamp}`;
    const hash = crypto
        .createHash('md5')
        .update(value)
        .digest('hex');
    return hash;
}


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
                res.end(JSON.stringify({ error: 'nickname and Password needed' }));
                return;
            }

            const users = readUsers();

            if (users[nick]) {
                // user exists
                if (users[nick] === hashPassword(password)) {
                    res.end(JSON.stringify({}));
                } else {
                    res.end(JSON.stringify({ error: 'wrong password or username is already taken' }));
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

module.exports = { register };