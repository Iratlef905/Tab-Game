const fs = require('fs');
const path = require('path');

const rankingFile = path.join(__dirname, '..', 'ranking.json');

function initRankingFile() {
    if (!fs.existsSync(rankingFile)) {
        fs.writeFileSync(rankingFile, JSON.stringify(sampleData, null, 2));
        console.log('ranking.json created with ');
    }
}

function readRanking() {
    initRankingFile(); // Garante que o arquivo existe
    const data = fs.readFileSync(rankingFile, 'utf8');
    return JSON.parse(data);
}

function writeRanking(ranking) {
    fs.writeFileSync(rankingFile, JSON.stringify(ranking, null, 2));
}

function getRanking(group, size) {
    const ranking = readRanking();
    const key = `${group}-${size}`;
    
    if (!ranking[key]) {
        return [];
    }
    
    // Ordena por vitórias decrescentes, depois por menor número de jogos
    return ranking[key].sort((a, b) => {
        if (b.victories !== a.victories) {
            return b.victories - a.victories;
        }
        return a.games - b.games;
    });
}

// Função para adicionar resultado (para testes manuais)
function addResult(group, size, nick, isVictory) {
    const ranking = readRanking();
    const key = `${group}-${size}`;
    
    if (!ranking[key]) {
        ranking[key] = [];
    }
    
    let playerEntry = ranking[key].find(p => p.nick === nick);
    
    if (playerEntry) {
        if (isVictory) {
            playerEntry.victories += 1;
        }
        playerEntry.games += 1;
    } else {
        ranking[key].push({
            nick: nick,
            victories: isVictory ? 1 : 0,
            games: 1
        });
    }
    
    // Reordenar
    ranking[key].sort((a, b) => {
        if (b.victories !== a.victories) {
            return b.victories - a.victories;
        }
        return a.games - b.games;
    });
    
    writeRanking(ranking);
    console.log(`✅ Resultado adicionado: ${nick} - ${isVictory ? 'Vitória' : 'Derrota'} no grupo ${group}, tamanho ${size}`);
}

module.exports = {
    getRanking,
    readRanking,
    writeRanking,
    addResult,
    initRankingFile
};