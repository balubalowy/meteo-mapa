#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_map_data_firebase.py
Przetwarzanie danych historycznych IMGW i generowanie bazy przestrzennej do Firebase RTDB.
Zdekomponowana architektura: modularne funkcje bez zagnieżdżeń (eliminacja Bumpy Road).
"""

import json
import math
import os
import sys
import requests
from datetime import datetime, timedelta

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FIREBASE_URL = "https://meteo-bbe28-default-rtdb.europe-west1.firebasedatabase.app"

TEMP_COLORSCALE = [
    [0.0, "#f4c2f4"], [0.055, "#e020e0"], [0.111, "#8a2be2"], [0.166, "#4b0082"],
    [0.222, "#000080"], [0.277, "#0000ff"], [0.333, "#1e90ff"], [0.388, "#00bfff"],
    [0.444, "#00ffff"], [0.5, "#00fa9a"], [0.555, "#32cd32"], [0.611, "#adff2f"],
    [0.666, "#ffd700"], [0.722, "#ffa500"], [0.777, "#ff4500"], [0.833, "#ff0000"],
    [0.888, "#8b0000"], [0.944, "#5c4033"], [1.0, "#808080"]
]

def _wnd(kmh, mx=259):
    return round(kmh / mx, 4)

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

TREND_TEMP_COLORSCALE = [
    [0.0, "#1e3a8a"], [0.2, "#3b82f6"], [0.4, "#93c5fd"],
    [0.5, "#f3f4f6"],
    [0.6, "#fca5a5"], [0.8, "#ef4444"], [1.0, "#991b1b"]
]

TREND_HUMIDITY_COLORSCALE = [
    [0.0, "#854d0e"], [0.25, "#d97706"],
    [0.5, "#f3f4f6"],
    [0.75, "#0284c7"], [1.0, "#1e3a8a"]
]

ZMIENNE = {
    "temp":  {"nazwa": "Temperatura", "cscale": "TEMP_COLORSCALE", "cmin": -40, "cmax": 50, "unit": "°C", "step": 2.0},
    "grunt": {"nazwa": "Temp. Gruntu", "cscale": "TEMP_COLORSCALE", "cmin": -40, "cmax": 50, "unit": "°C", "step": 2.0},
    "wiatr": {"nazwa": "Poryw Wiatru", "cscale": "WIND_COLORSCALE", "cmin": 0, "cmax": 259, "unit": "km/h", "step": 10.0},
    "wiatr_sr": {"nazwa": "Śr. Wiatr", "cscale": "WIND_COLORSCALE", "cmin": 0, "cmax": 259, "unit": "km/h", "step": 10.0},
    "wilg":  {"nazwa": "Wilgotność", "cscale": "HUMIDITY_COLORSCALE", "cmin": 0, "cmax": 100, "unit": "%", "step": 10.0},
    "rosy":  {"nazwa": "Punkt Rosy", "cscale": "DEWPOINT_COLORSCALE", "cmin": -10, "cmax": 28, "unit": "°C", "step": 2.0},
    "synop": {"nazwa": "Model Synoptyczny", "cscale": "TEMP_COLORSCALE", "cmin": -40, "cmax": 50, "unit": "", "step": 2.0},
}

OKRESY = ["now", "max5", "min5", "trend1h", "trend2h", "trend3h", "trend5h"]
IGNORED_WIND_STATIONS = {"DĄBRÓWKA STARA", "CHRZĄSTOWO", "ŚWIERKLANIEC", "ŚWIERKLANY"}
MOUNTAIN_STATIONS = {"ŚNIEŻKA", "KASPROWY WIERCH"}

API_MAP = {
    "temp": "temp", "grunt": "temp_grunt",
    "wiatr": "maks_poryw_kmh", "wilg": "wilgotnosc", "rosy": "punkt_rosy",
    "wiatr_sr": "wiatr_sr_kmh", "kierunek": "wiatr_kierunek"
}

def kier_na_strzalke(kier):
    if kier is None:
        return ""
    try:
        val = float(kier)
    except (ValueError, TypeError):
        return ""
    dirs = ["↓", "↙", "←", "↖", "↑", "↗", "→", "↘"]
    return dirs[round(val / 45.0) % 8]

def is_valid_wind_reading(station_name, val):
    name = (station_name or "").upper()
    if name in IGNORED_WIND_STATIONS:
        return False
    if val > 120 and name not in MOUNTAIN_STATIONS:
        return False
    return True

def parse_reading_timestamp(t_data, snap_time, is_now):
    if not t_data:
        return snap_time.strftime("%H:%M"), True
    try:
        cz_dt = datetime.strptime(t_data, "%Y-%m-%d %H:%M:%S") + timedelta(hours=2)
        age_hours = (snap_time - cz_dt).total_seconds() / 3600.0
        if age_hours > 6 or (is_now and age_hours > 1.5):
            return str(t_data), False
        return cz_dt.strftime("%H:%M"), True
    except (ValueError, TypeError):
        return str(t_data), True

def update_station_extrema(ms, val, cz, is_now, is_5h):
    if is_now:
        ms["now"] = val
        ms["czas_now"] = cz
    if is_5h:
        if "min5" not in ms or val < ms["min5"]:
            ms["min5"] = val
            ms["czas_min5"] = cz
        if "max5" not in ms or val > ms["max5"]:
            ms["max5"] = val
            ms["czas_max5"] = cz

def process_station_snapshot(snap, master_stations, is_now, is_5h, snap_time):
    for st in snap.get("stacje", []):
        kod = st.get("kod")
        if kod not in master_stations:
            continue

        cz, is_valid = parse_reading_timestamp(st.get("temp_data"), snap_time, is_now)
        if not is_valid:
            continue
        if is_now:
            master_stations[kod]["czas_now"] = cz

        for k, api_k in API_MAP.items():
            v = st.get(api_k)
            if v is None:
                continue
            if k in ["wiatr", "wiatr_sr"] and not is_valid_wind_reading(st.get("nazwa"), v):
                continue
            update_station_extrema(master_stations[kod][k], v, cz, is_now, is_5h)

def find_closest_history_snapshot(historia, target_dt):
    best_snap = None
    min_sec_diff = float("inf")
    for s in historia:
        try:
            st_dt = datetime.strptime(s["czas_pobrania"], "%Y-%m-%d %H:%M:%S")
            sec_diff = abs((st_dt - target_dt).total_seconds())
            if sec_diff < min_sec_diff and sec_diff <= 45 * 60:
                min_sec_diff = sec_diff
                best_snap = (s, st_dt)
        except (ValueError, KeyError):
            continue
    return best_snap

def calculate_snapshot_trends(historia, latest_time, master_stations):
    print("  Wyliczanie trendów czasowych (1h, 2h, 3h, 5h)...")
    for hours_back in [1, 2, 3, 5]:
        target_dt = latest_time - timedelta(hours=hours_back)
        best = find_closest_history_snapshot(historia, target_dt)
        if not best:
            continue

        past_snap, past_dt = best
        dt_actual_hours = (latest_time - past_dt).total_seconds() / 3600.0
        if dt_actual_hours < 0.4:
            continue

        past_map = {s["kod"]: s for s in past_snap.get("stacje", [])}
        trend_key = f"trend{hours_back}h"

        for kod, ms_st in master_stations.items():
            st_past = past_map.get(kod)
            if not st_past:
                continue
            for k, api_k in API_MAP.items():
                v_now = ms_st[k].get("now")
                v_past = st_past.get(api_k)
                if v_now is None or v_past is None:
                    continue
                if k in ["wiatr", "wiatr_sr"]:
                    name = ms_st.get("nazwa")
                    if not is_valid_wind_reading(name, v_now) or not is_valid_wind_reading(name, v_past):
                        continue

                delta_total = round(v_now - v_past, 1)
                rate = round(delta_total / dt_actual_hours, 1)
                ms = ms_st[k]
                ms[trend_key] = rate
                ms[f"meta_{trend_key}"] = {
                    "v_now": v_now, "v_past": v_past,
                    "cz_past": past_dt.strftime("%H:%M"),
                    "cz_now": ms.get("czas_now", latest_time.strftime("%H:%M")),
                    "dt_h": round(dt_actual_hours, 1), "delta_total": delta_total
                }

def format_trend_hover(nazwa, z_info, ms, trend_key):
    rate = ms.get(trend_key)
    meta = ms.get(f"meta_{trend_key}", {})
    sgn = "+" if rate > 0 else ""
    fmt_val = f"{sgn}{rate:.1f}"
    unit_h = f"{z_info['unit']}/h"
    d_tot = meta.get("delta_total", 0.0)
    d_tot_sgn = "+" if d_tot > 0 else ""
    dt_h = meta.get("dt_h", 0)
    v_past = meta.get("v_past", "--")
    cz_past = meta.get("cz_past", "--:--")
    v_now = meta.get("v_now", "--")
    cz_now = meta.get("cz_now", "--:--")

    hover = (
        f"<b>{nazwa}</b><br>Trend {z_info['nazwa']}: <b>{fmt_val} {unit_h}</b><br>"
        f"Zmiana w {dt_h}h: {d_tot_sgn}{d_tot} {z_info['unit']} (z {v_past} o {cz_past} do {v_now} o {cz_now})"
    )
    return fmt_val, hover

def format_synop_point(st, okres, nazwa):
    v_t = st["temp"].get(okres)
    v_r = st["rosy"].get(okres)
    v_ws = st["wiatr_sr"].get(okres)
    v_wp = st["wiatr"].get(okres)
    kier = st["kierunek"].get(okres)
    strz = kier_na_strzalke(kier)

    txt_t = f"{v_t:.1f}" if v_t is not None else ""
    txt_ws = f"{v_ws:.0f} {strz}" if v_ws is not None else ""
    txt_r = f"{v_r:.1f}" if v_r is not None else ""
    txt_wp = f"{v_wp:.0f}" if v_wp is not None else ""

    cz_t = st["temp"].get(f"czas_{okres}", st.get("czas_now", "--:--"))
    txt = f"{txt_t}|{txt_ws}|{txt_r}|{txt_wp}"
    hov = f"<b>{nazwa}</b><br>Temp: {txt_t}°C | Rosy: {txt_r}°C<br>Wiatr Śr: {txt_ws} (Poryw: {txt_wp})<br>Czas: {cz_t}"
    return txt, hov

def format_standard_point(st, ms, z_key, okres, val, z_info, nazwa):
    if okres in ["max5", "min5"]:
        cz_extr = ms.get(f"czas_{okres}", "--:--")
        lbl = "Maksimum" if okres == "max5" else "Minimum"
        fmt = f"{val:.1f}" if (z_key not in ["wiatr", "wiatr_sr"] or val < 10) else f"{val:.0f}"
        hov = f"<b>{nazwa}</b><br>{lbl} (ost. 5h): <b>{fmt} {z_info['unit']}</b><br>Czas wystąpienia: {cz_extr}"
        return fmt, hov

    fmt = f"{val:.1f}" if (z_key not in ["wiatr", "wiatr_sr"] or val < 10) else f"{val:.0f}"
    cz_now = ms.get("czas_now", st.get("czas_now", "--:--"))
    dir_str = f" {kier_na_strzalke(st['kierunek'].get(okres))}" if z_key in ["wiatr", "wiatr_sr"] else ""
    hov = f"<b>{nazwa}</b><br>{z_info['nazwa']}: {fmt} {z_info['unit']}{dir_str}<br>Czas: {cz_now}"
    return fmt, hov

def build_spatial_period_data(master_stations, z_key, okres, z_info):
    lats_ok, lons_ok, vals_ok, hovs_ok, txts_ok = [], [], [], [], []
    for st in master_stations.values():
        lat, lon, nazwa = st["lat"], st["lon"], st["nazwa"]
        ms = st[z_key] if z_key != "synop" else st["temp"]
        val = ms.get(okres)

        if val is None and z_key != "synop":
            continue

        lats_ok.append(lat)
        lons_ok.append(lon)
        vals_ok.append(val)

        if okres.startswith("trend"):
            fmt, hov = format_trend_hover(nazwa, z_info, ms, okres)
        elif z_key == "synop":
            fmt, hov = format_synop_point(st, okres, nazwa)
        else:
            fmt, hov = format_standard_point(st, ms, z_key, okres, val, z_info, nazwa)

        txts_ok.append(fmt)
        hovs_ok.append(hov)

    return {
        "pt_lats": [round(x, 4) for x in lats_ok],
        "pt_lons": [round(x, 4) for x in lons_ok],
        "pt_vals": [round(x, 1) if x is not None else None for x in vals_ok],
        "pt_hov": hovs_ok,
        "pt_txts": txts_ok
    }

def clean_nans(obj):
    if isinstance(obj, float):
        return None if (math.isnan(obj) or math.isinf(obj)) else obj
    if isinstance(obj, dict):
        return {k: clean_nans(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean_nans(i) for i in obj]
    return obj

def upload_spatial_data(auth_param, payload_base, js_data):
    print(f"  Wysyłanie metadanych do bazy {FIREBASE_URL}/imgw_map_data.json")
    resp_meta = requests.patch(f"{FIREBASE_URL}/imgw_map_data.json{auth_param}", json=payload_base)
    resp_meta.raise_for_status()

    total_chunks = sum(len(periods) for periods in js_data.values())
    chunk_i = 0
    for z_key, z_dict in js_data.items():
        for okres, okres_data in z_dict.items():
            chunk_i += 1
            payload_str = json.dumps(okres_data)
            sys.stdout.write(f"\r  Wysyłanie [{chunk_i}/{total_chunks}] {z_key}/{okres} ({len(payload_str)} B)...      ")
            sys.stdout.flush()
            resp = requests.put(f"{FIREBASE_URL}/imgw_map_data/MAP_DATA/{z_key}/{okres}.json{auth_param}", json=okres_data)
            resp.raise_for_status()
    print("\n  [OK] Dane przestrzenne zaktualizowane w Firebase.")

def generate_dashboard():
    secret = os.environ.get("FIREBASE_SECRET", "")
    auth_param = f"?auth={secret}" if secret else ""

    resp = requests.get(f"{FIREBASE_URL}/imgw_historia.json{auth_param}", timeout=30)
    if resp.status_code != 200 or not resp.json():
        print("  [!] Brak historii w Firebase.")
        return
    historia = resp.json()
    if not isinstance(historia, list) or not historia:
        return

    latest_snap = historia[-1]
    latest_time_str = latest_snap["czas_pobrania"]
    try:
        latest_time = datetime.strptime(latest_time_str, "%Y-%m-%d %H:%M:%S")
    except (ValueError, TypeError):
        latest_time = datetime.now()

    master_stations = {
        st["kod"]: {
            "nazwa": st["nazwa"], "lat": st["lat"], "lon": st["lon"],
            "temp": {}, "grunt": {}, "wiatr": {}, "wilg": {}, "rosy": {}, "wiatr_sr": {}, "kierunek": {},
            "czas_now": "--:--"
        }
        for st in latest_snap.get("stacje", [])
    }

    for snap in historia:
        try:
            snap_time = datetime.strptime(snap["czas_pobrania"], "%Y-%m-%d %H:%M:%S")
            diff_h = (latest_time - snap_time).total_seconds() / 3600.0
            process_station_snapshot(snap, master_stations, diff_h <= 0.1, diff_h <= 5.1, snap_time)
        except (ValueError, KeyError):
            continue

    calculate_snapshot_trends(historia, latest_time, master_stations)

    js_data = {
        z_key: {okres: build_spatial_period_data(master_stations, z_key, okres, z_info) for okres in OKRESY}
        for z_key, z_info in ZMIENNE.items()
    }

    payload_base = clean_nans({
        "ZMIENNE": ZMIENNE,
        "COLORS": {
            "TEMP_COLORSCALE": TEMP_COLORSCALE, "WIND_COLORSCALE": WIND_COLORSCALE,
            "HUMIDITY_COLORSCALE": HUMIDITY_COLORSCALE, "DEWPOINT_COLORSCALE": DEWPOINT_COLORSCALE,
            "TREND_TEMP_COLORSCALE": TREND_TEMP_COLORSCALE, "TREND_HUMIDITY_COLORSCALE": TREND_HUMIDITY_COLORSCALE
        },
        "LATEST_TIME": latest_time_str,
        "SNAPSHOT_COUNT": len(historia)
    })

    upload_spatial_data(auth_param, payload_base, clean_nans(js_data))

if __name__ == "__main__":
    generate_dashboard()
