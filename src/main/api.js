
const HYPIXEL_API_URL = 'https://api.hypixel.net';
const HYPIXEL_PLAYER_STATS_URL = 'https://api.hypixel.net/player';

const axios = require('axios')

async function validateApiKey(apiKey) {
    try {
        const response = await axios.get(`${HYPIXEL_API_URL}/punishmentstats`, {
            headers: {
                'API-Key': apiKey
            }
        });

        return response.data.success; // Eğer API anahtarı geçerliyse true döner.
    } catch (error) {
        console.error('API key validation failed:', error.response?.data || error.message);

        return false; // Hata durumunda false döner.
    }
}


async function getPlayerStats(apiKey, playerName) {
    try {
        const response = await axios.get(HYPIXEL_PLAYER_STATS_URL, {
            params: {
                key: apiKey,
                name: playerName
            }
        });
        return response.data.player.stats.Bedwars;
    } catch (error) {
        console.error(`Failed to fetch stats for player ${playerName}:`, error);
        return null;
    }
}

async function getAllPlayersStats(apiKey, players) {
    const statsPromises = players.map(player => getPlayerStats(apiKey, player));
    return await Promise.all(statsPromises);
}








module.exports = {
    validateApiKey,
    getPlayerStats,
    getAllPlayersStats
}