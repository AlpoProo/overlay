/**
 * Window Controls Module
 * Manages application window control buttons (minimize, maximize, close, collapse)
 */

export function initWindowControls() {
    console.log('Initializing window controls module...');
    
    // Get window control buttons
    try {
        const minimizeBtn = document.getElementById('minimize-btn');
        const maximizeBtn = document.getElementById('maximize-btn');
        const closeBtn = document.getElementById('close-btn');
        const collapseBtn = document.getElementById('collapse-btn');
        
        // Check for main button existence
        if (!minimizeBtn && !maximizeBtn && !closeBtn && !collapseBtn) {
            console.error('Window control buttons not found in the document');
        }
        
        // Apply click handlers if buttons exist
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                console.log('Minimize button clicked');
                try {
                    if (window.Electron) {
                        window.Electron.sendMessage('minimize-window');
                    } else {
                        console.error('Electron is not available for minimize');
                    }
                } catch (e) {
                    console.error('Error minimizing window:', e);
                }
            });
        }
        
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => {
                console.log('Maximize button clicked');
                try {
                    if (window.Electron) {
                        window.Electron.sendMessage('maximize-window');
                    } else {
                        console.error('Electron is not available for maximize');
                    }
                } catch (e) {
                    console.error('Error maximizing window:', e);
                }
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log('Close button clicked');
                try {
                    if (window.Electron) {
                        window.Electron.sendMessage('close-window');
                    } else {
                        console.error('Electron is not available for close');
                    }
                } catch (e) {
                    console.error('Error closing window:', e);
                }
            });
        }
        
        // Collapse button - special handling
        if (collapseBtn) {
            collapseBtn.addEventListener('click', handleCollapse);
            
            // Check if app was collapsed last time
            const wasCollapsed = localStorage.getItem('collapsed') === 'true';
            if (wasCollapsed) {
                // Don't auto-collapse at startup - user should do it manually
                // But set the button rotation
                collapseBtn.style.transform = 'rotate(180deg)';
            }
        }
        
        // Main process'ten gelen mesajları dinle
        if (window.Electron) {
            window.Electron.onMessage('collapsed-mode-activated', () => {
                console.log('Collapsed mode activated message received from main process');
                updateUIForCollapsedMode();
            });
            
            window.Electron.onMessage('normal-mode-activated', () => {
                console.log('Normal mode activated message received from main process');
                updateUIForNormalMode();
            });
        }
        
        console.log('Window controls initialized successfully');
    } catch (e) {
        console.error('Error initializing window controls:', e);
    }
}

function handleCollapse() {
    const collapseBtn = document.getElementById('collapse-btn');
    const isCurrentlyCollapsed = document.body.classList.contains('collapsed');
    
    // Toggle collapsed class
    document.body.classList.toggle('collapsed');
    
    // Save current state
    localStorage.setItem('collapsed', !isCurrentlyCollapsed);
    
    // Düğmenin görünümünü güncelle
    if (collapseBtn) {
        if (isCurrentlyCollapsed) {
            collapseBtn.style.transform = 'rotate(0deg)';
        } else {
            collapseBtn.style.transform = 'rotate(180deg)';
        }
    }
    
    // Bildirim gönder
    try {
        if (window.Electron) {
            if (!isCurrentlyCollapsed) {
                // Daraltma moduna geçildiğinde 
                window.Electron.sendMessage('toggle-collapsed-mode', true);
                // UI güncellemesi yap
                updateUIForCollapsedMode();
            } else {
                // Normal moda dönüldüğünde
                window.Electron.sendMessage('restore-window-mode');
                // UI güncellemesi yap
                updateUIForNormalMode();
            }
        } else {
            console.error('Electron is not available for collapse toggling');
        }
    } catch (e) {
        console.error('Error toggling collapsed state:', e);
    }
}

// Daraltılmış mod için UI güncellemeleri
function updateUIForCollapsedMode() {
    // Başlık çubuğunu ve kontrolleri görünür tut
    const windowFrame = document.querySelector('.window-frame');
    if (windowFrame) {
        windowFrame.style.opacity = '1';
        windowFrame.style.visibility = 'visible';
        windowFrame.style.backgroundColor = 'rgba(40, 40, 40, 0.9)';
        windowFrame.style.pointerEvents = 'auto'; // Fare olaylarını yakala
        windowFrame.style.zIndex = '9999';
    }
    
    // Pencere kontrollerini görünür ve tıklanabilir tut
    const windowControls = document.querySelector('.window-controls');
    if (windowControls) {
        windowControls.style.opacity = '1';
        windowControls.style.visibility = 'visible';
        windowControls.style.pointerEvents = 'auto';
        windowControls.style.zIndex = '10000';
    }
    
    // Başlık metnini görünür tut
    const windowTitle = document.querySelector('.window-title');
    if (windowTitle) {
        windowTitle.style.opacity = '1';
        windowTitle.style.visibility = 'visible';
        windowTitle.style.pointerEvents = 'auto';
        windowTitle.style.zIndex = '9999';
    }
    
    // Tüm kontrol düğmelerini özel olarak yapılandır
    document.querySelectorAll('#minimize-btn, #maximize-btn, #close-btn, #collapse-btn').forEach(btn => {
        if (btn) {
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
            btn.style.visibility = 'visible';
            btn.style.zIndex = '10001';
            btn.style.position = 'relative';
        }
    });
    
    // Diğer içeriği gizle
    document.querySelectorAll('.app-container, #stats-screen, #client-screen, #settings-screen, .navbar, table').forEach(el => {
        if (el) {
            el.style.opacity = '0';
            el.style.visibility = 'hidden';
            el.style.pointerEvents = 'none';
        }
    });
}

// Normal mod için UI güncellemeleri
function updateUIForNormalMode() {
    // Tüm bileşenleri normal görünürlüğe geri getir
    document.querySelectorAll('.window-frame, .window-controls, .window-title').forEach(el => {
        if (el) {
            el.style.pointerEvents = 'auto';
            el.style.zIndex = '';
        }
    });
    
    // Düğmeleri normal duruma getir
    document.querySelectorAll('#minimize-btn, #maximize-btn, #close-btn, #collapse-btn').forEach(btn => {
        if (btn) {
            btn.style.pointerEvents = 'auto';
            btn.style.zIndex = '';
            btn.style.position = '';
        }
    });
    
    // Tüm içeriği görünür hale getir
    document.querySelectorAll('.app-container, #stats-screen, #client-screen, #settings-screen, .navbar, table').forEach(el => {
        if (el) {
            el.style.opacity = '';
            el.style.visibility = '';
            el.style.pointerEvents = 'auto';
        }
    });
    
    // Aktif ekranı görünür yap
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen) {
        activeScreen.style.display = 'block';
    }
} 