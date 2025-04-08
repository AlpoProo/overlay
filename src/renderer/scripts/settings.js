/**
 * Settings Module
 * Manages application settings and settings screen interactions
 */

export function initSettings(appState, updateState) {
    console.log('Initializing settings module...');

    try {
        // Form elements
        const apiKeyInput = document.getElementById('api-key-input');
        const validateApiKeyBtn = document.getElementById('validate-api-key');
        const alwaysOnTopCheckbox = document.getElementById('always-on-top');
        const gameTypeSelect = document.getElementById('game-type');
        const autoDetectGameCheckbox = document.getElementById('auto-detect-game');
        const themeToggleCheckbox = document.getElementById('theme-toggle');
        
        // Initialize theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            if (themeToggleCheckbox) themeToggleCheckbox.checked = true;
        }
        
        // Theme toggle function
        if (themeToggleCheckbox) {
            themeToggleCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    document.body.classList.add('light-theme');
                    localStorage.setItem('theme', 'light');
                } else {
                    document.body.classList.remove('light-theme');
                    localStorage.setItem('theme', 'dark');
                }
            });
        }
        
        // API key validation
        if (validateApiKeyBtn) {
            validateApiKeyBtn.addEventListener('click', () => {
                validateApiKey(appState, updateState);
            });
            
            apiKeyInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    validateApiKey(appState, updateState);
                }
            });
        }
        
        // Restore stored API key
        if (apiKeyInput && appState.apiKey) {
            apiKeyInput.value = appState.apiKey;
        }
        
        // Restore settings
        if (alwaysOnTopCheckbox) {
            alwaysOnTopCheckbox.checked = appState.alwaysOnTop;
        }
        
        if (gameTypeSelect) {
            gameTypeSelect.value = appState.currentGameType || 'bedwars';
        }
        
        if (autoDetectGameCheckbox) {
            autoDetectGameCheckbox.checked = appState.autoDetectGame;
        }
        
        // Always on top setting
        if (alwaysOnTopCheckbox) {
            alwaysOnTopCheckbox.addEventListener('change', function() {
                updateState('alwaysOnTop', this.checked);
                try {
                    if (window.Electron) {
                        window.Electron.sendMessage('toggle-always-on-top', this.checked);
                    } else {
                        console.error('Electron is not available');
                    }
                } catch (e) {
                    console.error('Error toggling always on top:', e);
                }
            });
        }
        
        // Auto detect game type
        if (autoDetectGameCheckbox) {
            autoDetectGameCheckbox.addEventListener('change', function() {
                updateState('autoDetectGame', this.checked);
                try {
                    if (window.Electron) {
                        window.Electron.sendMessage('toggle-auto-detect-game', this.checked);
                    } else {
                        console.error('Electron is not available');
                    }
                } catch (e) {
                    console.error('Error toggling auto detect game:', e);
                }
            });
        }
        
        // Game type change
        if (gameTypeSelect) {
            gameTypeSelect.addEventListener('change', function() {
                updateState('currentGameType', this.value);
                
                // Update statistics if client and API key are selected
                if (appState.selectedClient && appState.apiKey) {
                    try {
                        if (window.Electron) {
                            window.Electron.sendMessage('change-game-type', this.value);
                        } else {
                            console.error('Electron is not available');
                        }
                    } catch (e) {
                        console.error('Error changing game type:', e);
                    }
                }
            });
        }
        
        // Uygulama başladığında tüm metinlerin opak olmasını sağla
        forceTextOpacity();
        
        console.log('Settings module initialized');
    } catch (e) {
        console.error('Error initializing settings module:', e);
    }
}

/**
 * API anahtarını doğrular
 */
function validateApiKey(appState, updateState) {
    try {
        const apiKeyInput = document.getElementById('api-key-input');
        if (!apiKeyInput) {
            console.error('API key input not found');
            return;
        }
        
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            alert('Please enter an API key.');
            return;
        }
        
        // Save API key to state
        updateState('apiKey', apiKey);
        
        // Validate the API key
        console.log('Validating API key...');
        document.getElementById('loading').style.display = 'block';
        document.getElementById('stats-table').style.display = 'none';
        
        try {
            if (window.Electron) {
                window.Electron.sendMessage('validate-api-key', apiKey);
            } else {
                console.error('Electron is not available');
                document.getElementById('loading').style.display = 'none';
            }
        } catch (e) {
            console.error('Error sending validate-api-key message:', e);
            document.getElementById('loading').style.display = 'none';
        }
    } catch (e) {
        console.error('Error validating API key:', e);
    }
}

/**
 * Force all text elements to be fully opaque
 */
function forceTextOpacity() {
    // CSS ekleyerek tüm metin elemanlarını zorla opak yap
    const styleId = 'force-text-opacity-style';
    let styleEl = document.getElementById(styleId);
    
    // Stil elemanı yoksa oluştur
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }
    
    // Tüm metin elemanları için stil enjekte et
    styleEl.textContent = `
        .window-title, 
        .window-controls, 
        .window-controls button, 
        #close-btn, 
        #minimize-btn, 
        #maximize-btn,
        #collapse-btn,
        .settings-label, 
        .nav-text, 
        td, 
        th, 
        h2, h3, h4, h5, p, span, label, 
        .settings-title, 
        button, a, input, select, option,
        .nav-item,
        .nav-icon,
        .window-frame,
        .navbar,
        * {
            opacity: 1 !important;
            visibility: visible !important;
            mix-blend-mode: normal !important;
            filter: none !important;
        }
        
        body.collapsed .window-title,
        body.collapsed .window-controls,
        body.collapsed .window-controls button,
        body.collapsed .window-frame {
            opacity: 1 !important;
            visibility: visible !important;
        }
        
        /* Yazı elemanlarına özel stil */
        .window-title, 
        .settings-label, 
        .nav-text, 
        td, 
        th, 
        h2, h3, h4, h5, p, span, label, 
        .settings-title {
            color: rgba(255, 255, 255, 0.95) !important;
            text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.7) !important;
        }
    `;
    
    // CSS uygulamasının yanı sıra doğrudan stil de uygula
    const textSelectors = [
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'span', 'label', 'td', 'th',
        '.settings-label', '.nav-text', '.window-title', '.settings-title',
        'button', 'a', 'input', 'select', 'option',
        '.window-controls', '.window-controls button', '#close-btn', 
        '#minimize-btn', '#maximize-btn', '#collapse-btn'
    ];
    
    const textElements = document.querySelectorAll(textSelectors.join(', '));
    textElements.forEach(el => {
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        if (el.classList.contains('window-title') || 
            el.classList.contains('settings-label') || 
            el.classList.contains('nav-text') ||
            el.tagName.toLowerCase() === 'td' ||
            el.tagName.toLowerCase() === 'th') {
            el.style.color = 'rgba(255, 255, 255, 0.95)';
            el.style.textShadow = '0px 1px 2px rgba(0, 0, 0, 0.7)';
        }
    });
    
    // Başlık çubuğu özel ayarları
    const windowFrame = document.querySelector('.window-frame');
    if (windowFrame) {
        windowFrame.style.opacity = '1';
        windowFrame.style.visibility = 'visible';
    }
    
    console.log('Tüm metin elemanları opak yapıldı');
} 