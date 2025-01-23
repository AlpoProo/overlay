import path from 'path'
import.meta.dirname
import { app, BrowserWindow, ipcMain } from "electron";
import { attachTitlebarToWindow, setupTitlebar } from 'custom-electron-titlebar/main'

let mainWindow;

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


    // sunucu ve client eventler tetikleyerek ve arg göndererek iletişim kuruyo
    
    ipcMain('message-from-renderer', (event, args) => {
        console.log('event triggered from client')
        event.reply('message-from-main', [])

    })

})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// main process: nodejs sunucusu
// os ve fs ile etkileşimleri yönetir