const fs = require('fs');
const os = require('os');
const path = require('path');

const homeDir = os.homedir();

const CLIENT_PATHS = {
    lunar: path.join(homeDir, '.lunarclient', 'offline', 'multiver', 'logs', 'latest.log'),
    badlion: 'path/to/badlion/logs/latest.log',
    vanilla: 'path/to/vanilla/logs/latest.log',
    labymod: 'path/to/labymod/logs/latest.log',
    myau: 'path/to/myau/logs/latest.log',
    adjust: 'path/to/adjust/logs/latest.log',
    opal: 'path/to/opal/logs/latest.log',
    raven: 'path/to/raven/logs/latest.log'
};

function readLogFile(client, callback) {
    console.log(`Log dosyası okunuyor: Client: ${client}`);
    const logPath = CLIENT_PATHS[client];
    if (!logPath) {
        console.error('Geçersiz client seçildi.');
        throw new Error('Invalid client selected');
    }

    console.log(`Log dosyasının yolu: ${logPath}`);

    if (!fs.existsSync(logPath)) {
        console.error('Log dosyası bulunamadı:', logPath);
        throw new Error('Log file not found');
    }

    // Log dosyasını eşzamanlı olarak izle
    fs.watchFile(logPath, { interval: 1000 }, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
            console.log('Log dosyası değişti, yeniden okunuyor.');

            // Log dosyasının son 1024 byte'ını oku
            const fileSize = fs.statSync(logPath).size;
            const bufferSize = 1024; // Son 1024 byte'ı oku
            const buffer = Buffer.alloc(bufferSize);

            const fd = fs.openSync(logPath, 'r');
            fs.readSync(fd, buffer, 0, bufferSize, fileSize - bufferSize);
            fs.closeSync(fd);

            const content = buffer.toString('utf-8');
            console.log('Log dosyasının son kısmı okundu.');
            callback(content);
        }
    });
}

function extractPlayersFromLog(logContent) {
    console.log('Log dosyasından oyuncular çıkarılıyor.');
    
    // /who komutunun çıktısını bul
    const whoCommandLine = logContent.split('\n').find(line => line.includes('[CHAT] ONLINE:'));
    if (!whoCommandLine) {
        console.log('Log dosyasında /who komutu bulunamadı.');
        return [];
    }

    // ONLINE: kısmından sonraki oyuncu isimlerini al
    const playersPart = whoCommandLine.split('[CHAT] ONLINE:')[1].trim();
    const players = playersPart.split(', '); // Oyuncu isimlerini virgülle ayır

    console.log('Oyuncular bulundu:', players);
    return players;
}

module.exports = {
    extractPlayersFromLog,
    readLogFile
};