import path from 'path';
import { app, BrowserWindow, ipcMain } from "electron";
import { attachTitlebarToWindow, setupTitlebar } from 'custom-electron-titlebar/main';
import axios from 'axios';
import fs from 'fs';

let mainWindow;

const HYPIXEL_API_URL = 'https://api.hypixel.net/key';
const HYPIXEL_PLAYER_STATS_URL = 'https://api.hypixel.net/player';

const CLIENT_PATHS = {
    lunar: 'path/to/lunar/logs/latest.log',
    badlion: 'path/to/badlion/logs/latest.log',
    vanilla: 'path/to/vanilla/logs/latest.log',
    labymod: 'path/to/labymod/logs/latest.log',
    myau: 'path/to/myau/logs/latest.log',
    adjust: 'path/to/adjust/logs/latest.log',
    opal: 'path/to/opal/logs/latest.log',
    raven: 'path/to/raven/logs/latest.log'
};

async function validateApiKey(apiKey) {
    try {
        const response = await axios.get(HYPIXEL_API_URL, {
            params: {
                key: apiKey
            }
        });
        return response.data.success;
    } catch (error) {
        console.error('API key validation failed:', error);
        return false;
    }
}

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

async function getPlayerStats(apiKey, playerName) {
    try {
        const response = await axios.get(HYPIXEL_PLAYER_STATS_URL, {
            params: {
                key: apiKey,
                name: playerName
            }
        });
        return response.data.player.stats.Bedwars;
    } catch (error) {
        console.error(`Failed to fetch stats for player ${playerName}:`, error);
        return null;
    }
}

async function getAllPlayersStats(apiKey, players) {
    const statsPromises = players.map(player => getPlayerStats(apiKey, player));
    return await Promise.all(statsPromises);
}

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        titleBarOverlay: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            preload: path.join(import.meta.dirname, 'preload.js'), // Optional
            nodeIntegration: true,
            contextIsolation: true
        },
    });

    ipcMain.on('validate-api-key', async (event, apiKey) => {
        const isValid = await validateApiKey(apiKey);
        event.reply('api-key-validation-result', isValid);
    });

    ipcMain.on('request-player-stats', async (event, { apiKey, client }) => {
        const logContent = readLogFile(client);
        const players = extractPlayersFromLog(logContent);
        const stats = await getAllPlayersStats(apiKey, players);
        event.reply('player-stats-response', stats);
    });

    mainWindow.loadFile(path.join(import.meta.dirname, '../renderer/index.html'));
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});