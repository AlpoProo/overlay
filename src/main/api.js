
const HYPIXEL_API_URL = 'https://api.hypixel.net/key';
const HYPIXEL_PLAYER_STATS_URL = 'https://api.hypixel.net/player';

const axios = require('axios')

async function validateApiKey(apiKey) {
    try {
        const response = await axios.get(HYPIXEL_API_URL, {
            headers: {
                'API-Key': apiKey
            }
        });

        return response.data.success;
    } catch (error) {
        console.error('API key validation failed:', error);
        return false;
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