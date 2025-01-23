const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');

const consoled = require('consoled.js')


const api = require('./api.js');
const core = require('./core.js');

let mainWindow;

app.on('ready', () => {
    console.log('Uygulama başlatıldı.');
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        titleBarOverlay: false,
        alwaysOnTop: false,
        titleBarStyle: 'hidden',
        transparent: true,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true
        },
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    if (process.argv[2] && process.argv[2].startsWith('dev')) {
        console.log('Geliştirici modu açık, DevTools açılıyor.');
        mainWindow.webContents.toggleDevTools();
    }

    ipcMain.on('validate-api-key', async (event, apiKey) => {
        console.log('API anahtarı doğrulanıyor:', apiKey);
        const isValid = await api.validateApiKey(apiKey);
        console.log('API anahtarı doğrulama sonucu:', isValid);
        mainWindow.webContents.send('api-key-validation', isValid);
    });

    ipcMain.on('request-player-stats', async (event, { apiKey, client }) => {
        console.log(`Oyuncu istatistikleri isteniyor. Client: ${client}, API Key: ${apiKey}`);
        core.readLogFile(client, async (logContent) => {
            console.log('Log dosyası okundu, oyuncular çıkarılıyor.');
            const players = core.extractPlayersFromLog(logContent);
            if (players.length > 0) {
                console.log('Oyuncular bulundu:', players);
                const stats = await api.getAllPlayersStats(apiKey, players);
                console.log('Oyuncu istatistikleri alındı:', stats);
                mainWindow.webContents.send('player-stats-response', stats);
            } else {
                console.log('Log dosyasında oyuncu bulunamadı.');
            }
        });
    });
});

app.on('window-all-closed', () => {
    console.log('Tüm pencereler kapatıldı, uygulama sonlandırılıyor.');
    if (process.platform !== 'darwin') app.quit();
});