const HYPIXEL_API_URL = 'https://api.hypixel.net';
const HYPIXEL_PLAYER_STATS_URL = 'https://api.hypixel.net/player';

const axios = require('axios');

async function validateApiKey(apiKey) {
    console.log('API anahtarı doğrulanıyor:', apiKey);
    try {
        const response = await axios.get(`${HYPIXEL_API_URL}/punishmentstats`, {
            headers: {
                'API-Key': apiKey
            }
        });

        console.log('API anahtarı doğrulama başarılı.');
        return response.data.success;
    } catch (error) {
        console.error('API anahtarı doğrulama başarısız:', error.response?.data || error.message);
        return false;
    }
}

async function getPlayerStats(apiKey, playerName) {
    console.log(`Oyuncu istatistikleri alınıyor: ${playerName}`);
    try {
        const response = await axios.get(HYPIXEL_PLAYER_STATS_URL, {
            params: {
                key: apiKey,
                name: playerName
            }
        });
        console.log(`Oyuncu istatistikleri başarıyla alındı: ${playerName}`);
        return response.data.player.stats.Bedwars;
    } catch (error) {
        console.error(`Oyuncu istatistikleri alınamadı: ${playerName}`, error);
        return null;
    }
}

async function getAllPlayersStats(apiKey, players) {
    console.log('Tüm oyuncuların istatistikleri alınıyor:', players);
    const statsPromises = players.map(player => getPlayerStats(apiKey, player));
    return await Promise.all(statsPromises);
}

module.exports = {
    validateApiKey,
    getPlayerStats,
    getAllPlayersStats
};