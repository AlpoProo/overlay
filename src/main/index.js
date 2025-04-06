const path = require('path');
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const events = require('events');
const fs = require('fs');

const consoled = require('consoled.js');
const api = require('./api.js');
const core = require('./core.js');

// MaxListeners uyarısını çözmek için limit artırımı
events.EventEmitter.defaultMaxListeners = 15;

let mainWindow;
let gameType = 'bedwars'; // Default game type
let autoDetectGame = true; // Auto-detect game type

// Log settings
consoled.bright.blue('Starting application...');

// Create main Electron window
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 650,
        height: 350,
        minWidth: 650,
        minHeight: 300,
        titleBarOverlay: false,
        alwaysOnTop: true,
        titleBarStyle: 'hidden',
        transparent: true,
        backgroundColor: '#00000000', // Transparent background
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
    });

    // Sabit opaklık değeri ayarla (0.8 = %80 opak)
    mainWindow.setOpacity(0.8);

    // Load main HTML file
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Open developer tools (only in dev mode)
    if (process.argv[2] && process.argv[2].startsWith('dev')) {
        mainWindow.webContents.toggleDevTools();
        consoled.bright.yellow('Developer mode active');
    }

    // When window is closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    
    // Open external links in default browser
    mainWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });
}

// When app is ready
app.on('ready', createWindow);

// API key validation
ipcMain.on('validate-api-key', async (event, apiKey) => {
    consoled.blue('Validating API key:', apiKey.slice(0, 4) + '****');
    const isValid = await api.validateApiKey(apiKey);
    mainWindow.webContents.send('api-key-validation', isValid);
});

// Get player statistics
let playerCache = "";
let statCache;
let logWatchInterval;

ipcMain.on('request-player-stats', async (event, { apiKey, client, requestedGameType }) => {
    // Update game type (if specified)
    if (requestedGameType) {
        gameType = requestedGameType;
        consoled.blue(`Game type updated: ${gameType}`);
    }
    
    consoled.cyan(`Client: ${client}, API Key: ${apiKey.slice(0, 4)}***, Game type: ${gameType}`);
    
    // Start first log read
    processLogFile(client, apiKey);
    
    // Check log file periodically
    clearInterval(logWatchInterval);
    logWatchInterval = setInterval(() => {
        processLogFile(client, apiKey);
    }, 3000);
});

/**
 * Process log file and send statistics
 * @param {string} client - Minecraft client
 * @param {string} apiKey - Hypixel API key
 */
function processLogFile(client, apiKey) {
    try {
        // Lunar Client için tüm olası yolları kontrol et
        if (client === 'lunar') {
            const possiblePaths = [core.logPaths.lunar, ...core.lunarAltPaths];
            let foundPath = null;
            
            for (const path of possiblePaths) {
                if (fs.existsSync(path)) {
                    foundPath = path;
                    consoled.bright.green(`Found valid log file for ${client} at: ${path}`);
                    break;
                }
            }
            
            if (!foundPath) {
                consoled.bright.red(`No valid log file found for ${client} after checking all paths`);
                mainWindow.webContents.send('player-stats-response', []);
                return;
            }
            
            readAndProcessLog(client, foundPath, apiKey);
        } else {
            // Diğer client'lar için standart yolu kullan
            const logPath = core.logPaths[client];
            consoled.bright.cyan(`Checking log file for ${client} at: ${logPath}`);
            
            if (!fs.existsSync(logPath)) {
                consoled.bright.yellow(`Log file not found for ${client} at: ${logPath}`);
                mainWindow.webContents.send('player-stats-response', []);
                return;
            }
            
            readAndProcessLog(client, logPath, apiKey);
        }
    } catch (error) {
        consoled.red('Log processing error:', error.message);
        consoled.red('Error stack:', error.stack);
        mainWindow.webContents.send('player-stats-response', []);
    }
}

/**
 * Log dosyasını oku ve işle
 * @param {string} client - Minecraft client
 * @param {string} logPath - Log dosyası yolu
 * @param {string} apiKey - Hypixel API key
 */
function readAndProcessLog(client, logPath, apiKey) {
    // Sadece log dosyasının son "/who" komutunu içeren satırını oku
    core.readLastLogLine(client, async (lastLogLine) => {
        if (!lastLogLine) {
            consoled.yellow(`Could not read log content for ${client}`);
            // Burada boş liste göndermek yerine mevcut istatistikleri koruyor, sadece bilgi mesajı
            consoled.cyan(`Lütfen oyuncuları görmek için Minecraft sohbetine '/who' yazın`);
            return;
        }
        
        // /who komutunu içeren bir log satırı olup olmadığını kontrol et
        const containsWhoCommand = 
            lastLogLine.includes('ONLINE:') || 
            lastLogLine.includes('Online Players') || 
            lastLogLine.includes('WHO:') ||
            (lastLogLine.includes('[CHAT]') && lastLogLine.includes('(') && lastLogLine.includes(')') && lastLogLine.includes(':'));
        
        if (!containsWhoCommand) {
            consoled.yellow(`Geçerli bir /who komutu bulunamadı: ${lastLogLine}`);
            return;
        }
        
        // Detect game type (if auto-detection is enabled)
        if (autoDetectGame) {
            const detectedGameType = core.detectGameType(lastLogLine);
            if (detectedGameType !== 'unknown') {
                gameType = detectedGameType;
                consoled.blue(`Detected game type: ${gameType}`);
            }
        }
        
        // Son log satırından oyuncuları çıkar
        const players = core.extractPlayersFromLastLine(lastLogLine);

        if (players.length > 0) {
            // Oyuncu listesini karşılaştır (sıradan bağımsız olarak)
            const currentPlayers = new Set(players);
            let previousPlayers = new Set();
            
            if (playerCache) {
                previousPlayers = new Set(playerCache.split(','));
            }
            
            // Oyuncu listelerini karşılaştır
            let playersChanged = false;
            
            // Oyuncu sayısı değişti mi?
            if (currentPlayers.size !== previousPlayers.size) {
                playersChanged = true;
                consoled.green(`Oyuncu sayısı değişti: ${previousPlayers.size} -> ${currentPlayers.size}`);
            } else {
                // Yeni oyuncu geldi mi veya oyuncu çıktı mı?
                for (const player of currentPlayers) {
                    if (!previousPlayers.has(player)) {
                        playersChanged = true;
                        consoled.green(`Yeni oyuncu: ${player}`);
                        break;
                    }
                }
                
                if (!playersChanged) {
                    for (const player of previousPlayers) {
                        if (!currentPlayers.has(player)) {
                            playersChanged = true;
                            consoled.green(`Oyuncu ayrıldı: ${player}`);
                            break;
                        }
                    }
                }
            }
            
            // Oyuncu listesi değiştiyse yeni istatistikleri al
            if (playersChanged || !statCache) {
                consoled.green(`Oyuncu listesi değişti, ${players.length} oyuncu için istatistik alınıyor...`);
                const stats = await api.getAllPlayersStats(apiKey, players, gameType);
                mainWindow.webContents.send('player-stats-response', stats);
                statCache = stats;
                playerCache = players.join(',');
            } else {
                consoled.yellow('Oyuncu listesi aynı, yeni istek yapılmıyor');
                if (statCache) {
                    mainWindow.webContents.send('player-stats-response', statCache);
                }
            }
        } else {
            consoled.yellow('Log satırı geçerli bir /who komutu içeriyor ancak oyuncu ayrıştırılamadı');
            consoled.cyan(`Log satırı: ${lastLogLine}`);
            // Oyuncu listesi bulunamadığında boş liste göndermek yerine, mevcut statları koruyoruz
        }
    });
}

// Listen for window control button messages
ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.on('close-window', () => {
    mainWindow.close();
});

// Change game type
ipcMain.on('change-game-type', (event, type) => {
    gameType = type;
    consoled.blue(`Game type manually changed to: ${gameType}`);
    
    // If there's a cache, re-analyze the same players with the new game type
    if (playerCache && playerCache.length > 0) {
        const players = playerCache.split(',');
        const apiKey = mainWindow.webContents.session.cookies.get({ name: 'hypixel_api_key' })
            .then((cookies) => {
                if (cookies.length > 0) {
                    return cookies[0].value;
                }
                return null;
            })
            .catch(() => null);
            
        if (apiKey) {
            consoled.green('Requesting statistics for existing players with new game type...');
            api.getAllPlayersStats(apiKey, players, gameType)
                .then(stats => {
                    mainWindow.webContents.send('player-stats-response', stats);
                    statCache = stats;
                });
        }
    }
});

// Change always on top setting
ipcMain.on('toggle-always-on-top', (event, alwaysOnTop) => {
    if (mainWindow) {
        mainWindow.setAlwaysOnTop(alwaysOnTop);
        consoled.blue(`Always on top: ${alwaysOnTop ? 'Enabled' : 'Disabled'}`);
    }
});

// Change auto game type detection setting
ipcMain.on('toggle-auto-detect-game', (event, autoDetect) => {
    autoDetectGame = autoDetect;
    consoled.blue(`Auto game type detection: ${autoDetect ? 'Enabled' : 'Disabled'}`);
});

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    clearInterval(logWatchInterval);
    if (process.platform !== 'darwin') app.quit();
});

// On macOS, recreate window when dock icon is clicked
app.on('activate', () => {
    if (mainWindow === null) createWindow();
});

// Daraltma modunda fare tıklamalarını sadece gizli kısımlar için geçirmek
ipcMain.on('toggle-collapsed-mode', (_, ignore) => {
    try {
        // Pencere kontrollerinin çalışması için fare olaylarını TAMAMEN devre dışı bırakmıyoruz!
        // Sadece setIgnoreMouseEvents kullanmak yerine click-through kısmını kapatıyoruz
        // Bu şekilde başlık çubuğunun tamamı tıklanabilir olacak
        
        // Tamamen şeffaflaştır ama fare olaylarını geçirme
        mainWindow.setOpacity(0.8); // Opaklığı koru
        
        // Önemli: Fare olaylarını tamamen devre dışı bırakmıyoruz, click-through özelliğini kullanmıyoruz
        // Bu şekilde başlık çubuğu ve pencere kontrolleri normal şekilde çalışacak
        
        // Tıklanabilir bölgeler oluşturmaya gerek yok, çünkü tüm pencere tıklanabilir olacak
        // İçerik görünmez olsa bile, tıklanabilir olacak
        consoled.bright.green('Daraltılmış mod etkinleştirildi: Tüm pencere tıklanabilir, içerik görünmez');
        
        // Önemli: Renderer'a bir mesaj gönderelim ki orada da uygun CSS stillerini uygulayabilsin
        mainWindow.webContents.send('collapsed-mode-activated');
    } catch (error) {
        consoled.bright.red('toggle-collapsed-mode hata:', error);
    }
});

// Normal moda dönüş için
ipcMain.on('restore-window-mode', () => {
    try {
        // Normal moda dönüldüğünde fare olaylarını normal işleme
        // Opaklığı eski haline getir
        mainWindow.setOpacity(0.8);
        consoled.bright.green('Normal pencere moduna dönüldü: Fare olayları normal işleniyor');
        
        // Renderer'a normal moda dönüldüğünü bildir
        mainWindow.webContents.send('normal-mode-activated');
    } catch (error) {
        consoled.bright.red('restore-window-mode hata:', error);
    }
});

/**
 * Log dosyasının son satırını düzeltilmiş versiyonu
 * @param {string} client - Minecraft client adı
 * @param {function} callback - callback fonksiyonu
 */
core.readLastLogLine = function(client, callback) {
    try {
        // Ana log yolu
        let logPath = core.logPaths[client];
        
        if (!logPath) {
            console.error(`Log path for ${client} is not defined`);
            callback(null);
            return;
        }
        
        // Lunar Client için alternatif yolları kontrol et
        if (client === 'lunar' && !fs.existsSync(logPath)) {
            consoled.bright.yellow(`Main Lunar Client log path not found, trying alternatives`);
            
            // Alternatif yolları dene
            for (const altPath of core.lunarAltPaths) {
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
                // Daha spesifik arama - kesin WHO komutu çıktısı içeren satırlar
                const line = lines[i];
                
                // ONLINE: içeren satırlar (en yaygın who formatı)
                if (line.includes('[CHAT]') && line.includes('ONLINE:')) {
                    lastWhoLine = line;
                    consoled.bright.green(`Found WHO command with ONLINE: format`);
                    break;
                }
                
                // "Online Players (sayı):" formatı
                if (line.includes('[CHAT]') && line.includes('Online Players (')) {
                    lastWhoLine = line;
                    consoled.bright.green(`Found WHO command with Online Players format`);
                    break;
                }
                
                // Parantez + sayı + virgülle ayrılmış isimler formatı
                if (line.includes('[CHAT]') && 
                    line.includes('(') && 
                    line.includes(')') && 
                    line.includes(':') && 
                    /\([0-9]+\)/.test(line) && 
                    line.includes(',')) {
                    lastWhoLine = line;
                    consoled.bright.green(`Found WHO command with numbered list format`);
                    break;
                }
                
                // WHO: formatı
                if (line.includes('[CHAT]') && line.includes('WHO:')) {
                    lastWhoLine = line;
                    consoled.bright.green(`Found WHO command with WHO: format`);
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