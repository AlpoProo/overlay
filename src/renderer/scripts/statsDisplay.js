/**
 * Stats Display Module
 * Player statistics display and API key validation operations
 */

export function initStatsDisplay(appState, updateState) {
    console.log('Initializing stats display module...');
    
    try {
        const statsTable = document.getElementById('stats-table');
        const loading = document.getElementById('loading');
        const playerDetails = document.getElementById('player-details');
        const closeDetailsBtn = document.getElementById('close-details');
        
        if (!statsTable) {
            console.error('Stats table not found');
        }
        
        if (!loading) {
            console.error('Loading element not found');
        }
        
        // İlk açılışta bilgilendirme mesajı göster
        showInfoMessage(`Please type '/who' in Minecraft chat to see players`);
        
        // Close player details panel
        if (closeDetailsBtn) {
            closeDetailsBtn.addEventListener('click', () => {
                if (playerDetails) {
                    playerDetails.classList.remove('active');
                }
            });
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
                renderStats(stats, playerDetails);
            });
            
            // No /who command found message
            window.Electron.receiveMessage('no-who-command', () => {
                if (loading) loading.style.display = 'none';
                if (statsTable) statsTable.style.display = 'table';
                
                showInfoMessage(`Please type '/who' in Minecraft chat to see players`);
            });
        } else {
            console.error('Electron is not available for receiving messages');
        }
        
        // Kayıtlı API anahtarının geçerliliğini kontrol et
        if (appState.apiKey) {
            checkApiKeyValidity(appState.apiKey);
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
 * Kayıtlı API anahtarının geçerliliğini kontrol et
 */
function checkApiKeyValidity(apiKey) {
    try {
        console.log('Checking saved API key validity...');
        
        if (window.Electron) {
            window.Electron.sendMessage('validate-api-key', apiKey);
        } else {
            console.error('Electron is not available');
        }
    } catch (e) {
        console.error('Error checking API key validity:', e);
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
    
    try {
        if (window.Electron) {
            window.Electron.sendMessage('validate-api-key', apiKey);
        } else {
            console.error('Electron is not available');
            loading.style.display = 'none';
        }
    } catch (e) {
        console.error('Error sending validate-api-key message:', e);
        loading.style.display = 'none';
    }
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
function renderStats(stats, playerDetailsPanel) {
    try {
        const tbody = document.querySelector('#stats-table tbody');
        if (!tbody) {
            console.error('Stats table body not found');
            return;
        }
        
        // Her yeni /who komutunda tabloyu temizleyip yeni verilerle doldur
        tbody.innerHTML = '';
        
        // Yükleniyor ekranını gizle
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
        
        if (!stats || stats.length === 0) {
            showInfoMessage(`Please type '/who' in Minecraft chat to see players`);
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
            
            // Create tooltips
            const starTooltip = player.level ? `Level: ${player.level}` : '';
            const winsTooltip = player.winStreak ? `Win Streak: ${player.winStreak}` : '';
            const fkdrTooltip = player.finalDeaths ? `Final Deaths: ${player.finalDeaths}` : '';
            
            row.innerHTML = `
                <td>${player.name || '-'}</td>
                <td class="${starClass}" ${starTooltip ? `data-tooltip="${starTooltip}"` : ''}>${player.stars || '-'}</td>
                <td ${winsTooltip ? `data-tooltip="${winsTooltip}"` : ''}>${player.wins || '-'}</td>
                <td>${player.losses || '-'}</td>
                <td class="${fkClass}">${player.finalKills || '-'}</td>
                <td class="${fkClass}" ${fkdrTooltip ? `data-tooltip="${fkdrTooltip}"` : ''}>${player.fkdr || '-'}</td>
            `;
            
            // Add click event to show player details
            row.addEventListener('click', () => {
                if (playerDetailsPanel) {
                    showPlayerDetails(player, playerDetailsPanel);
                }
            });
            
            tbody.appendChild(row);
        });
    } catch (e) {
        console.error('Error rendering stats:', e);
    }
}

/**
 * Shows player details panel
 */
function showPlayerDetails(player, panel) {
    try {
        // Update player name in the header
        const nameElement = document.getElementById('player-details-name');
        if (nameElement) {
            nameElement.textContent = player.name || 'Player Details';
        }
        
        // Update player stats grid
        const statsGrid = panel.querySelector('.player-stats-grid');
        if (statsGrid) {
            // Clear previous stats
            statsGrid.innerHTML = '';
            
            // Add all available stats
            const stats = [
                { label: 'Stars', value: player.stars || '-' },
                { label: 'Wins', value: player.wins || '-' },
                { label: 'Losses', value: player.losses || '-' },
                { label: 'W/L Ratio', value: player.wlr || '-' },
                { label: 'Final Kills', value: player.finalKills || '-' },
                { label: 'Final Deaths', value: player.finalDeaths || '-' },
                { label: 'FKDR', value: player.fkdr || '-' },
                { label: 'Beds Broken', value: player.bedsBroken || '-' },
                { label: 'Win Streak', value: player.winStreak || '-' },
                { label: 'Games Played', value: player.gamesPlayed || '-' },
                { label: 'Level', value: player.level || '-' },
                { label: 'Void Deaths', value: player.voidDeaths || '-' }
            ];
            
            stats.forEach(stat => {
                const statElement = document.createElement('div');
                statElement.className = 'stat-item';
                statElement.innerHTML = `
                    <div class="stat-label">${stat.label}</div>
                    <div class="stat-value">${stat.value}</div>
                `;
                statsGrid.appendChild(statElement);
            });
        }
        
        // Show the panel
        panel.classList.add('active');
    } catch (e) {
        console.error('Error showing player details:', e);
    }
}

/**
 * Bilgilendirme mesajı göster
 */
function showInfoMessage(message) {
    const tbody = document.querySelector('#stats-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="6" class="info-message">${message}</td>`;
    tbody.appendChild(row);
    
    // Tabloyu göster, yükleniyor ekranını gizle
    const statsTable = document.getElementById('stats-table');
    const loading = document.getElementById('loading');
    
    if (statsTable) statsTable.style.display = 'table';
    if (loading) loading.style.display = 'none';
} 