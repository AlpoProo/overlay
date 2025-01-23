const path = require('path')
const { app, BrowserWindow, ipcMain } = require('electron')
const axios = require('axios')

let mainWindow;

const HYPIXEL_API_URL = 'https://api.hypixel.net/key';
const HYPIXEL_PLAYER_STATS_URL = 'https://api.hypixel.net/player';

const api = require('./api.js')
const core = require('./core.js')


app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        titleBarOverlay: false,
        titleBarStyle: 'hidden',
        transparent: true, // Arkaplanı şeffaf yap
        frame: false, // Pencere çerçevesini kaldır
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Absolute path for preload
            nodeIntegration: true,
            contextIsolation: true
        },
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    if (process.argv[2] && process.argv[2].startsWith('dev')) {
        mainWindow.webContents.toggleDevTools(); // Open DevTools in development mode
    }

    ipcMain.on('validate-api-key', async (event, apiKey) => {

        
        const isValid = await api.validateApiKey(apiKey);
        
        mainWindow.webContents.send('api-key-validation', isValid)
        // bu çalışmıyo gibi event.reply('api-key-validation-result', isValid);
    });

    ipcMain.on('request-player-stats', async (event, { apiKey, client }) => {
        const logContent = readLogFile(client);
        const players = extractPlayersFromLog(logContent);
        const stats = await getAllPlayersStats(apiKey, players);
        mainWindow.webContents.send('player-stats-response', stats);
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
