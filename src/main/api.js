const HYPIXEL_API_URL = 'https://api.hypixel.net';
const HYPIXEL_PLAYER_STATS_URL = 'https://api.hypixel.net/player';

const axios = require('axios');
const consoled = require('consoled.js');

async function validateApiKey(apiKey) {
    try {
        const response = await axios.get(`${HYPIXEL_API_URL}/punishmentstats`, {
            headers: {
                'API-Key': apiKey
            }
        });

        consoled.bright.green('API KEY REYAL');
        return response.data.success;
    } catch (error) {
        //console.error('API anahtarı doğrulama başarısız:', error.response?.data || error.message);
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


        const playerData = response.data.player;
        if (!playerData) {
            return {
                name: playerName,
                stars: "N/A",
                wins: "N/A",
                losses: "N/A",
                finalKills: "N/A"
            };
        }

        const stats = playerData.stats?.Bedwars || {};
        const stars = playerData.achievements?.bedwars_level || "N/A";
        const wins = stats.wins_bedwars || "N/A";
        const losses = stats.losses_bedwars || "N/A";
        const finalKills = stats.final_kills_bedwars || "N/A";


        return {
            name: playerName,
            stars,
            wins,
            losses,
            finalKills
        };
    } catch (error) {
        console.error(`Oyuncu istatistikleri alınamadı: ${playerName}`, error);
        return {
            name: playerName,
            stars: "N/A",
            wins: "N/A",
            losses: "N/A",
            finalKills: "N/A"
        };
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
};