const fs = require('fs');
const path = require('path');

console.log(' verification \n');

// check files
const files = [
    { path: 'index.js', required: true },
    { path: 'modules/serverRoutes.js', required: true },
    { path: 'modules/gameLogic.js', required: true },
    { path: 'modules/utils.js', required: true },
    { path: 'ranking.json', required: false },
    { path: 'users.json', required: false },
    { path: 'games.json', required: false }
];

files.forEach(file => {
    const fullPath = path.join(__dirname, file.path);
    const exists = fs.existsSync(fullPath);
    console.log(`${file.path} ${exists ? 'found' : 'not found'}`);
});

const rankingPath = path.join(__dirname, 'ranking.json');
if (fs.existsSync(rankingPath)) {
    try {
        const data = JSON.parse(fs.readFileSync(rankingPath, 'utf8'));
        console.log(`\n ranking data`);
        Object.keys(data).forEach(key => {
            console.log(`   ${key}: ${data[key].length} players`);
        });
    } catch (e) {
        console.log('ranking.json');
    }
}

console.log('\n🧪 testing imports');
try {
    const { readUsers, writeUsers } = require('./modules/utils');
    console.log('utils loaded');
    
    const { getRanking } = require('./modules/gameLogic');
    console.log('gamelogic loaded');
    
    const ranking = getRanking(99, 9);
    console.log(`ranking loaded: ${ranking.length} players`);
    
} catch (e) {
    console.log('error loading modules', e.message);
}

console.log('\n verification concluded');
console.log('\n iniciate server');
console.log('   cd server');
console.log('   node index.js');