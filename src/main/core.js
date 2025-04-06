const consoled = require('consoled.js');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Kullanıcının ana dizini
const homeDir = os.homedir();

// Log dosyalarının yolları - farklı istemciler için
const logPaths = {
    lunar: path.join(homeDir, '.lunarclient', 'offline', 'multiver', 'logs', 'latest.log'),
    badlion: path.join(homeDir, 'AppData', 'Roaming', '.minecraft', 'logs', 'blclient', 'minecraft', 'latest.log'),
    vanilla: path.join(homeDir, 'AppData', 'Roaming', '.minecraft', 'logs', 'latest.log'),
    labymod: path.join(homeDir, 'AppData', 'Roaming', '.minecraft', 'logs', 'latest.log'),
    myau: path.join(homeDir, '.minecraft', 'logs', 'latest.log'),
    adjust: path.join(homeDir, 'AppData', 'Roaming', '.minecraft', 'logs', 'latest.log'),
    opal: path.join(homeDir, 'AppData', 'Roaming', '.minecraft', 'logs', 'latest.log'),
    raven: path.join(homeDir, 'AppData', 'Roaming', '.minecraft', 'logs', 'latest.log')
};

// Lunar Client alternatif log yolları (birden çok olası yol deneme)
const lunarAltPaths = [
    path.join(homeDir, 'AppData', 'Roaming', '.lunarclient', 'offline', 'multiver', 'logs', 'latest.log'),
    path.join(homeDir, '.lunarclient', 'offline', 'multiver', 'logs', 'latest.log'),
    path.join(homeDir, '.lunarclient', 'offline', '1.8', 'logs', 'latest.log'),
    path.join(homeDir, '.lunarclient', 'offline', '1.7', 'logs', 'latest.log')
];

// Windows ve macOS için farklı yol kontrolü
if (process.platform === 'darwin') {
    logPaths.vanilla = path.join(homeDir, 'Library', 'Application Support', 'minecraft', 'logs', 'latest.log');
    logPaths.badlion = path.join(homeDir, 'Library', 'Application Support', 'minecraft', 'logs', 'blclient', 'minecraft', 'latest.log');
    // diğer macOS yolları...
} else if (process.platform === 'linux') {
    logPaths.vanilla = path.join(homeDir, '.minecraft', 'logs', 'latest.log');
    // diğer Linux yolları...
}

/**
 * Belirtilen log dosyasını izler ve değişiklik olduğunda callback fonksiyonunu çağırır.
 * @param {string} client - İzlenecek client türü (örneğin: "lunar").
 * @param {function} callback - Yeni log verileri geldiğinde çağrılacak fonksiyon.
 */
function readLogFile(client, callback) {
    const logPath = logPaths[client];
    if (!logPath) {
        consoled.bright.red(`Geçersiz client: ${client}`);
        return callback(null);
    }

    consoled.bright.cyan(`Client: ${client} | Logfile: ${logPath}`);

    if (!fs.existsSync(logPath)) {
        consoled.bright.yellow(`Log dosyası bulunamadı: ${logPath}`);
        return callback(null);
    }

    try {
        // İlk okuma - mevcut durumu almak için
        readLatestLogContent(logPath, callback);
    
    // Log dosyasını eşzamanlı olarak izle
        fs.watchFile(logPath, { interval: 3000 }, (curr, prev) => {
            if (curr.mtime > prev.mtime) {
                consoled.bright.blue('Log dosyası değişikliği tespit edildi');
                readLatestLogContent(logPath, callback);
            }
        });
    } catch (error) {
        consoled.bright.red('Log dosyası okuma hatası:', error);
        return callback(null);
    }
}

/**
 * Log dosyasının son kısmını okur
 * @param {string} logPath - Log dosyasının yolu
 * @param {function} callback - Okuma sonrası çağrılacak fonksiyon
 */
function readLatestLogContent(logPath, callback) {
    try {
        // Log dosyasının son 4096 byte'ını oku (daha fazla veri için)
            const fileSize = fs.statSync(logPath).size;
        const bufferSize = Math.min(fileSize, 4096); // Dosya boyutundan fazla okumaya çalışma
            const buffer = Buffer.alloc(bufferSize);

            const fd = fs.openSync(logPath, 'r');
            fs.readSync(fd, buffer, 0, bufferSize, fileSize - bufferSize);
            fs.closeSync(fd);

            const content = buffer.toString('utf-8');
            callback(content);
    } catch (error) {
        consoled.bright.red('Log içeriği okuma hatası:', error);
        callback(null);
        }
}

/**
 * Log dosyasından /who komutunu analiz eder ve oyuncu isimlerini çıkarır.
 * @param {string} logContent - Log dosyasının içeriği.
 * @returns {string[]} Oyuncu isimlerinin listesi.
 */
function extractPlayersFromLog(logContent) {
    if (!logContent) {
        return [];
    }

    // Farklı formatlar için arama yaparak en son /who komutunun çıktısını bul
    const patterns = [
        /\[CHAT\] ONLINE: (.*)/i,
        /\[CHAT\] Online Players \((\d+)\): (.*)/i,
        /\[CHAT\] \(\d+\) (.*)/i
    ];

    let players = [];
    const lines = logContent.split('\n');

    // Log satırlarını sondan başa doğru tara (en son veriler için)
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        
        // Her pattern'i dene
        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                // İkinci grup varsa kullan, yoksa ilk grubu kullan
                const playerList = match[2] ? match[2] : match[1];
                players = playerList.split(', ').map(p => p.trim());
                
                // Oyuncular bulunduğunda aramayi sonlandır
                consoled.green(`${players.length} oyuncu bulundu`);
    return players;
            }
        }
    }

    consoled.yellow('Log içinde oyuncu listesi bulunamadı');
    return [];
}

/**
 * Oyun tipi tespiti yapar
 * @param {string} logContent - Log dosyasının içeriği
 * @returns {string} Oyun tipi (bedwars, skywars, vb.)
 */
function detectGameType(logContent) {
    if (!logContent) return 'unknown';
    
    const lowerContent = logContent.toLowerCase();
    
    if (lowerContent.includes('bedwars') || lowerContent.includes('bed wars')) {
        return 'bedwars';
    } else if (lowerContent.includes('skywars') || lowerContent.includes('sky wars')) {
        return 'skywars';
    } else if (lowerContent.includes('duels') || lowerContent.includes('duel')) {
        return 'duels';
    }
    
    return 'unknown';
}

/**
 * Log dosyasının son satırını okur ve işler
 * @param {string} client - Minecraft client adı
 * @param {function} callback - callback fonksiyonu
 */
function readLastLogLine(client, callback) {
    try {
        // Ana log yolu
        let logPath = logPaths[client];
        
        if (!logPath) {
            console.error(`Log path for ${client} is not defined`);
            callback(null);
            return;
        }
        
        // Lunar Client için alternatif yolları kontrol et
        if (client === 'lunar' && !fs.existsSync(logPath)) {
            consoled.bright.yellow(`Main Lunar Client log path not found, trying alternatives`);
            
            // Alternatif yolları dene
            for (const altPath of lunarAltPaths) {
                if (fs.existsSync(altPath)) {
                    consoled.bright.green(`Found alternative Lunar Client log path: ${altPath}`);
                    logPath = altPath;
                    break;
                }
            }
        }
        
        // Log yolu hala bulunamadı
        if (!fs.existsSync(logPath)) {
            consoled.bright.red(`Log file does not exist: ${logPath}`);
            consoled.bright.yellow(`Please make sure Lunar Client is installed and has been run at least once`);
            callback(null);
            return;
        }
        
        // Log dosyasını oku
        fs.readFile(logPath, 'utf8', (err, data) => {
            if (err) {
                consoled.bright.red(`Could not read log file for ${client}: ${err.message}`);
                consoled.bright.yellow(`Error details: ${JSON.stringify(err)}`);
                callback(null);
                return;
            }
            
            // Dosya boş ise
            if (!data || data.trim() === '') {
                consoled.bright.yellow(`Log file is empty for ${client}`);
                callback(null);
                return;
            }
            
            // Satırlara ayır ve son /who komutunu bul
            const lines = data.split('\n');
            let lastWhoLine = null;
            
            // En son /who komutunu bulmak için sondan başa doğru tara
            for (let i = lines.length - 1; i >= 0; i--) {
                // Daha geniş bir arama yap - birkaç farklı /who formatını kontrol et
                if (lines[i].includes('[CHAT]') && 
                   (lines[i].includes('Online Players (') || 
                    lines[i].includes('ONLINE:') || 
                    lines[i].toLowerCase().includes('online:') ||
                    (lines[i].includes('(') && lines[i].includes(')') && lines[i].includes(':')))) {
                    lastWhoLine = lines[i];
                    break;
                }
            }
            
            // WHO komutu bulunamadıysa kullanıcıyı bilgilendir
            if (lastWhoLine) {
                consoled.bright.green(`Found WHO command in log for ${client}`);
                callback(lastWhoLine);
            } else {
                consoled.bright.yellow(`No WHO command found in log for ${client}`);
                consoled.bright.cyan(`Please type '/who' in your Minecraft chat to see players in your game`);
                callback(null);
            }
        });
    } catch (e) {
        consoled.bright.red('Error reading log file:', e.message);
        consoled.bright.yellow(`Error stack: ${e.stack}`);
        callback(null);
    }
}

/**
 * Son /who komutundan oyuncuları çıkar
 * @param {string} lastLogLine - Log dosyasının son /who satırı
 * @returns {Array} - Oyuncu adları listesi
 */
function extractPlayersFromLastLine(lastLogLine) {
    // Eğer satır boşsa boş dizi döndür
    if (!lastLogLine) return [];
    
    try {
        consoled.bright.cyan(`Processing log line: ${lastLogLine}`);
        
        // Sadece ONLINE: ile başlayan oyuncu listelerini algıla
        if (lastLogLine.includes('ONLINE:')) {
            // ONLINE: formatını işle
            const onlineIndex = lastLogLine.indexOf('ONLINE:');
            if (onlineIndex !== -1) {
                const playerListStr = lastLogLine.substring(onlineIndex + 'ONLINE:'.length).trim();
                if (playerListStr) {
                    // Virgülle ayrılmış oyuncu listesini ayır, boşlukları kırp
                    const playerList = playerListStr.split(/,\s*/).map(name => name.trim()).filter(name => name.length > 0);
                    consoled.bright.green(`Found ${playerList.length} players using ONLINE format: ${playerList.join(', ')}`);
                    return playerList;
                }
            }
        }
        
        // Online Players formatını kontrol et
        const onlinePlayersMatch = lastLogLine.match(/Online Players \((\d+)\):\s*(.*)/i);
        if (onlinePlayersMatch && onlinePlayersMatch[2]) {
            const playerListStr = onlinePlayersMatch[2].trim();
            if (playerListStr) {
                const playerList = playerListStr.split(/,\s*/).map(name => name.trim()).filter(name => name.length > 0);
                consoled.bright.green(`Found ${playerList.length} players using Online Players format: ${playerList.join(', ')}`);
                return playerList;
            }
        }
        
        // Basit parantez ve sayı formatını kontrol et - örn: [CHAT] (8): Bxluga, Stableghosts, ...
        const numberFormatMatch = lastLogLine.match(/\[CHAT\]\s*\((\d+)\):\s*(.*)/i);
        if (numberFormatMatch && numberFormatMatch[2]) {
            const playerListStr = numberFormatMatch[2].trim();
            if (playerListStr) {
                const playerList = playerListStr.split(/,\s*/).map(name => name.trim()).filter(name => name.length > 0);
                consoled.bright.green(`Found ${playerList.length} players using number format: ${playerList.join(', ')}`);
                return playerList;
            }
        }
        
        // Özel WHO komut formatı (doğrudan "WHO:" ile başlayanlar)
        if (lastLogLine.includes('WHO:')) {
            const whoIndex = lastLogLine.indexOf('WHO:');
            if (whoIndex !== -1) {
                const playerListStr = lastLogLine.substring(whoIndex + 'WHO:'.length).trim();
                if (playerListStr) {
                    const playerList = playerListStr.split(/,\s*/).map(name => name.trim()).filter(name => name.length > 0);
                    consoled.bright.green(`Found ${playerList.length} players using WHO: format: ${playerList.join(', ')}`);
                    return playerList;
                }
            }
        }
        
        // Net olmayan durumlarda, sadece kesin oyuncu listesi formatlarını arıyoruz
        // [CHAT] içeren ve ": " ile oyuncu listesi olabilecek bölümleri kontrol et
        if (lastLogLine.includes('[CHAT]') && lastLogLine.includes(':')) {
            // Son çare olarak kullanmak yerine daha sıkı kontroller yapalım
            // Sadece belirli formatlara uyan satırlar için oyuncu listesi çıkarmaya çalışalım
            
            // Oyuncu listesi tipik belirteçleri
            const playerListIndicators = [
                'ONLINE', 'online', 'Online', 'players', 'Players', 'WHO', 
                ' in game', ' in the game', 'Currently playing'
            ];
            
            // Bu belirteçlerden birinin olup olmadığını kontrol et
            const hasIndicator = playerListIndicators.some(indicator => lastLogLine.includes(indicator));
            
            if (hasIndicator) {
                const chatParts = lastLogLine.split('[CHAT]');
                if (chatParts.length > 1) {
                    const chatText = chatParts[1].trim();
                    
                    // Son : işaretini bul 
                    const colonIndex = chatText.lastIndexOf(':');
                    if (colonIndex !== -1) {
                        const playerListStr = chatText.substring(colonIndex + 1).trim();
                        if (playerListStr && playerListStr.includes(',')) {  // Virgülle ayrılmış liste olmalı
                            const playerList = playerListStr.split(/,\s*/).map(name => name.trim()).filter(name => name.length > 0);
                            // Oyuncu adları belirlenen kurallara uymalı: 3-16 karakter, sadece harf, rakam ve alt çizgi
                            const validPlayerNames = playerList.filter(name => 
                                name.length >= 3 && name.length <= 16 && /^[A-Za-z0-9_]+$/.test(name)
                            );
                            
                            if (validPlayerNames.length > 0) {
                                consoled.bright.green(`Found ${validPlayerNames.length} valid player names in chat text: ${validPlayerNames.join(', ')}`);
                                return validPlayerNames;
                            }
                        }
                    }
                }
            }
        }
        
        // Hiçbir format uyuşmadı, uyarı ver
        consoled.bright.yellow(`Could not find player list in log line: ${lastLogLine}`);
        consoled.bright.red(`Line does not match any known player list format`);
        
    } catch (e) {
        console.error('Error extracting players from log line:', e.message);
        consoled.bright.red(`Error details: ${e.stack}`);
    }
    
    consoled.bright.yellow('Could not extract players from log line');
    return [];
}

module.exports = {
    readLogFile,
    readLastLogLine,
    extractPlayersFromLog,
    extractPlayersFromLastLine,
    detectGameType,
    logPaths,
    lunarAltPaths
}