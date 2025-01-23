const { app, contextBridge, ipcRenderer } = require('electron')

// electron main process ve renderer arasındaki köprüdür.
// tarayıcı javascript ortamına server'dan nelerin yükleneceğini belirtir


contextBridge.exposeInMainWorld('Electron', {
    titlebar: () => {
        return new Titlebar({backgroundColor: TitlebarColor.fromHex('#6A4C30')})
    },
    sendMessage: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    receiveMessage: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
    
})