const HYPIXEL_API_URL = 'https://api.hypixel.net';
const HYPIXEL_PLAYER_STATS_URL = 'https://api.hypixel.net/player';
const PLAYER_UUID_URL = 'https://api.mojang.com/users/profiles/minecraft';

const axios = require('axios');
const consoled = require('consoled.js');

/**
 * API anahtarını doğrular
 * @param {string} apiKey - Hypixel API anahtarı
 * @returns {Promise<boolean>} API anahtarının geçerli olup olmadığı
 */
async function validateApiKey(apiKey) {
    if (!apiKey || apiKey.length < 8) {
        return false;
    }
    
    try {
        const response = await axios.get(`${HYPIXEL_API_URL}/key`, {
            headers: {
                'API-Key': apiKey
            }
        });

        consoled.bright.green('API anahtarı doğrulandı');
        return response.data.success === true;
    } catch (error) {
        consoled.bright.red('API anahtarı doğrulama hatası:', error.message);
        return false;
    }
}

/**
 * Minecraft kullanıcı adından UUID alır
 * @param {string} playerName - Minecraft kullanıcı adı
 * @returns {Promise<string|null>} Oyuncu UUID'si veya null
 */
async function getPlayerUUID(playerName) {
    try {
        const response = await axios.get(`${PLAYER_UUID_URL}/${encodeURIComponent(playerName)}`);
        return response.data?.id || null;
    } catch (error) {
        consoled.yellow(`UUID alınamadı: ${playerName}, tekrar deneniyor...`);
        
        // İlk yeniden deneme (2 saniye bekle)
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const retryResponse = await axios.get(`${PLAYER_UUID_URL}/${encodeURIComponent(playerName)}`);
            if (retryResponse.data?.id) {
                consoled.green(`Yeniden deneme başarılı, UUID alındı: ${playerName}`);
                return retryResponse.data.id;
            }
        } catch (retryError) {
            consoled.red(`İlk yeniden deneme başarısız, UUID alınamadı: ${playerName}, ikinci kez deneniyor...`);
            
            // İkinci yeniden deneme (3 saniye bekle)
            try {
                await new Promise(resolve => setTimeout(resolve, 3000));
                const secondRetryResponse = await axios.get(`${PLAYER_UUID_URL}/${encodeURIComponent(playerName)}`);
                if (secondRetryResponse.data?.id) {
                    consoled.green(`İkinci yeniden deneme başarılı, UUID alındı: ${playerName}`);
                    return secondRetryResponse.data.id;
                }
            } catch (secondRetryError) {
                consoled.red(`İkinci yeniden deneme başarısız, UUID alınamadı: ${playerName}, son kez deneniyor...`);
                
                // Üçüncü ve son yeniden deneme (4 saniye bekle)
                try {
                    await new Promise(resolve => setTimeout(resolve, 4000));
                    const thirdRetryResponse = await axios.get(`${PLAYER_UUID_URL}/${encodeURIComponent(playerName)}`);
                    if (thirdRetryResponse.data?.id) {
                        consoled.green(`Son yeniden deneme başarılı, UUID alındı: ${playerName}`);
                        return thirdRetryResponse.data.id;
                    }
                } catch (thirdRetryError) {
                    consoled.red(`Tüm denemeler başarısız, UUID alınamadı: ${playerName}`);
                }
            }
        }
        
        return null;
    }
}

/**
 * Bir oyuncunun istatistiklerini alır
 * @param {string} apiKey - Hypixel API anahtarı
 * @param {string} playerName - Oyuncu adı
 * @param {string} gameType - Oyun tipi (bedwars, skywars, duels)
 * @returns {Promise<Object>} Oyuncu istatistikleri
 */
async function getPlayerStats(apiKey, playerName, gameType = 'bedwars') {
    try {
        // Önce UUID ile deneyelim
        const uuid = await getPlayerUUID(playerName);
        
        if (!uuid) {
            consoled.yellow(`${playerName} için UUID alınamadı, varsayılan istatistikler kullanılıyor`);
            return createDefaultStats(playerName);
        }
        
    try {
        const response = await axios.get(HYPIXEL_PLAYER_STATS_URL, {
            params: {
                key: apiKey,
                    uuid: uuid
                },
                timeout: 5000
            });

            if (!response.data.success || !response.data.player) {
                consoled.yellow(`${playerName} için Hypixel verisi bulunamadı, tekrar deneniyor...`);
                
                // İlk yeniden deneme - 2 saniye bekle
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const retryResponse = await axios.get(HYPIXEL_PLAYER_STATS_URL, {
                    params: {
                        key: apiKey,
                        uuid: uuid
                    },
                    timeout: 5000
                });
                
                if (retryResponse.data.success && retryResponse.data.player) {
                    consoled.green(`${playerName} için yeniden deneme başarılı, veriler alındı`);
                    const playerData = retryResponse.data.player;
                    return extractGameStats(playerData, playerName, gameType);
                } else {
                    consoled.red(`${playerName} için ilk yeniden deneme başarısız, tekrar deneniyor...`);
                    
                    // İkinci yeniden deneme - 3 saniye bekle
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    const secondRetryResponse = await axios.get(HYPIXEL_PLAYER_STATS_URL, {
                        params: {
                            key: apiKey,
                            uuid: uuid
                        },
                        timeout: 5000
                    });
                    
                    if (secondRetryResponse.data.success && secondRetryResponse.data.player) {
                        consoled.green(`${playerName} için ikinci deneme başarılı, veriler alındı`);
                        return extractGameStats(secondRetryResponse.data.player, playerName, gameType);
                    } else {
                        consoled.red(`${playerName} için tüm denemeler başarısız oldu`);
                        return createDefaultStats(playerName);
                    }
                }
            }

            const playerData = response.data.player;
            return extractGameStats(playerData, playerName, gameType);
            
        } catch (hypixelError) {
            consoled.red(`Hypixel API hatası: ${playerName}`, hypixelError.message);
            
            // İlk yeniden deneme - 2 saniye bekle
            try {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const retryResponse = await axios.get(HYPIXEL_PLAYER_STATS_URL, {
                    params: {
                        key: apiKey,
                        uuid: uuid
                    },
                    timeout: 5000
                });
                
                if (retryResponse.data.success && retryResponse.data.player) {
                    consoled.green(`${playerName} için hata sonrası ilk yeniden deneme başarılı`);
                    return extractGameStats(retryResponse.data.player, playerName, gameType);
                } else {
                    consoled.red(`${playerName} için ilk yeniden deneme başarısız, tekrar deneniyor...`);
                    
                    // İkinci yeniden deneme - 3 saniye bekle
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    const secondRetryResponse = await axios.get(HYPIXEL_PLAYER_STATS_URL, {
                        params: {
                            key: apiKey,
                            uuid: uuid
                        },
                        timeout: 5000
                    });
                    
                    if (secondRetryResponse.data.success && secondRetryResponse.data.player) {
                        consoled.green(`${playerName} için ikinci deneme başarılı, veriler alındı`);
                        return extractGameStats(secondRetryResponse.data.player, playerName, gameType);
                    }
                }
            } catch (retryError) {
                consoled.red(`${playerName} için yeniden deneme hatası: ${retryError.message}`);
            }
            
            return createDefaultStats(playerName);
        }
    } catch (error) {
        consoled.red(`Oyuncu istatistikleri alınamadı: ${playerName}`, error.message);
        return createDefaultStats(playerName);
    }
}

/**
 * Oyun tipine göre stat çıkarma fonksiyonu
 * @param {Object} playerData - Hypixel API'den gelen oyuncu verisi
 * @param {string} playerName - Oyuncu adı
 * @param {string} gameType - Oyun tipi
 * @returns {Object} Oyuncu istatistikleri
 */
function extractGameStats(playerData, playerName, gameType) {
    if (gameType === 'bedwars') {
        return extractBedwarsStats(playerData, playerName);
    } else if (gameType === 'skywars') {
        return extractSkywarsStats(playerData, playerName);
    } else if (gameType === 'duels') {
        return extractDuelsStats(playerData, playerName);
    } else {
        return extractBedwarsStats(playerData, playerName);
    }
}

/**
 * Bedwars istatistiklerini çıkarır
 * @param {Object} playerData - Hypixel API'den gelen oyuncu verisi
 * @param {string} playerName - Oyuncu adı
 * @returns {Object} Düzenlenmiş bedwars istatistikleri
 */
function extractBedwarsStats(playerData, playerName) {
    const stats = playerData.stats?.Bedwars || {};
    const stars = playerData.achievements?.bedwars_level || 0;
    const wins = stats.wins_bedwars || 0;
    const losses = stats.losses_bedwars || 0;
    const finalKills = stats.final_kills_bedwars || 0;
    const finalDeaths = stats.final_deaths_bedwars || 0;
    const winStreak = stats.winstreak || 0;
    
    // Hesaplanan oranlar
    const winRate = losses > 0 ? (wins / (wins + losses) * 100).toFixed(1) : "100.0";
    const fkdr = finalDeaths > 0 ? (finalKills / finalDeaths).toFixed(2) : finalKills.toFixed(2);
    
    return {
        name: playerName,
        stars: stars,
        wins: wins,
        losses: losses,
        finalKills: finalKills,
        finalDeaths: finalDeaths,
        winRate: `${winRate}%`,
        fkdr: fkdr,
        winStreak: winStreak,
        gameType: 'bedwars'
    };
}

/**
 * Skywars istatistiklerini çıkarır
 */
function extractSkywarsStats(playerData, playerName) {
    const stats = playerData.stats?.SkyWars || {};
    const level = calculateSkywarsLevel(stats.skywars_experience || 0);
    const wins = stats.wins || 0;
    const losses = stats.losses || 0;
    const kills = stats.kills || 0;
    const deaths = stats.deaths || 0;
    
    // Hesaplanan oranlar
    const winRate = losses > 0 ? (wins / (wins + losses) * 100).toFixed(1) : "100.0";
    const kdr = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
    
            return {
                name: playerName,
        stars: level, // Skywars'ta seviye
        wins: wins,
        losses: losses,
        finalKills: kills,
        finalDeaths: deaths,
        winRate: `${winRate}%`,
        fkdr: kdr,
        gameType: 'skywars'
    };
}

/**
 * Duels istatistiklerini çıkarır
 */
function extractDuelsStats(playerData, playerName) {
    const stats = playerData.stats?.Duels || {};
    const wins = stats.wins || 0;
    const losses = stats.losses || 0;
    const kills = stats.kills || 0;
    const deaths = stats.deaths || 0;
    
    // Hesaplanan oranlar
    const winRate = losses > 0 ? (wins / (wins + losses) * 100).toFixed(1) : "100.0";
    const kdr = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);

        return {
            name: playerName,
        stars: calculateDuelsTitle(wins),
        wins: wins,
        losses: losses,
        finalKills: kills,
        finalDeaths: deaths,
        winRate: `${winRate}%`,
        fkdr: kdr,
        gameType: 'duels'
    };
}

/**
 * Varsayılan oyuncu istatistikleri oluşturur
 */
function createDefaultStats(playerName) {
        return {
            name: playerName,
        stars: 0,
        wins: 0,
        losses: 0,
        finalKills: 0,
        finalDeaths: 0,
        winRate: "0%",
        fkdr: "0.00",
        gameType: 'unknown'
    };
}

/**
 * Skywars seviyesini hesaplar
 */
function calculateSkywarsLevel(xp) {
    if (xp < 20) return 1;
    
    let level = 1;
    let xpForNextLevel = 20;
    let remainingXp = xp;
    
    while (remainingXp >= xpForNextLevel) {
        remainingXp -= xpForNextLevel;
        level++;
        
        if (level < 5) xpForNextLevel += 10;
        else if (level < 10) xpForNextLevel += 15;
        else if (level < 15) xpForNextLevel += 20;
        else if (level < 20) xpForNextLevel += 25;
        else if (level < 25) xpForNextLevel += 30;
        else if (level < 30) xpForNextLevel += 35;
        else if (level < 35) xpForNextLevel += 40;
        else if (level < 40) xpForNextLevel += 50;
        else if (level < 45) xpForNextLevel += 75;
        else if (level < 50) xpForNextLevel += 100;
        else if (level < 60) xpForNextLevel += 200;
        else xpForNextLevel += 300;
    }
    
    return level;
}

/**
 * Duels seviyesini hesaplar
 */
function calculateDuelsTitle(wins) {
    if (wins < 100) return 0;
    else if (wins < 500) return 1;
    else if (wins < 1000) return 2;
    else if (wins < 2000) return 3;
    else if (wins < 5000) return 4;
    else if (wins < 10000) return 5;
    else return 6;
}

/**
 * Tüm oyuncuların istatistiklerini alır
 * @param {string} apiKey - Hypixel API anahtarı
 * @param {string[]} players - Oyuncu adları dizisi
 * @param {string} gameType - Oyun tipi
 * @returns {Promise<Array>} Tüm oyuncuların istatistikleri
 */
async function getAllPlayersStats(apiKey, players, gameType = 'bedwars') {
    if (!players || players.length === 0) {
        return [];
    }
    
    consoled.bright.blue(`${players.length} oyuncu için istatistik alınıyor... Oyun tipi: ${gameType}`);
    
    try {
        const statsPromises = players.map(player => getPlayerStats(apiKey, player, gameType));
        const stats = await Promise.all(statsPromises);
        
        // İstatistikleri sırala (yıldız sayısına göre azalan)
        stats.sort((a, b) => b.stars - a.stars);
        
        return stats;
    } catch (error) {
        consoled.bright.red('Oyuncu istatistikleri alınırken hata oluştu:', error.message);
        return players.map(player => createDefaultStats(player));
    }
}

module.exports = {
    validateApiKey,
    getPlayerStats,
    getAllPlayersStats,
    getPlayerUUID
};