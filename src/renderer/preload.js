const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('Electron', {
    sendMessage: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    onMessage: (channel, callback) => {
        // Renderer'a gelen mesajları dinler ve callback ile işler
        ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
}); 