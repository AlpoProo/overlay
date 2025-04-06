/**
 * Main application module
 * Application startup, page loading and the point where other modules connect
 */

import { initNavigation } from './navigation.js';
import { initSettings } from './settings.js';
import { initClientSelection } from './clientSelection.js';
import { initStatsDisplay } from './statsDisplay.js';
import { initWindowControls } from './windowControls.js';

// App state
let appState = {
    selectedClient: localStorage.getItem('selected_client') || '',
    apiKey: localStorage.getItem('hypixel_api_key') || '',
    currentGameType: localStorage.getItem('game_type') || 'bedwars',
    transparency: localStorage.getItem('transparency') || 85,
    alwaysOnTop: localStorage.getItem('always_on_top') === 'true',
    autoDetectGame: localStorage.getItem('auto_detect_game') !== 'false',
};

// State update function
function updateState(key, value) {
    appState[key] = value;
    
    // Save to Local Storage
    if (key === 'selectedClient') localStorage.setItem('selected_client', value);
    if (key === 'apiKey') localStorage.setItem('hypixel_api_key', value);
    if (key === 'currentGameType') localStorage.setItem('game_type', value);
    if (key === 'transparency') localStorage.setItem('transparency', value);
    if (key === 'alwaysOnTop') localStorage.setItem('always_on_top', value);
    if (key === 'autoDetectGame') localStorage.setItem('auto_detect_game', value);
}

// App initialization
function initApp() {
    console.log('Starting application...');
    
    // Initialize modules
    initWindowControls();
    initNavigation();
    initSettings(appState, updateState);
    initClientSelection(appState, updateState);
    initStatsDisplay(appState, updateState);
    
    // Sayfa başladığında tüm yazıları opak hale getirmek için
    setTimeout(() => {
        // Stil ekleyerek yazıların opaklığını sabitle
        const styleId = 'force-text-opacity-startup';
        let styleEl = document.getElementById(styleId);
        
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
            
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
        }
        
        console.log('Tüm yazılar opak hale getirildi');
    }, 1000);
    
    console.log('Application started.');
}

// Start the application when the document is loaded
document.addEventListener('DOMContentLoaded', initApp); 