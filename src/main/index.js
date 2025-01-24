const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');

const consoled = require('consoled.js');
const api = require('./api.js');
const core = require('./core.js');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800, // Pencere genişliği
        height: 300, // Pencere yüksekliği
        titleBarOverlay: false,
        alwaysOnTop: true, // Always on top özelliği
        titleBarStyle: 'hidden',
        transparent: true, // Arka planı şeffaf yapma
        frame: true, // Toolbar ve pencere çerçevesini göster
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true
        },
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    if (process.argv[2] && process.argv[2].startsWith('dev')) {
        mainWindow.webContents.toggleDevTools();
    }

    // API key doğrulama
    ipcMain.on('validate-api-key', async (event, apiKey) => {
        const isValid = await api.validateApiKey(apiKey);
        mainWindow.webContents.send('api-key-validation', isValid);
    });

    // Oyuncu istatistiklerini çekme
    let playerCache = "";
    let statCache;
    ipcMain.on('request-player-stats', async (event, { apiKey, client }) => {
        core.readLogFile(client, async (logContent) => {
            const players = core.extractPlayersFromLog(logContent);

            if (players.length > 0) {
                if (players.join(',') === playerCache) {
                    consoled.yellow('Oyuncu verisi zaten çekilmiş');
                    if (statCache) return mainWindow.webContents.send('player-stats-response', statCache);
                    else return mainWindow.webContents.send('player-stats-response', []);
                } else {
                    const stats = await api.getAllPlayersStats(apiKey, players);
                    mainWindow.webContents.send('player-stats-response', stats);
                    statCache = stats;
                }
                playerCache = players.join(',');
            }
        });
    });

    // Pencere kontrol butonları için mesajları dinle
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
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});