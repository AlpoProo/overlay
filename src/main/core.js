const fs = require('fs')
const os = require('os')
const path = require('path')

const homeDir = os.homedir();


const CLIENT_PATHS = {
    lunar: path.join(homeDir, '.lunarclient', 'offline', 'multiver', 'logs', 'latest.log'), // Lunar Client log yolu
    badlion: 'path/to/badlion/logs/latest.log',
    vanilla: 'path/to/vanilla/logs/latest.log',
    labymod: 'path/to/labymod/logs/latest.log',
    myau: 'path/to/myau/logs/latest.log',
    adjust: 'path/to/adjust/logs/latest.log',
    opal: 'path/to/opal/logs/latest.log',
    raven: 'path/to/raven/logs/latest.log'
};



function readLogFile(client) {
    const logPath = CLIENT_PATHS[client];
    if (!logPath) {
        throw new Error('Invalid client selected');
    }

    return fs.readFileSync(logPath, 'utf-8');
}

function extractPlayersFromLog(logContent) {
    const whoCommandLine = logContent.split('\n').find(line => line.includes('/who'));
    if (!whoCommandLine) {
        return [];
    }

    const players = whoCommandLine.match(/\[.*\]\s(\w+)/g);
    return players ? players.map(player => player.split(' ')[1]) : [];
}

module.exports = {
    extractPlayersFromLog,
    readLogFile
}