# Minecraft Hypixel İstatistik Overlay

Minecraft Hypixel sunucusunda oynarken, oyuncu istatistiklerini gerçek zamanlı görebilmenizi sağlayan bir masaüstü uygulaması.

## Özellikler

- Hypixel'de `/who` komutu ile oyuncu istatistiklerini görüntüleme
- Bedwars, SkyWars ve diğer oyun modları desteği
- Oyun modunu otomatik algılama
- Ayarlanabilir şeffaflık ve her zaman üstte kalma seçeneği
- Koyu/Açık tema desteği
- Tüm popüler Minecraft istemcileri ile uyumlu:
  - Lunar Client
  - Vanilla Minecraft
  - Badlion
  - Feather
  - ve diğerleri

## Kurulum

1. Projeyi klonlayın:
   ```bash
   git clone https://github.com/AlpoProo/overlay.git
   ```

2. Proje klasörüne girin:
   ```bash
   cd overlay
   ```

3. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

4. Uygulamayı başlatın:
   ```bash
   npm start
   ```

5. Hypixel API anahtarınızı girin (API anahtarını [api.hypixel.net](https://api.hypixel.net) adresinden alabilirsiniz)
6. Minecraft istemcinizi seçin
7. Minecraft'ta `/who` komutunu kullanarak oyuncu istatistiklerini görüntüleyin

## Kullanım

1. Uygulamayı başlatın ve Hypixel API anahtarınızı girin
2. Minecraft istemcinizi seçin
3. Hypixel sunucusuna bağlanın
4. Bir oyuna katılın ve `/who` komutunu kullanın
5. Overlay penceresinde oyuncuların istatistikleri görüntülenecektir
6. İstatistik satırına tıklayarak daha detaylı bilgileri görebilirsiniz

## Geliştirme

### Gereksinimler

- Node.js (v16+)
- npm

### Geliştirme Modunda Çalıştırma

```bash
# Geliştirme modunda başlatın
npm run dev
```

## İletişim ve Katkıda Bulunma

- Bu projeye katkıda bulunmak için bir Pull Request oluşturun
- Hataları bildirmek veya özellik istemek için GitHub Issues kullanın
- [GitHub Profili](https://github.com/AlpoProo) 
