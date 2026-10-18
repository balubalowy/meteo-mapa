#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
4_Dashboard_IMGW.py - GIGANTYCZNY DASHBOARD JS
Dynamiczna mapa HTML generowana w locie, z zaawansowaną interpolacją (linear+nearest), 
izoliniami, i ekstremami historycznymi z ostatnich 24h.
"""

import json
import math
import os
import sys
import numpy as np
import requests
from datetime import datetime, timedelta
from scipy.interpolate import griddata
from shapely.geometry import shape, Point
from shapely.ops import unary_union
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DANE_FILE = os.path.join(SCRIPT_DIR, "Dane_IMGW.json")
HISTORIA_FILE = os.path.join(SCRIPT_DIR, "Historia_IMGW.json")
OUTPUT_HTML = os.path.join(SCRIPT_DIR, "Dashboard_IMGW.html")

# ================================================================
# KONFIGURACJA ZMIENNYCH
# ================================================================
TEMP_COLORSCALE = [
    [0.0, "#f4c2f4"], [0.055, "#e020e0"], [0.111, "#8a2be2"], [0.166, "#4b0082"],
    [0.222, "#000080"], [0.277, "#0000ff"], [0.333, "#1e90ff"], [0.388, "#00bfff"],
    [0.444, "#00ffff"], [0.5, "#00fa9a"], [0.555, "#32cd32"], [0.611, "#adff2f"],
    [0.666, "#ffd700"], [0.722, "#ffa500"], [0.777, "#ff4500"], [0.833, "#ff0000"],
    [0.888, "#8b0000"], [0.944, "#5c4033"], [1.0, "#808080"]
]
def _wnd(kmh, mx=259): return round(kmh/mx, 4)
WIND_COLORSCALE = [
    [0.0, "#FFFFFF"], [_wnd(9), "#C8FFFF"], [_wnd(19), "#00FFFF"], [_wnd(28), "#0088FF"],
    [_wnd(37), "#0000CD"], [_wnd(46), "#00C800"], [_wnd(56), "#80FF00"],
    [_wnd(65), "#FFFF00"], [_wnd(74), "#FFD700"], [_wnd(83), "#FFA500"],
    [_wnd(93), "#FF4500"], [_wnd(102), "#FF0000"], [_wnd(111), "#CC0000"],
    [_wnd(120), "#800000"], [_wnd(130), "#800080"], [_wnd(139), "#4B0082"],
    [_wnd(148), "#FF00FF"], [_wnd(157), "#FF69B4"], [_wnd(167), "#808080"],
    [_wnd(176), "#606060"], [_wnd(185), "#404040"], [_wnd(194), "#303030"],
    [_wnd(204), "#202020"], [1.0, "#000000"]
]
HUMIDITY_COLORSCALE = [[0.0, "#FFD700"], [0.25, "#FF8C00"], [0.5, "#32CD32"], [0.75, "#1E90FF"], [1.0, "#00008B"]]
DEWPOINT_COLORSCALE = [[0.0, "#0000FF"], [0.26, "#00BFFF"], [0.39, "#00FF7F"], [0.53, "#ADFF2F"], [0.66, "#FFD700"], [0.79, "#FF4500"], [0.92, "#FF0000"], [1.0, "#8B0000"]]

ZMIENNE = {
    "temp":  {"nazwa": "Temperatura", "cscale": "TEMP_COLORSCALE", "cmin": -40, "cmax": 50, "unit": "°C", "step": 2.0},
    "grunt": {"nazwa": "Temp. Gruntu", "cscale": "TEMP_COLORSCALE", "cmin": -40, "cmax": 50, "unit": "°C", "step": 2.0},
    "wiatr": {"nazwa": "Poryw Wiatru", "cscale": "WIND_COLORSCALE", "cmin": 0, "cmax": 259, "unit": "km/h", "step": 10.0},
    "wiatr_sr": {"nazwa": "Śr. Wiatr", "cscale": "WIND_COLORSCALE", "cmin": 0, "cmax": 259, "unit": "km/h", "step": 10.0},
    "wilg":  {"nazwa": "Wilgotność", "cscale": "HUMIDITY_COLORSCALE", "cmin": 0, "cmax": 100, "unit": "%", "step": 10.0},
    "rosy":  {"nazwa": "Punkt Rosy", "cscale": "DEWPOINT_COLORSCALE", "cmin": -10, "cmax": 28, "unit": "°C", "step": 2.0},
    "synop": {"nazwa": "Model Synoptyczny", "cscale": "TEMP_COLORSCALE", "cmin": -40, "cmax": 50, "unit": "", "step": 2.0},
}

OKRESY = ["now", "max3", "min3", "max6", "min6", "max12", "min12", "max24", "min24"]
OKRESY_NAZWY = {
    "now": "Aktualne", "max3": "Max 3h", "min3": "Min 3h", 
    "max6": "Max 6h", "min6": "Min 6h", "max12": "Max 12h", 
    "min12": "Min 12h", "max24": "Max 24h", "min24": "Min 24h"
}

def kier_na_strzalke(kier):
    if kier is None: return ""
    try:
        val = float(kier)
    except:
        return ""
    dirs = ["↓", "↙", "←", "↖", "↑", "↗", "→", "↘"]
    idx = round(val / 45.0) % 8
    return dirs[idx]

# ================================================================
# FUNKCJE POMOCNICZE MAPY
# ================================================================
def pobierz_polske():
    try:
        url = 'https://raw.githubusercontent.com/ppatrzyk/polska-geojson/master/wojewodztwa/wojewodztwa-min.geojson'
        geo_data = requests.get(url, timeout=10).json()
        polygons = [shape(f['geometry']).buffer(0) for f in geo_data['features']]
        return unary_union(polygons)
    except:
        url = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries/POL.geo.json'
        geo_data = requests.get(url).json()
        return shape(geo_data['features'][0]['geometry']).buffer(0)

def extract_contours(grid_z, grid_lon, grid_lat, interval):
    if len(grid_z) == 0: return [], [], []
    min_val = np.nanmin(grid_z)
    max_val = np.nanmax(grid_z)
    if np.isnan(min_val): return [], [], []
    
    levels = np.arange(np.floor(min_val/interval)*interval, np.ceil(max_val/interval)*interval + interval, interval)
    fig_c = plt.figure()
    ax = fig_c.add_subplot(111)
    cs = ax.contour(grid_lon, grid_lat, grid_z, levels=levels)
    
    lons, lats, txts = [], [], []
    for level, path in zip(levels, cs.get_paths()):
        codes = path.codes if path.codes is not None else np.zeros(len(path.vertices))
        for i, (coord, code) in enumerate(zip(path.vertices, codes)):
            if code == 1 and i > 0: # MOVETO = break line
                lons.append(None); lats.append(None); txts.append(None)
            lons.append(coord[0])
            lats.append(coord[1])
            txts.append(f"{level}")
        lons.append(None); lats.append(None); txts.append(None)
    plt.close(fig_c)
    return lats, lons, txts

# ================================================================
# GŁÓWNA FUNKCJA
# ================================================================
def create_grid(lats, lons, vals, u_vals=None, v_vals=None):
    """Tworzy interpolowaną siatkę dla heatmapy oraz wektorów."""
    if len(vals) < 3:
        return [], [], [], [], [], []
    
    # 1. Tworzenie regularnej siatki
    grid_lon, grid_lat = np.mgrid[13.5:24.5:0.04, 48.5:55.5:0.04]
    
    points = np.array([lons, lats]).T
    
    # Próba interpolacji linear, z fallbackiem do nearest (łatanie dziur na granicach)
    grid_z_linear = griddata(points, vals, (grid_lon, grid_lat), method='linear')
    grid_z_nearest = griddata(points, vals, (grid_lon, grid_lat), method='nearest')
    grid_z = np.where(np.isnan(grid_z_linear), grid_z_nearest, grid_z_linear)
    
    # Interpolacja U i V
    grid_u, grid_v = None, None
    if u_vals and v_vals and len(u_vals) == len(vals):
        grid_u_lin = griddata(points, u_vals, (grid_lon, grid_lat), method='linear')
        grid_u_near = griddata(points, u_vals, (grid_lon, grid_lat), method='nearest')
        grid_u = np.where(np.isnan(grid_u_lin), grid_u_near, grid_u_lin)
        
        grid_v_lin = griddata(points, v_vals, (grid_lon, grid_lat), method='linear')
        grid_v_near = griddata(points, v_vals, (grid_lon, grid_lat), method='nearest')
        grid_v = np.where(np.isnan(grid_v_lin), grid_v_near, grid_v_lin)
    
    poland_polygon = pobierz_polske()
    
    glats, glons, gvals = [], [], []
    gu, gv = [], []
    
    grid_masked = np.full(grid_lon.shape, np.nan)
    
    # Maskowanie
    for i in range(grid_lon.shape[0]):
        for j in range(grid_lon.shape[1]):
            lon, lat = grid_lon[i, j], grid_lat[i, j]
            val = grid_z[i, j]
            if not np.isnan(val) and poland_polygon.contains(Point(lon, lat)):
                glats.append(round(lat,3))
                glons.append(round(lon,3))
                gvals.append(round(val,2))
                grid_masked[i, j] = val
                if grid_u is not None and grid_v is not None:
                    gu.append(grid_u[i, j])
                    gv.append(grid_v[i, j])
    
    # Generowanie siatki wektorów strzałek wiatru
    w_lats, w_lons, w_txts = [], [], []
    if len(gu) > 0 and len(gv) > 0:
        # Pamiętajmy, że chcemy próbkować "co n-ty" punkt dla czytelności mapy:
        for i in range(0, len(glats), 40): # Rzadsza siatka wektorów (mniej więcej co 40 punkt w 1D)
            u = gu[i]
            v = gv[i]
            spd = math.sqrt(u*u + v*v)
            if spd > 2.0: # Pokazujemy strzałki tylko gdy wiatr > 2 km/h
                # Obliczanie kierunku (odwrócony atan2 bo u/v są wektorami ruchu powietrza)
                angle = math.degrees(math.atan2(u, v))
                if angle < 0: angle += 360
                
                # Zmiana kąta na strzałkę Unicode
                # 0=N, 90=E, 180=S, 270=W
                idx = int(round(angle / 45.0)) % 8
                arrows = ['', '↗', '', '↘', '', '↙', '', '↖']
                w_txts.append(arrows[idx])
                w_lats.append(glats[i])
                w_lons.append(glons[i])

    return glats, glons, gvals, w_lats, w_lons, w_txts, grid_masked, grid_lon, grid_lat

def generate_dashboard():
    print("=" * 65)
    print("  GENEROWANIE GIGANTYCZNEGO DASHBOARDU IMGW")
    print("=" * 65)

    if not os.path.exists(DANE_FILE):
        print(f"  [!] Brak pliku {DANE_FILE}")
        return

    # Ladowanie historii
    historia = []
    if os.path.exists(HISTORIA_FILE):
        with open(HISTORIA_FILE, "r", encoding="utf-8") as f:
            historia = json.load(f)
            
    if not historia:
        with open(DANE_FILE, "r", encoding="utf-8") as f:
            historia = [json.load(f)]

    print(f"  Wczytano {len(historia)} snapshotów z historii.")
    
    latest_snap = historia[-1]
    latest_time_str = latest_snap["czas_pobrania"]
    try:
        latest_time = datetime.strptime(latest_time_str, "%Y-%m-%d %H:%M:%S")
    except:
        latest_time = datetime.now()

    # Grupowanie danych wg stacji i wyliczanie ekstremow
    # station_id -> { "nazwa", "lat", "lon", "temp": {"now": X, "max3": Y, ...} }
    master_stations = {}
    
    # Dodajemy puste struktury z najnowszego snapshota, zeby miec baze stacji
    for st in latest_snap["stacje"]:
        kod = st["kod"]
        master_stations[kod] = {
            "nazwa": st["nazwa"], "lat": st["lat"], "lon": st["lon"],
            "temp": {}, "grunt": {}, "wiatr": {}, "wilg": {}, "rosy": {}, "wiatr_sr": {}, "kierunek": {},
            "czas": {} # przechowuje stringi np. "14:20" dla hove'a
        }
        
    # Funkcja pomocnicza do mapowania zmiennych API na nasze krotkie klucze
    api_map = {
        "temp": "temp", "grunt": "temp_grunt", 
        "wiatr": "maks_poryw_kmh", "wilg": "wilgotnosc", "rosy": "punkt_rosy",
        "wiatr_sr": "wiatr_sr_kmh", "kierunek": "wiatr_kierunek"
    }

    print("  Przetwarzanie ekstremów historycznych...")
    for snap in historia:
        try:
            snap_time = datetime.strptime(snap["czas_pobrania"], "%Y-%m-%d %H:%M:%S")
            diff_h = (latest_time - snap_time).total_seconds() / 3600.0
        except:
            continue
            
        is_3h = diff_h <= 3.1
        is_6h = diff_h <= 6.1
        is_12h = diff_h <= 12.1
        is_24h = diff_h <= 24.1
        is_now = diff_h <= 0.1 # w granicach tego samego snapshota

        for st in snap["stacje"]:
            kod = st["kod"]
            if kod not in master_stations: continue
            
            # Czas pomiaru ze stacji (IMGW API podaje w UTC)
            t_data = st.get("temp_data")
            is_valid_data = True
            if t_data:
                try:
                    # Parsujemy jako UTC i dodajemy 2h (CEST)
                    cz_dt = datetime.strptime(t_data, "%Y-%m-%d %H:%M:%S") + timedelta(hours=2)
                    
                    # Filtrowanie
                    age_hours = (snap_time - cz_dt).total_seconds() / 3600.0
                    if age_hours > 6:
                        is_valid_data = False
                    if is_now and age_hours > 1.5:
                        is_valid_data = False
                        
                    cz = cz_dt.strftime("%H:%M")
                except:
                    cz = str(t_data)
            else:
                cz = snap_time.strftime("%H:%M")

            if not is_valid_data:
                continue # Ignorujemy całkowicie przestarzałe dane z martwych stacji (np. sprzed miesiąca)

            for k, api_k in api_map.items():
                v = st.get(api_k)
                if v is None: continue
                
                # Zabezpieczenie przed zepsutymi czujnikami wiatru
                if k in ["wiatr", "wiatr_sr"]:
                    nazwa_st = st.get("nazwa", "").upper()
                    if nazwa_st in ["DĄBRÓWKA STARA", "CHRZĄSTOWO", "ŚWIERKLANIEC", "ŚWIERKLANY"]:
                        continue
                    # Wiatr > 120 km/h poza wysokimi górami to na 99% błąd sprzętu IMGW
                    if v > 120 and nazwa_st not in ["ŚNIEŻKA", "KASPROWY WIERCH"]:
                        continue
                
                ms = master_stations[kod][k]
                
                # Zapisujemy czas pomiaru dla najnowszego (now)
                if is_now: 
                    ms["now"] = v
                    ms["czas_now"] = cz
                
                def update_minmax(okr_min, okr_max, val, c_time):
                    if okr_min not in ms or val < ms[okr_min]: 
                        ms[okr_min] = val
                        ms[f"czas_{okr_min}"] = c_time
                    if okr_max not in ms or val > ms[okr_max]: 
                        ms[okr_max] = val
                        ms[f"czas_{okr_max}"] = c_time

                if is_3h: update_minmax("min3", "max3", v, cz)
                if is_6h: update_minmax("min6", "max6", v, cz)
                if is_12h: update_minmax("min12", "max12", v, cz)
                if is_24h: update_minmax("min24", "max24", v, cz)

    # Przygotowanie Polski i siatki (grid rozszerzony zeby zakryc cala Polske)
    print("  Pobieranie konturów Polski...")
    poland_polygon = pobierz_polske()
    js_data = {}
    total_iters = len(ZMIENNE) * len(OKRESY)
    curr_iter = 0

    print("  Budowanie bazy danych przestrzennych (to zajmie chwilę)...")
    for z_key, z_info in ZMIENNE.items():
        js_data[z_key] = {}
        for okres in OKRESY:
            curr_iter += 1
            sys.stdout.write(f"\r    Postęp: {curr_iter}/{total_iters} [{z_key} {okres}]      ")
            
            lats_ok, lons_ok, vals_ok, u_vals, v_vals, hovs_ok, txts_ok, angs_ok = [], [], [], [], [], [], [], []
            lats_nan, lons_nan, hovs_nan = [], [], []
            
            for kod, st in master_stations.items():
                ms = st["temp"] if z_key == "synop" else st[z_key]
                val = ms.get(okres)
                lat, lon, nazwa = st["lat"], st["lon"], st["nazwa"]
                czas = ms.get(f"czas_{okres}", ms.get("czas_now", "--:--"))
                
                if val is not None:
                    lats_ok.append(lat); lons_ok.append(lon); vals_ok.append(val)
                    if z_key in ["wiatr", "wiatr_sr"]:
                        kier = st["kierunek"].get(okres)
                        if kier is not None:
                            rad = math.radians(kier)
                            u_vals.append(-val * math.sin(rad)); v_vals.append(-val * math.cos(rad))
                        else: u_vals.append(0); v_vals.append(0)
                    
                    if z_key == "synop":
                        v_t, v_r, v_ws, v_wp, kier = st["temp"].get(okres), st["rosy"].get(okres), st["wiatr_sr"].get(okres), st["wiatr"].get(okres), st["kierunek"].get(okres)
                        strz = kier_na_strzalke(kier)
                        
                        txt_t = f"{v_t:.1f}" if v_t is not None else ""
                        txt_ws = f"{v_ws:.0f} {strz}" if v_ws is not None else ""
                        txt_r = f"{v_r:.1f}" if v_r is not None else ""
                        txt_wp = f"{v_wp:.0f}" if v_wp is not None else ""
                        
                        txts_ok.append(f"{txt_t}|{txt_ws}|{txt_r}|{txt_wp}")
                        hovs_ok.append(f"<b>{nazwa}</b><br>Temp: {txt_t}°C | Rosy: {txt_r}°C<br>Wiatr Śr: {txt_ws} (Poryw: {txt_wp})<br>Czas: {czas}")
                    elif z_key in ["wiatr", "wiatr_sr"]:
                        fmt = f"{val:.1f}" if val < 10 else f"{val:.0f}"
                        txts_ok.append(fmt); angs_ok.append(0)
                        hovs_ok.append(f"<b>{nazwa}</b><br>{z_info['nazwa']}: {fmt} {z_info['unit']} {kier_na_strzalke(st['kierunek'].get(okres))}<br>Czas: {czas}")
                    else:
                        fmt = f"{val:.1f}"
                        txts_ok.append(fmt); angs_ok.append(0)
                        hovs_ok.append(f"<b>{nazwa}</b><br>{z_info['nazwa']}: {fmt} {z_info['unit']}<br>Czas: {czas}")
                else: lats_nan.append(lat); lons_nan.append(lon); hovs_nan.append(f"<b>{nazwa}</b><br>Brak danych")

            glats, glons, gvals, wlats, wlons, wtxts, grid_masked, grid_lon, grid_lat = create_grid(lats_ok, lons_ok, vals_ok, u_vals, v_vals)
            c_lats, c_lons, c_txts = extract_contours(grid_masked, grid_lon, grid_lat, z_info["step"])

            js_data[z_key][okres] = {
                "pt_lats": lats_ok, "pt_lons": lons_ok, "pt_vals": vals_ok, "pt_hov": hovs_ok, "pt_txts": txts_ok,
                "gr_lats": glats, "gr_lons": glons, "gr_vals": gvals, "w_lats": wlats, "w_lons": wlons, "w_txts": wtxts
            }

    js_colors = {"TEMP_COLORSCALE": TEMP_COLORSCALE, "WIND_COLORSCALE": WIND_COLORSCALE, "HUMIDITY_COLORSCALE": HUMIDITY_COLORSCALE, "DEWPOINT_COLORSCALE": DEWPOINT_COLORSCALE}

    html_template = f"""<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard IMGW - Ekstrema Historyczne</title>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        body {{ margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, sans-serif; background: linear-gradient(135deg, #090914 0%, #1a1a3e 100%); color: #e0e0e0; }}
        .header {{ padding: 10px 25px; background: rgba(10, 10, 40, 0.95); border-bottom: 2px solid #3366ff; box-shadow: 0 4px 10px rgba(0,0,0,0.5); position: relative; z-index: 100; }}
        .header h1 {{ margin: 0; font-size: 22px; color: #6699ff; }}
        .header .sub {{ font-size: 13px; color: #aaa; margin-top: 2px; }}
        .controls {{ display: flex; gap: 15px; margin-top: 10px; align-items: center; flex-wrap: wrap; }}
        .control-group {{ display: flex; flex-direction: column; }}
        .control-group label {{ font-size: 11px; color: #888; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 1px; }}
        .checkbox-group {{ display: flex; flex-direction: column; justify-content: center; background: rgba(0,0,0,0.2); padding: 5px 10px; border-radius: 4px; border: 1px solid #333; }}
        .checkbox-row {{ display: flex; gap: 12px; font-size: 13px; margin-top: 2px; }}
        .checkbox-row label {{ color: #ccc; text-transform: none; letter-spacing: normal; display: flex; align-items: center; gap: 4px; cursor: pointer; margin-bottom: 0; }}
        select {{ background: #1e1e3f; color: #fff; border: 1px solid #444; padding: 6px 12px; border-radius: 4px; font-size: 14px; cursor: pointer; outline: none; }}
        select:focus {{ border-color: #3366ff; }}
        .stats {{ display: flex; gap: 15px; flex-wrap: wrap; margin-top: 10px; }}
        .stat-box {{ background: rgba(50, 50, 100, 0.5); padding: 5px 12px; border-radius: 6px; font-size: 12px; border: 1px solid rgba(255,255,255,0.1); }}
        .stat-box .val {{ color: #66ccff; font-weight: bold; }}
        .map-container {{ width: 100%; height: calc(100vh - 140px); position: relative; }}
        #plot {{ width: 100%; height: 100%; }}
        
        .sliders-container {{ position: absolute; bottom: 20px; left: 20px; background: rgba(10, 10, 40, 0.85); padding: 15px; border-radius: 8px; z-index: 1000; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 10px; width: 300px; }}
        .slider-row {{ display: flex; flex-direction: column; }}
        .slider-row label {{ font-size: 12px; margin-bottom: 5px; display: flex; justify-content: space-between; }}
        input[type=range] {{ -webkit-appearance: none; width: 100%; background: transparent; }}
        input[type=range]::-webkit-slider-thumb {{ -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: #3366ff; cursor: pointer; margin-top: -6px; }}
        input[type=range]::-webkit-slider-runnable-track {{ width: 100%; height: 4px; cursor: pointer; background: #444; border-radius: 2px; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Baza Danych IMGW - Pełna Historia i Ekstrema</h1>
        <div class="sub">Czas wygenerowania: <b>{{latest_time_str}}</b> | Przeanalizowano {{len(historia)}} snapshotów | Ucięte krawędzie państwa załatane hybrydowo (linear+nearest)!</div>
        
        <div class="controls">
            <div class="control-group">
                <label>Parametr</label>
                <select id="sel-zmienna" onchange="updateMap()">
                    <option value="temp">Temperatura</option>
                    <option value="grunt">Temperatura Gruntu</option>
                    <option value="wiatr">Poryw Wiatru</option>
                    <option value="wiatr_sr">Średnia Prędkość Wiatru</option>
                    <option value="wilg">Wilgotność</option>
                    <option value="rosy">Punkt Rosy</option>
                    <option value="synop">Model Synoptyczny (Wszystko)</option>
                </select>
            </div>
            <div class="control-group">
                <label>Horyzont Czasowy</label>
                <select id="sel-czas" onchange="updateMap()">
                    <option value="now">Aktualnie</option>
                    <option value="max3">Maksima - Ostatnie 3h</option>
                    <option value="min3">Minima - Ostatnie 3h</option>
                    <option value="max6">Maksima - Ostatnie 6h</option>
                    <option value="min6">Minima - Ostatnie 6h</option>
                    <option value="max12">Maksima - Ostatnie 12h</option>
                    <option value="min12">Minima - Ostatnie 12h</option>
                    <option value="max24">Maksima - Ostatnie 24h</option>
                    <option value="min24">Minima - Ostatnie 24h</option>
                </select>
            </div>
            <div class="control-group checkbox-group">
                <label>Warstwy Mapy</label>
                <div class="checkbox-row">
                    <label><input type="checkbox" id="chk-inter" onchange="updateMap()" checked> Interpolacja</label>
                    <label><input type="checkbox" id="chk-iso" onchange="updateMap()" checked> Izolinie</label>
                    <label><input type="checkbox" id="chk-pt" onchange="updateMap()"> Punkty</label>
                    <label><input type="checkbox" id="chk-txt" onchange="updateMap()"> Wartości</label>
                </div>
            </div>
            <div class="control-group">
                <label>Podkład Mapy</label>
                <select id="sel-style" onchange="updateStyle()">
                    <option value="carto-darkmatter">Dark Mode (Czytelny)</option>
                    <option value="carto-positron">Light Mode (Miasta pod spodem)</option>
                    <option value="open-street-map">OSM (Szczegółowy)</option>
                </select>
            </div>
            
            <div class="stats">
                <div class="stat-box">Stacje (dane): <span class="val" id="st-dane">0</span></div>
                <div class="stat-box">Zakres: <span class="val" id="st-zakres">0 - 0</span></div>
            </div>
        </div>
    </div>
    
    <div class="map-container">
        <div id="plot"></div>
        <div class="sliders-container">
            <div class="slider-row">
                <label><span>Przezrocz. Tła (Interpolacji):</span> <span id="val-op-gr">70%</span></label>
                <input type="range" id="sld-op-gr" min="0" max="10" value="7" oninput="updateSliders()">
            </div>
            <div class="slider-row" style="margin-top:5px;">
                <label><span>Przezrocz. Punktów (Stacji):</span> <span id="val-op-pt">100%</span></label>
                <input type="range" id="sld-op-pt" min="0" max="10" value="10" oninput="updateSliders()">
            </div>
            <div class="slider-row" style="margin-top:5px;">
                <label><span>Rozmiar Tła (Interpolacji):</span> <span id="val-sz-gr">15</span></label>
                <input type="range" id="sld-sz-gr" min="5" max="50" value="15" oninput="updateSliders()">
                <small style="color:#aaa; font-size:10px; margin-top:2px;">Zwiększ na przybliżeniu mapy, aby załatać dziury w siatce.</small>
            </div>
            <div class="slider-row" style="margin-top:5px;">
                <label><span>Rozmiar Punktów (Stacji):</span> <span id="val-sz-pt">16</span></label>
                <input type="range" id="sld-sz-pt" min="4" max="40" value="16" oninput="updateSliders()">
            </div>
        </div>
    </div>

    <script>
        const MAP_DATA = {json.dumps(js_data)};
        const ZMIENNE = {json.dumps(ZMIENNE)};
        const COLORS = {json.dumps(js_colors)};
        
        // Konfiguracja mapy początkowej - puste ścieżki
        const traces = [
            // 0: Grid (Interpolacja)
            {{ type: 'scattermap', mode: 'markers', lat: [], lon: [], hoverinfo: "skip", marker: {{size: 15, showscale: true}} }},
            // 1: Izolinie (Kontury)
            {{ type: 'scattermap', mode: 'lines', lat: [], lon: [], hoverinfo: "skip", line: {{width: 1, color: 'rgba(0,0,0,0.4)'}} }},
            // 2: Punkty OK (Główna warstwa stacji)
            {{ type: 'scattermap', mode: 'markers', lat: [], lon: [], text: [], hoverinfo: "text", textfont: {{size: 11, color: "black"}}, textposition: "middle center", marker: {{size: 16, showscale: false}} }},
            // 3: Punkty Brak Danych
            {{ type: 'scattermap', mode: 'markers', lat: [], lon: [], text: [], hoverinfo: "skip", marker: {{size: 4, color: 'rgba(255,255,255,0.0)'}} }},
            // 4: Strzałki Wiatru (Globalna Siatka wektorowa)
            {{ type: 'scattermap', mode: 'text', lat: [], lon: [], text: [], hoverinfo: "skip", textfont: {{size: 14, color: "rgba(0,0,0,0.7)"}}, textposition: "middle center" }},
            // 5: Etykiety (Top Left) Synop - Temp
            {{ type: 'scattermap', mode: 'text', lat: [], lon: [], text: [], hoverinfo: "text", textfont: {{size: 12, color: "#990000"}}, textposition: "top left" }},
            // 6: Etykiety (Bottom Left) Synop - Rosy
            {{ type: 'scattermap', mode: 'text', lat: [], lon: [], text: [], hoverinfo: "text", textfont: {{size: 12, color: "#006600"}}, textposition: "bottom left" }},
            // 7: Etykiety (Top Right) Synop - Wiatr Śr
            {{ type: 'scattermap', mode: 'text', lat: [], lon: [], text: [], hoverinfo: "text", textfont: {{size: 12, color: "#000099"}}, textposition: "top right" }},
            // 8: Etykiety (Bottom Right) Synop - Wiatr Poryw
            {{ type: 'scattermap', mode: 'text', lat: [], lon: [], text: [], hoverinfo: "text", textfont: {{size: 12, color: "#660066"}}, textposition: "bottom right" }}
        ];

        const layout = {{
            margin: {{l: 0, r: 0, t: 0, b: 0}},
            showlegend: false,
            map: {{ style: "carto-darkmatter", center: {{lat: 52.0, lon: 19.2}}, zoom: 5.5 }}
        }};
        
        Plotly.newPlot('plot', traces, layout, {{responsive: true}}).then(() => {{
            updateMap();
        }});

        function updateMap() {{
            const z_key = document.getElementById("sel-zmienna").value;
            const okres = document.getElementById("sel-czas").value;
            
            const d = MAP_DATA[z_key][okres];
            const zi = ZMIENNE[z_key];
            const cscale = COLORS[zi.cscale];
            
            // Formatowanie etykiet tekstowych
            let lbls = [], lbls_tl = [], lbls_tr = [], lbls_bl = [], lbls_br = [];
            const is_synop = (z_key === 'synop');
            
            if (is_synop) {{
                lbls_tl = d.pt_txts.map(t => (t.split('|')[0] !== "None" ? t.split('|')[0] : ""));
                lbls_tr = d.pt_txts.map(t => (t.split('|')[1] !== "None" ? t.split('|')[1] : ""));
                lbls_bl = d.pt_txts.map(t => (t.split('|')[2] !== "None" ? t.split('|')[2] : ""));
                lbls_br = d.pt_txts.map(t => (t.split('|')[3] !== "None" ? t.split('|')[3] : ""));
            }} else {{
                lbls = d.pt_txts;
            }}
            
            // Widoczność warstw z checkboxów
            const v_gr = document.getElementById("chk-inter").checked;
            const v_iso = document.getElementById("chk-iso").checked;
            const v_pt = is_synop ? true : document.getElementById("chk-pt").checked;
            const v_txt = is_synop ? true : document.getElementById("chk-txt").checked;
            
            const v_gr_f = is_synop ? false : v_gr;
            const v_iso_f = is_synop ? false : v_iso;
            
            const is_wind = (z_key === 'wiatr' || z_key === 'wiatr_sr');
            
            // Mapbox bez płatnego tokena i spritów odrzuca "triangle", więc dla wiatru ustawiamy zwykłe koło,
            // ale kierunek wiatru pokażemy za pomocą tekstu ze strzałkami Unicode na warstwie wektorowej (Trace 4)!
            const pt_sym = null; // null wymusza natywne kółko Plotly!
            const pt_ang = 0;
            
            // Pobieranie wartości ze sliderów, aby zachować stan przy każdej aktualizacji
            const op_gr = document.getElementById("sld-op-gr").value / 10.0;
            const op_pt = document.getElementById("sld-op-pt").value / 10.0;
            const sz_gr = parseInt(document.getElementById("sld-sz-gr").value);
            let sz_pt = parseInt(document.getElementById("sld-sz-pt").value);
            if (is_wind) sz_pt = sz_pt + 8; // Trójkąty (jeśli byłyby widoczne) wydają się mniejsze, wiec powiekszamy. Z kołami też pasuje.
            
            // Tryb renderingu Trace 2 (Punktów) – łączymy znacznik z tekstem dla idealnej synchronizacji!
            const t2_mode = (v_txt && !is_synop) ? 'markers+text' : 'markers';
            
            // Aktualizacja traces
            const update = {{
                'lat': [d.gr_lats, d.c_lats, d.pt_lats, [], d.w_lats, d.pt_lats, d.pt_lats, d.pt_lats, d.pt_lats],
                'lon': [d.gr_lons, d.c_lons, d.pt_lons, [], d.w_lons, d.pt_lons, d.pt_lons, d.pt_lons, d.pt_lons],
                'mode': ['markers', 'lines', t2_mode, 'markers', 'text', 'text', 'text', 'text', 'text'],
                'marker.color': [d.gr_vals, null, d.pt_vals, null, null, null, null, null, null],
                'marker.colorscale': [cscale, null, cscale, null, null, null, null, null, null],
                'marker.cmin': [zi.cmin, null, zi.cmin, null, null, null, null, null, null],
                'marker.cmax': [zi.cmax, null, zi.cmax, null, null, null, null, null, null],
                'marker.colorbar': [ (v_gr_f ? {{title: zi.nazwa + " [" + zi.unit + "]", x: 1.02}} : null), null, (v_pt && !is_synop ? {{title: zi.nazwa + " [" + zi.unit + "]", x: 1.02}} : null), null, null, null, null, null, null ],
                'marker.symbol': [null, null, pt_sym, null, null, null, null, null, null],
                'marker.angle': [null, null, pt_ang, null, null, null, null, null, null],
                'marker.size': [sz_gr, null, sz_pt, null, null, null, null, null, null],
                'marker.opacity': [op_gr, null, op_pt, null, null, null, null, null, null],
                'hovertext': [null, null, d.pt_hov, null, null, d.pt_hov, d.pt_hov, d.pt_hov, d.pt_hov],
                'text': [null, null, lbls, null, d.w_txts, lbls_tl, lbls_bl, lbls_tr, lbls_br],
                'visible': [v_gr_f, v_iso_f, v_pt, false, (is_wind && v_gr_f), (v_txt && is_synop), (v_txt && is_synop), (v_txt && is_synop), (v_txt && is_synop)]
            }};
            
            Plotly.restyle('plot', update);
            
            // Aktualizacja statystyk
            document.getElementById('st-dane').innerText = d.pt_vals.length;
            if(d.pt_vals.length > 0) {{
                const min = Math.min(...d.pt_vals).toFixed(1);
                const max = Math.max(...d.pt_vals).toFixed(1);
                document.getElementById('st-zakres').innerText = `${{min}} ${{zi.unit}} - ${{max}} ${{zi.unit}}`;
            }} else {{
                document.getElementById('st-zakres').innerText = "Brak danych";
            }}
        }}
        
        function updateStyle() {{
            const style = document.getElementById("sel-style").value;
            Plotly.relayout('plot', {{'map.style': style}});
        }}
        
        function updateSliders() {{
            const op_gr = document.getElementById("sld-op-gr").value;
            document.getElementById("val-op-gr").innerText = (op_gr * 10) + "%";
            
            const op_pt = document.getElementById("sld-op-pt").value;
            document.getElementById("val-op-pt").innerText = (op_pt * 10) + "%";
            
            const sz_gr = document.getElementById("sld-sz-gr").value;
            document.getElementById("val-sz-gr").innerText = sz_gr;
            
            const sz_pt = document.getElementById("sld-sz-pt").value;
            document.getElementById("val-sz-pt").innerText = sz_pt;

            updateMap();
        }}
        
        // Inicjalizacja
        setTimeout(updateMap, 100);
        
    </script>
</body>
</html>"""
    
    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(html_template)
    print(f"  [OK] Gigantyczny Dashboard zapisany: {OUTPUT_HTML}")
    print("=" * 65)

if __name__ == "__main__":
    generate_dashboard()
