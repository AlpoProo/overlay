import tkinter as tk
from tkinter import ttk
import requests
import threading
import time
import os
from pathlib import Path

API_KEY = "f8c8c758-37d7-4c74-98c2-d59c9cd7477e"  # Hypixel API anahtarınızı buraya ekleyin.
LOG_PATH = Path.home() / ".lunarclient/offline/multiver/logs/latest.log"  # Log dosyasının yolu (Windows için)
PLAYER_STATS = {}

def fetch_bedwars_stats(player_name):
    """Hypixel API'den oyuncunun BedWars istatistiklerini çeker."""
    url = f"https://api.hypixel.net/player?key={API_KEY}&name={player_name}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if data.get("player"):
            stats = data["player"].get("stats", {}).get("Bedwars", {})

            # 'bedwars_level' değerini 'star' olarak alıyoruz
            stars = data["player"].get("achievements", {}).get("bedwars_level", "N/A")

            # Diğer istatistikleri alıyoruz
            wins = stats.get("wins_bedwars", "N/A")
            losses = stats.get("losses_bedwars", "N/A")
            final_kills = stats.get("final_kills_bedwars", "N/A")

            # Sonuçları birleştiriyoruz
            stats["star"] = stars
            stats["wins_bedwars"] = wins
            stats["losses_bedwars"] = losses
            stats["final_kills_bedwars"] = final_kills

            return stats
    return {}

def parse_log_line(line):
    """Log satırında 'ONLINE:' ile başlayan oyuncu isimlerini bulur."""
    if "[CHAT] ONLINE:" in line:
        start_idx = line.find("ONLINE:") + len("ONLINE: ")
        players = line[start_idx:].strip().split(", ")
        return players
    return None

def monitor_log(update_callback):
    """Log dosyasını eş zamanlı olarak okur ve 'ONLINE:' çıktısını dinler."""
    global PLAYER_STATS
    with open(LOG_PATH, "r") as file:
        file.seek(0, os.SEEK_END)  # Dosyanın sonuna git
        while True:
            line = file.readline()
            if not line:
                time.sleep(0.1)
                continue
            players = parse_log_line(line)
            if players:
                PLAYER_STATS.clear()
                for player in players:
                    stats = fetch_bedwars_stats(player)
                    PLAYER_STATS[player] = stats
                update_callback(PLAYER_STATS)

def update_gui(players):
    """Tkinter GUI'de oyuncu verilerini günceller."""
    for row in treeview.get_children():
        treeview.delete(row)  # Mevcut satırları sil

    for player, stats in players.items():
        star = stats.get("star", "N/A")
        wins = stats.get("wins_bedwars", "N/A")
        losses = stats.get("losses_bedwars", "N/A")
        final_kills = stats.get("final_kills_bedwars", "N/A")
        
        treeview.insert("", "end", values=(player, wins, losses, final_kills, star))

def start_monitoring():
    """Log izleme işlemini ayrı bir thread'de başlatır."""
    def monitor():
        monitor_log(lambda players: update_gui(players))
    thread = threading.Thread(target=monitor, daemon=True)
    thread.start()

def start_gui():
    """Tkinter GUI penceresini başlatır ve her zaman üstte tutar."""
    root = tk.Tk()
    root.title("Player Stats")

    # Pencereyi her zaman üstte tutar
    root.attributes("-topmost", True)

    # Arka planı gri ve şeffaf yapıyoruz
    root.configure(bg="gray")
    root.geometry("600x200")  # İstediğiniz boyutları burada belirleyebilirsiniz

    # Pencerenin şeffaflığını ayarlıyoruz
    root.attributes("-alpha", 0.9)

    # Tabloyu oluşturuyoruz
    global treeview
    treeview = ttk.Treeview(root, columns=("Player", "Wins", "Losses", "Kills", "Star"), show="headings", height=10)
    
    # Yazı tipini küçültüyoruz
    treeview.tag_configure('small', font=('Arial', 10))  # Yazı tipi boyutunu küçültme

    # Kolon genişliklerini ayarlıyoruz
    treeview.column("Player", width=100, anchor="center")
    treeview.column("Wins", width=50, anchor="center")
    treeview.column("Losses", width=50, anchor="center")
    treeview.column("Kills", width=50, anchor="center")
    treeview.column("Star", width=50, anchor="center")

    # Başlıkları ekliyoruz
    treeview.heading("Player", text="Player")
    treeview.heading("Wins", text="Wins")
    treeview.heading("Losses", text="Losses")
    treeview.heading("Kills", text="Kills")
    treeview.heading("Star", text="Star")

    # Table satırlarını ekliyoruz
    treeview.pack(fill=tk.BOTH, expand=True)

    # Başlatmak için bir arka plan iş parçacığı başlatıyoruz
    start_monitoring()
    
    # Ana döngüyü başlatıyoruz
    root.mainloop()

def main():
    start_gui()

if __name__ == "__main__":
    main()