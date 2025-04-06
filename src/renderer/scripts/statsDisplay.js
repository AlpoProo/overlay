/**
 * Stats Display Module
 * Player statistics display and API key validation operations
 */

export function initStatsDisplay(appState, updateState) {
    console.log('Initializing stats display module...');
    
    try {
        const statsTable = document.getElementById('stats-table');
        const loading = document.getElementById('loading');
        
        if (!statsTable) {
            console.error('Stats table not found');
        }
        
        if (!loading) {
            console.error('Loading element not found');
        }
        
        // API key validation result listener
        if (window.Electron) {
            window.Electron.receiveMessage('api-key-validation', (valid) => {
                if (loading) loading.style.display = 'none';
                
                if (valid) {
                    console.log('API key is valid, requesting player stats...');
                    requestPlayerStats(appState);
                } else {
                    alert('Invalid API key. Please enter a valid key.');
                }
            });
            
            // Player stats listener
            window.Electron.receiveMessage('player-stats-response', (stats) => {
                if (loading) loading.style.display = 'none';
                if (statsTable) statsTable.style.display = 'table';
                
                // /who komutundan gelen yeni verilerle tabloyu güncelle
                renderStats(stats);
            });
        } else {
            console.error('Electron is not available for receiving messages');
        }
        
        // Request stats on app start if client and API key are available
        if (appState.selectedClient && appState.apiKey) {
            requestPlayerStats(appState);
        }
        
        console.log('Stats display module initialized');
    } catch (e) {
        console.error('Error initializing stats display:', e);
    }
}

/**
 * API anahtarını doğrular
 */
function validateApiKey(appState, updateState) {
    const apiKeyInput = document.getElementById('api-key-input');
    const loading = document.getElementById('loading');
    const statsTable = document.getElementById('stats-table');
    
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        alert('Lütfen bir API key girin.');
        return;
    }
    
    // API key'i state'e kaydet
    updateState('apiKey', apiKey);
    
    // Doğrulama için API isteği yap
    console.log('API anahtarı doğrulanıyor.');
    loading.style.display = 'block';
    statsTable.style.display = 'none';
    Electron.sendMessage('validate-api-key', apiKey);
}

/**
 * Requests player statistics from the main process
 */
export function requestPlayerStats(appState) {
    try {
        if (!appState) {
            console.error('App state is not available');
            return;
        }
        
        const loading = document.getElementById('loading');
        const statsTable = document.getElementById('stats-table');
        
        if (!appState.selectedClient || !appState.apiKey) return;
        
        if (loading) loading.style.display = 'block';
        if (statsTable) statsTable.style.display = 'none';
        
        if (window.Electron) {
            window.Electron.sendMessage('request-player-stats', {
                apiKey: appState.apiKey,
                client: appState.selectedClient,
                requestedGameType: appState.currentGameType
            });
        } else {
            console.error('Electron is not available for sending messages');
            if (loading) loading.style.display = 'none';
        }
    } catch (e) {
        console.error('Error requesting player stats:', e);
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }
}

/**
 * Renders statistics to the table
 */
function renderStats(stats) {
    try {
        const tbody = document.querySelector('#stats-table tbody');
        if (!tbody) {
            console.error('Stats table body not found');
            return;
        }
        
        // Her yeni /who komutunda tabloyu temizleyip yeni verilerle doldur
        tbody.innerHTML = '';
        
        if (!stats || stats.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6" style="text-align: center;">No players found or no data available.</td>`;
            tbody.appendChild(row);
            return;
        }
        
        stats.forEach(player => {
            const row = document.createElement('tr');
            
            // Determine star class
            let starClass = 'star-0-100';
            const stars = parseInt(player.stars);
            if (!isNaN(stars)) {
                if (stars >= 500) starClass = 'star-500-plus';
                else if (stars >= 400) starClass = 'star-400-500';
                else if (stars >= 300) starClass = 'star-300-400';
                else if (stars >= 200) starClass = 'star-200-300';
                else if (stars >= 100) starClass = 'star-100-200';
            }
            
            // Determine final kill class
            let fkClass = 'fk-0-500';
            const fk = parseInt(player.finalKills);
            if (!isNaN(fk)) {
                if (fk >= 1000) fkClass = 'fk-1000-plus';
                else if (fk >= 500) fkClass = 'fk-500-1000';
            }
            
            row.innerHTML = `
                <td>${player.name || '-'}</td>
                <td class="${starClass}">${player.stars || '-'}</td>
                <td>${player.wins || '-'}</td>
                <td>${player.losses || '-'}</td>
                <td class="${fkClass}">${player.finalKills || '-'}</td>
                <td class="${fkClass}">${player.fkdr || '-'}</td>
            `;
            
            tbody.appendChild(row);
        });
    } catch (e) {
        console.error('Error rendering stats:', e);
    }
} 