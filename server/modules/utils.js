const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, '..', 'users.json');

function readUsers() {
    if (!fs.existsSync(usersFile)) return {};
    const data = fs.readFileSync(usersFile, 'utf8');
    return JSON.parse(data);
}

function writeUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

module.exports = { readUsers, writeUsers };