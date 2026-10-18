#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
3_Pobierz_IMGW.py
Pobiera dane na żywo ze WSZYSTKICH stacji meteorologicznych IMGW-PIB.
Endpoint: https://danepubliczne.imgw.pl/api/data/meteo

Uruchamiaj wielokrotnie (np. co 10-30 min), aby zbierać historię pomiarów.
Dane zapisywane są do:
  - Dane_IMGW.json       (najnowszy snapshot)
  - Historia_IMGW.json   (wszystkie snapshoty z ostatnich 24h)
"""

import requests
import json
import math
import os
from datetime import datetime, timedelta

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DANE_FILE = os.path.join(SCRIPT_DIR, "Dane_IMGW.json")
HISTORIA_FILE = os.path.join(SCRIPT_DIR, "Historia_IMGW.json")

IMGW_URL = "https://danepubliczne.imgw.pl/api/data/meteo"
MAX_HISTORY_HOURS = 24


def oblicz_punkt_rosy(temp_c, wilgotnosc_pct):
    """Oblicza punkt rosy ze wzoru Magnusa."""
    if temp_c is None or wilgotnosc_pct is None:
        return None
    if wilgotnosc_pct <= 0:
        return None
    a = 17.27
    b = 237.7
    try:
        alpha = (a * temp_c) / (b + temp_c) + math.log(wilgotnosc_pct / 100.0)
        td = (b * alpha) / (a - alpha)
        return round(td, 1)
    except (ValueError, ZeroDivisionError):
        return None


def ms_na_kmh(v_ms):
    """Konwertuje m/s na km/h."""
    if v_ms is None:
        return None
    return round(v_ms * 3.6, 1)


def parsuj_float(wartosc):
    if wartosc is None or wartosc == "":
        return None
    try:
        return float(wartosc)
    except ValueError:
        return None

def check_fresh(val_str, date_str, now_utc):
    """Parsuje float, ale tylko jeśli data pomiaru nie jest starsza niż 6 godzin."""
    if val_str is None or val_str == "" or not date_str:
        return None
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
        if (now_utc - dt).total_seconds() > 6 * 3600:
            return None # Sensor zepsuty (dane przestarzałe)
        return float(val_str)
    except ValueError:
        return None


def pobierz_dane():
    """Pobiera i przetwarza dane z API IMGW."""
    print("=" * 65)
    print("  POBIERANIE DANYCH ZE STACJI IMGW")
    print("=" * 65)

    print(f"  Odpytywanie: {IMGW_URL}")
    response = requests.get(IMGW_URL, timeout=30)
    response.raise_for_status()
    raw_stations = response.json()
    print(f"  Pobrano {len(raw_stations)} stacji surowych")

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    processed = []
    skipped = 0

    now_utc = datetime.utcnow()

    for st in raw_stations:
        lat = parsuj_float(st.get("lat"))
        lon = parsuj_float(st.get("lon"))
        if lat is None or lon is None:
            skipped += 1
            continue

        temp = check_fresh(st.get("temperatura_powietrza"), st.get("temperatura_powietrza_data"), now_utc)
        temp_grunt = check_fresh(st.get("temperatura_gruntu"), st.get("temperatura_gruntu_data"), now_utc)
        wilg = check_fresh(st.get("wilgotnosc_wzgledna"), st.get("wilgotnosc_wzgledna_data"), now_utc)
        wiatr_sr = check_fresh(st.get("wiatr_srednia_predkosc"), st.get("wiatr_srednia_predkosc_data"), now_utc)
        wiatr_max = check_fresh(st.get("wiatr_predkosc_maksymalna"), st.get("wiatr_predkosc_maksymalna_data"), now_utc)
        wiatr_poryw = check_fresh(st.get("wiatr_poryw_10min"), st.get("wiatr_poryw_10min_data"), now_utc)
        wiatr_kier = check_fresh(st.get("wiatr_kierunek"), st.get("wiatr_kierunek_data"), now_utc)
        wys_npm = parsuj_float(st.get("wysokosc_npm"))

        # Punkt rosy
        punkt_rosy = oblicz_punkt_rosy(temp, wilg)

        # Konwersja wiatru m/s -> km/h
        wiatr_sr_kmh = ms_na_kmh(wiatr_sr)
        wiatr_max_kmh = ms_na_kmh(wiatr_max)
        wiatr_poryw_kmh = ms_na_kmh(wiatr_poryw)

        # Bierzemy najsilniejszy zarejestrowany poryw
        porywy = [v for v in [wiatr_max_kmh, wiatr_poryw_kmh] if v is not None]
        maks_poryw_kmh = max(porywy) if porywy else None

        station_data = {
            "nazwa": st.get("nazwa_stacji", "?"),
            "kod": st.get("kod_stacji", ""),
            "lat": lat,
            "lon": lon,
            "wys_npm": wys_npm,
            "temp": temp,
            "temp_data": st.get("temperatura_powietrza_data"),
            "temp_grunt": temp_grunt,
            "wilgotnosc": wilg,
            "punkt_rosy": punkt_rosy,
            "wiatr_sr_kmh": wiatr_sr_kmh,
            "wiatr_max_kmh": wiatr_max_kmh,
            "wiatr_poryw_kmh": wiatr_poryw_kmh,
            "maks_poryw_kmh": maks_poryw_kmh,
            "wiatr_kierunek": wiatr_kier,
        }

        processed.append(station_data)

    # Statystyki
    z_temp = sum(1 for s in processed if s["temp"] is not None)
    z_wiatrem = sum(1 for s in processed if s["maks_poryw_kmh"] is not None)
    z_wilg = sum(1 for s in processed if s["wilgotnosc"] is not None)

    print(f"  Przetworzono: {len(processed)} stacji (pominięto {skipped} bez współrzędnych)")
    print(f"  Z temperaturą: {z_temp} | Z wiatrem: {z_wiatrem} | Z wilgotnością: {z_wilg}")

    # --- Zapis aktualnego snapshotu ---
    snapshot = {
        "czas_pobrania": now_str,
        "liczba_stacji": len(processed),
        "stacje": processed
    }

    with open(DANE_FILE, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, ensure_ascii=False, indent=2)
    print(f"  [OK] Zapisano aktualny snapshot: {DANE_FILE}")

    # --- Dopisanie do historii ---
    historia = []
    if os.path.exists(HISTORIA_FILE):
        try:
            with open(HISTORIA_FILE, "r", encoding="utf-8") as f:
                historia = json.load(f)
        except (json.JSONDecodeError, IOError):
            historia = []

    historia.append(snapshot)

    # Usuń snapshoty starsze niż MAX_HISTORY_HOURS
    cutoff = datetime.now() - timedelta(hours=MAX_HISTORY_HOURS)
    historia_filtered = []
    for snap in historia:
        try:
            snap_time = datetime.strptime(snap["czas_pobrania"], "%Y-%m-%d %H:%M:%S")
            if snap_time >= cutoff:
                historia_filtered.append(snap)
        except (ValueError, KeyError):
            pass

    with open(HISTORIA_FILE, "w", encoding="utf-8") as f:
        json.dump(historia_filtered, f, ensure_ascii=False)
    print(f"  [OK] Historia: {len(historia_filtered)} snapshotow (ostatnie {MAX_HISTORY_HOURS}h)")

    # Podsumowanie temperatury
    temps = [s["temp"] for s in processed if s["temp"] is not None]
    if temps:
        print(f"\n  [TEMP]  Temperatura: min={min(temps):.1f}°C  max={max(temps):.1f}°C  śr={sum(temps)/len(temps):.1f}°C")

    porywy = [s["maks_poryw_kmh"] for s in processed if s["maks_poryw_kmh"] is not None]
    if porywy:
        print(f"  [WIND] Maks poryw: {max(porywy):.1f} km/h")

    print("=" * 65)


if __name__ == "__main__":
    pobierz_dane()
