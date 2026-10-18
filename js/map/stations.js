// js/map/stations.js
// Pobieranie i parsowanie danych telemetrycznych IMGW, R.R. 10m, ASOS oraz modelu DWD ICON

import { SYNOP_STATIONS_COORDS } from './coords.js';
import { DEFAULT_ZMIENNE } from './interpolation.js';
import { getMinDistKm, fetchForeignASOSData, fetchIconModelData } from './external_sources.js';

const COMPASS_TO_DEG = {
    'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5, 'E': 90, 'ESE': 112.5,
    'SE': 135, 'SSE': 157.5, 'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
    'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
};

const imgwLiveCacheByMode = {};

export function calculateDewPoint(temp_c, rh_pct) {
    if (temp_c == null || rh_pct == null || rh_pct <= 0) return null;
    const a = 17.27, b = 237.7;
    const alpha = (a * temp_c) / (b + temp_c) + Math.log(rh_pct / 100.0);
    return (b * alpha) / (a - alpha);
}

export function toIsoUtc(input) {
    if (input === null || input === undefined || input === '') return '';
    let ms = NaN;
    if (typeof input === 'number') {
        ms = input;
    } else {
        const s = String(input).trim();
        const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s);
        ms = Date.parse(hasZone ? s : s.replace(' ', 'T') + 'Z');
    }
    return (isNaN(ms) || ms <= 0) ? '' : new Date(ms).toISOString().replace('.000Z', 'Z');
}

export async function getIMGWLiveData(targetParam = null) {
    const chkModel = document.getElementById('chk-source-model');
    const providerRR = document.getElementById('provider-rr');
    const isRR = providerRR?.checked ?? false;
    const dataMode = chkModel?.checked ? 'hybrid' : 'stations';
    const cacheKey = `${dataMode}_${isRR ? 'rr' : 'imgw'}`;
    const now = Date.now();

    const cached = imgwLiveCacheByMode[cacheKey];
    const isSnowParam = targetParam === 'snieg' || targetParam === 'snieg_swiezy';
    const snowMissing = isSnowParam && cached?.data && (!cached.data[targetParam] || !cached.data[targetParam].pt_lats.length);

    if (cached && (now - cached.time < 60000) && !snowMissing) {
        return cached.data;
    }

    const loadingEl = document.getElementById('imgw-loading');
    if (loadingEl) {
        loadingEl.style.display = 'flex';
        loadingEl.innerHTML = '<i data-lucide="loader" class="spin"></i> Pobieranie danych meteorologicznych...';
    }

    try {
        const reqRR = isRR ? fetch('https://rafalraczynski.com.pl/imgw/maps-2/getJSON.php?type=maps').then(r => r.ok ? r.json() : []).catch(() => []) : Promise.resolve([]);
        const reqMeteo = !isRR ? fetch('https://danepubliczne.imgw.pl/api/data/meteo/').then(r => r.ok ? r.json() : []).catch(() => []) : Promise.resolve([]);
        const reqSynop = fetch('https://danepubliczne.imgw.pl/api/data/synop').then(r => r.ok ? r.json() : []).catch(() => []);
        const reqAsos = fetchForeignASOSData();
        const reqSnow = window.getSnowData ? window.getSnowData().catch(() => null) : Promise.resolve(null);
        const reqModel = (dataMode === 'hybrid') ? fetchIconModelData() : Promise.resolve({ pl: [], foreign: [] });

        const [rawData, rrData, synopData, asosData, snowData, modelData] = await Promise.all([
            reqMeteo, reqRR, reqSynop, reqAsos, reqSnow, reqModel
        ]);

        const dataObj = {};
        const realCoords = {};
        const params = ['temp', 'cisnienie', 'wiatr', 'wiatr_sr', 'rosy', 'lcl', 'wilg', 'grunt', 'snieg', 'snieg_swiezy'];
        params.forEach(p => {
            dataObj[p] = { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [], pt_meta: [], latestTimeMs: 0 };
            realCoords[p] = { lats: [], lons: [] };
        });

        // 1. SYNOP IMGW (Ciśnienie)
        if (Array.isArray(synopData)) {
            synopData.forEach(st => {
                const pVal = parseFloat(st.cisnienie);
                const coord = SYNOP_STATIONS_COORDS[st.id_stacji];
                if (isNaN(pVal) || !pVal || !coord) return;
                const sName = coord.name || st.stacja;
                window._stationMetaMap = window._stationMetaMap || {};
                window._stationMetaMap[String(st.id_stacji)] = { lat: coord.lat, lon: coord.lon, nazwa: sName };

                dataObj['cisnienie'].pt_lats.push(coord.lat);
                dataObj['cisnienie'].pt_lons.push(coord.lon);
                dataObj['cisnienie'].pt_vals.push(pVal);
                dataObj['cisnienie'].pt_dirs.push(null);
                dataObj['cisnienie'].pt_txts.push(pVal.toFixed(1));
                dataObj['cisnienie'].pt_hov.push(`<b>${sName}</b><br>QFF: <b>${pVal.toFixed(1)} hPa</b>`);
                dataObj['cisnienie'].pt_foreign.push(false);
                dataObj['cisnienie'].pt_types.push('ODCZYT');
                dataObj['cisnienie'].pt_meta.push({ id: String(st.id_stacji), nazwa: sName, zrodlo: 'SYNOP', czas: toIsoUtc(`${st.data_pomiaru} ${String(st.godzina_pomiaru).padStart(2, '0')}:00:00`) });
                realCoords['cisnienie'].lats.push(coord.lat);
                realCoords['cisnienie'].lons.push(coord.lon);
            });
        }

        // 2. STACJE POLSKA (R.R. lub IMGW Meteo)
        const parseList = isRR ? rrData : rawData;
        if (Array.isArray(parseList)) {
            parseList.forEach(st => {
                if (st.isModel) return;
                const lat = parseFloat(st.lat);
                const lon = parseFloat(isRR ? (st.lng ?? st.lon) : st.lon);
                if (isNaN(lat) || isNaN(lon)) return;
                const nazwa = isRR ? (st.statName || 'Stacja IMGW') : st.nazwa_stacji;
                const kod = String(isRR ? st.statId : (st.kod_stacji || st.id_stacji || ''));
                if (kod) {
                    window._stationMetaMap = window._stationMetaMap || {};
                    window._stationMetaMap[kod] = { lat, lon, nazwa };
                }

                const temp = parseFloat(isRR ? st.temp : st.temperatura_powietrza);
                const wilg = parseFloat(isRR ? st.wilgBezw : st.wilgotnosc_wzgledna);
                const dp = calculateDewPoint(temp, wilg);
                const lcl = (!isNaN(temp) && dp !== null) ? Math.round(125 * Math.max(0, temp - dp)) : NaN;
                const wSr = parseFloat(isRR ? st.predWiatru : st.wiatr_srednia_predkosc);
                const wPor = parseFloat(isRR ? (st.predWiatruMax10min ?? st.predWiatru) : (st.wiatr_poryw_10min ?? st.wiatr_predkosc_maksymalna));
                const dirStr = isRR ? st.kierWiatru : st.wiatr_kierunek;
                const dir = typeof dirStr === 'string' ? COMPASS_TO_DEG[dirStr.trim().toUpperCase()] : parseFloat(dirStr);

                const add = (z, v, txt, hov, dVal) => {
                    if (isNaN(v) || v === null) return;
                    dataObj[z].pt_lats.push(lat);
                    dataObj[z].pt_lons.push(lon);
                    dataObj[z].pt_vals.push(v);
                    dataObj[z].pt_dirs.push(dVal ?? null);
                    dataObj[z].pt_txts.push(txt);
                    dataObj[z].pt_hov.push(`<b>${nazwa}</b><br>${hov}`);
                    dataObj[z].pt_foreign.push(false);
                    dataObj[z].pt_types.push('ODCZYT');
                    dataObj[z].pt_meta.push({ id: kod, nazwa, zrodlo: isRR ? 'RR' : 'IMGW', czas: toIsoUtc(isRR ? st.tempLastTime : st.temperatura_powietrza_data) });
                    realCoords[z].lats.push(lat);
                    realCoords[z].lons.push(lon);
                };

                if (!isNaN(temp)) add('temp', temp, temp.toFixed(1) + '°', `T2m: <b>${temp.toFixed(1)}°C</b>`);
                if (!isNaN(wilg)) add('wilg', wilg, wilg.toFixed(0) + '%', `RH: <b>${wilg.toFixed(0)}%</b>`);
                if (dp !== null && !isNaN(dp)) add('rosy', dp, dp.toFixed(1) + '°', `Td: <b>${dp.toFixed(1)}°C</b>`);
                if (!isNaN(lcl)) add('lcl', lcl, lcl + 'm', `LCL: <b>${lcl} m n.p.g.</b>`);
                if (!isNaN(wSr)) add('wiatr_sr', isRR ? wSr : wSr * 3.6, Math.round(isRR ? wSr : wSr * 3.6).toString(), `Śr. Wiatr: <b>${Math.round(isRR ? wSr : wSr * 3.6)} km/h</b>`, dir);
                if (!isNaN(wPor)) add('wiatr', isRR ? wPor : wPor * 3.6, Math.round(isRR ? wPor : wPor * 3.6).toString(), `Maks. Wiatr: <b>${Math.round(isRR ? wPor : wPor * 3.6)} km/h</b>`, dir);
            });
        }

        // 3. ŚNIEG IMGW
        if (snowData) {
            ['snieg', 'snieg_swiezy'].forEach(sp => {
                if (snowData[sp]?.pt_lats) {
                    snowData[sp].pt_lats.forEach((sLat, idx) => {
                        dataObj[sp].pt_lats.push(sLat);
                        dataObj[sp].pt_lons.push(snowData[sp].pt_lons[idx]);
                        dataObj[sp].pt_vals.push(snowData[sp].pt_vals[idx]);
                        dataObj[sp].pt_dirs.push(null);
                        dataObj[sp].pt_txts.push(snowData[sp].pt_txts[idx]);
                        dataObj[sp].pt_hov.push(snowData[sp].pt_hov[idx]);
                        dataObj[sp].pt_foreign.push(false);
                        dataObj[sp].pt_types.push('ODCZYT');
                        dataObj[sp].pt_meta.push(snowData[sp].pt_meta?.[idx] || { id: '', nazwa: '', zrodlo: 'SNIEG', czas: '' });
                    });
                }
            });
        }

        imgwLiveCacheByMode[cacheKey] = { data: dataObj, time: now };
        if (loadingEl) loadingEl.style.display = 'none';
        return dataObj;
    } catch (err) {
        console.error("Błąd pobierania stacji:", err);
        if (loadingEl) loadingEl.innerHTML = "Błąd pobierania danych.";
        return null;
    }
}

// Rejestracja publicznego API dla export.js i history.js
window.BMapaApi = {
    getLiveData: getIMGWLiveData,
    calculateDewPoint,
    DEFAULT_ZMIENNE
};
window.getMapExportData = async (param = null) => await getIMGWLiveData(param);
