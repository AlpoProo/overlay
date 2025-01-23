const consoled = require('consoled.js');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Kullanıcının ana dizini
const homeDir = os.homedir();

// Log dosyalarının yolları
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

/**
 * Belirtilen log dosyasını izler ve değişiklik olduğunda callback fonksiyonunu çağırır.
 * @param {string} client - İzlenecek client türü (örneğin: "lunar").
 * @param {function} callback - Yeni log verileri geldiğinde çağrılacak fonksiyon.
 */
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
    fs.watchFile(logPath, { interval: 10000 }, (curr, prev) => {
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
            consoled.bright.blue('log dosyasının sonu okundu')
            callback(content);
        }
    });

    
}

/**
 * Log dosyasından /who komutunu analiz eder ve oyuncu isimlerini çıkarır.
 * @param {string} logContent - Log dosyasının içeriği.
 * @returns {string[]} Oyuncu isimlerinin listesi.
 */
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

    consoled.green('extractPlayersFromLog executed')
    return players;
}

/**
 * Örnek bir callback fonksiyonu: Oyuncu isimlerini log dosyasından çekip konsola yazdırır.
 * @param {string} content - Log dosyasından gelen içerik.
 */
function onLogUpdate(content) {
    const players = extractPlayersFromLog(content);
    console.log('Bulunan oyuncular:', players);
}

// Örnek kullanım
try {
    // Lunar client için log dosyasını izlemeye başla
    readLogFile('lunar', onLogUpdate);
} catch (error) {
    console.error('Hata:', error.message);
}
