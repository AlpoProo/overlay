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

        const playerData = response.data.player;
        if (!playerData) {
            console.log(`Oyuncu bulunamadı: ${playerName}`);
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

        console.log(`Oyuncu istatistikleri alındı: ${playerName}`);
        console.log(`Stars: ${stars}, Wins: ${wins}, Losses: ${losses}, Final Kills: ${finalKills}`);

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
    console.log('Tüm oyuncuların istatistikleri alınıyor:', players);
    const statsPromises = players.map(player => getPlayerStats(apiKey, player));
    return await Promise.all(statsPromises);
}

module.exports = {
    validateApiKey,
    getPlayerStats,
    getAllPlayersStats
};