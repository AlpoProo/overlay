const { contextBridge, ipcRenderer } = require('electron')

// Bridge between electron main process and renderer
// Specifies what to load from the server into the browser javascript environment

// Valid channel names
const validChannels = [
    'validate-api-key',
    'api-key-validation',
    'request-player-stats',
    'player-stats-response',
    'minimize-window',
    'maximize-window',
    'close-window',
    'change-game-type',
    'toggle-always-on-top',
    'toggle-auto-detect-game',
    'toggle-collapsed-mode',
    'no-who-command'
];

contextBridge.exposeInMainWorld('Electron', {
    // Send message from renderer to main process
    sendMessage: (channel, data) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    
    // Receive message from main process
    receiveMessage: (channel, func) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    
    // App version
    appVersion: '1.0.0',
    
    // Operating system info
    platform: process.platform
})