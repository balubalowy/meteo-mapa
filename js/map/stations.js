// js/map/stations.js
// Pobieranie i parsowanie danych telemetrycznych IMGW, R.R. 10m, ASOS oraz modelu DWD ICON

import { SYNOP_STATIONS_COORDS } from './coords.js';
import { DEFAULT_ZMIENNE } from './interpolation.js';
import { fetchForeignASOSData, fetchIconModelData, parseASOSData, parseModelData } from './external_sources.js';
import { COMPASS_TO_DEG, calculateDewPoint, toIsoUtc, fmtPlTime, fmtTime } from './time.js';

export { COMPASS_TO_DEG, calculateDewPoint, toIsoUtc, fmtPlTime, fmtTime };

const imgwLiveCacheByMode = {};

function initDataBuffers() {
    const dataObj = {}, realCoords = {};
    const params = ['temp', 'cisnienie', 'wiatr', 'wiatr_sr', 'rosy', 'lcl', 'wilg', 'grunt', 'snieg', 'snieg_swiezy'];
    params.forEach(p => {
        dataObj[p] = { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [], pt_meta: [], latestTimeMs: 0 };
        realCoords[p] = { lats: [], lons: [] };
    });
    return { dataObj, realCoords };
}

function pushStationPoint(dataObj, realCoords, z, pt, val, txt, hov, dir, timeRaw, now) {
    if (val == null || isNaN(val)) return;
    const tIso = toIsoUtc(timeRaw);
    const tMs = tIso ? Date.parse(tIso) : NaN;
    if (isNaN(tMs) || (now - tMs) > 9000000 || (now - tMs) < -900000) return;
    if (tMs > dataObj[z].latestTimeMs) dataObj[z].latestTimeMs = tMs;

    dataObj[z].pt_lats.push(pt.lat);
    dataObj[z].pt_lons.push(pt.lon);
    dataObj[z].pt_vals.push(val);
    dataObj[z].pt_dirs.push(dir ?? null);
    dataObj[z].pt_txts.push(txt);
    dataObj[z].pt_hov.push(`<b>${pt.nazwa}</b><br>${hov}${fmtTime(timeRaw)}`);
    dataObj[z].pt_foreign.push(false);
    dataObj[z].pt_types.push('ODCZYT');
    dataObj[z].pt_meta.push({ id: pt.kod, nazwa: pt.nazwa, zrodlo: pt.zrodlo, czas: tIso });
    realCoords[z].lats.push(pt.lat);
    realCoords[z].lons.push(pt.lon);
}

function parseSynopPoints(synopData, dataObj, realCoords, now) {
    if (!Array.isArray(synopData)) return;
    synopData.forEach(st => {
        const pVal = parseFloat(st.cisnienie);
        const coord = SYNOP_STATIONS_COORDS[st.id_stacji];
        if (isNaN(pVal) || !pVal || !coord) return;
        const sName = coord.name || st.stacja;
        const timeStr = `${String(st.godzina_pomiaru).padStart(2, '0')}:00`;
        const sIso = toIsoUtc(`${st.data_pomiaru} ${timeStr}:00`);

        window._stationMetaMap = window._stationMetaMap || {};
        window._stationMetaMap[String(st.id_stacji)] = { lat: coord.lat, lon: coord.lon, nazwa: sName };

        const pt = { lat: coord.lat, lon: coord.lon, nazwa: sName, kod: String(st.id_stacji), zrodlo: 'SYNOP' };
        pushStationPoint(dataObj, realCoords, 'cisnienie', pt, pVal, pVal.toFixed(1), `QFF: <b>${pVal.toFixed(1)} hPa</b>`, null, sIso, now);
    });
}

function parseTelemetryStation(st, isRR, dataObj, realCoords, now) {
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
    const tGrunt = parseFloat(isRR ? (st.tempGrunt ?? st.temperatura_gruntu) : st.temperatura_gruntu);

    const tDate = isRR ? st.tempLastTime : st.temperatura_powietrza_data;
    const rhDate = isRR ? st.tempLastTime : st.wilgotnosc_wzgledna_data;
    const wDate = isRR ? st.windLastTime : st.wiatr_srednia_predkosc_data;
    const gDate = isRR ? st.tempGruntTime : st.temperatura_gruntu_data;
    const wPorDate = isRR ? st.windLastTime : (st.wiatr_poryw_10min_data ?? st.wiatr_predkosc_maksymalna_data);

    const pt = { lat, lon, nazwa, kod, zrodlo: isRR ? 'RR' : 'IMGW' };
    const wSrVal = !isNaN(wSr) ? (isRR ? wSr : wSr * 3.6) : NaN;
    const wPorVal = !isNaN(wPor) ? (isRR ? wPor : wPor * 3.6) : NaN;

    pushStationPoint(dataObj, realCoords, 'temp', pt, temp, temp.toFixed(1) + '°', `T2m: <b>${temp.toFixed(1)}°C</b>`, null, tDate, now);
    pushStationPoint(dataObj, realCoords, 'wilg', pt, wilg, wilg.toFixed(0) + '%', `RH: <b>${wilg.toFixed(0)}%</b>`, null, rhDate, now);
    pushStationPoint(dataObj, realCoords, 'rosy', pt, dp, dp?.toFixed(1) + '°', `Td: <b>${dp?.toFixed(1)}°C</b>`, null, tDate, now);
    pushStationPoint(dataObj, realCoords, 'lcl', pt, lcl, lcl + 'm', `LCL: <b>${lcl} m n.p.g.</b>`, null, tDate, now);
    pushStationPoint(dataObj, realCoords, 'wiatr_sr', pt, wSrVal, Math.round(wSrVal).toString(), `Śr. Wiatr: <b>${Math.round(wSrVal)} km/h</b>`, dir, wDate, now);
    pushStationPoint(dataObj, realCoords, 'wiatr', pt, wPorVal, Math.round(wPorVal).toString(), `Maks. Wiatr: <b>${Math.round(wPorVal)} km/h</b>`, dir, wPorDate, now);
    pushStationPoint(dataObj, realCoords, 'grunt', pt, tGrunt, tGrunt.toFixed(1) + '°', `T grunt: <b>${tGrunt.toFixed(1)}°C</b>`, null, gDate, now);
}

function appendSnowData(snowData, dataObj) {
    if (!snowData) return;
    ['snieg', 'snieg_swiezy'].forEach(sp => {
        snowData[sp]?.pt_lats?.forEach((sLat, idx) => {
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
    });
}

export async function getIMGWLiveData(targetParam = null) {
    const chkModel = document.getElementById('chk-source-model');
    const isRR = document.getElementById('provider-rr')?.checked ?? false;
    const dataMode = chkModel?.checked ? 'hybrid' : 'stations';
    const cacheKey = `${dataMode}_${isRR ? 'rr' : 'imgw'}`;
    const now = Date.now();

    const cached = imgwLiveCacheByMode[cacheKey];
    const isSnow = targetParam === 'snieg' || targetParam === 'snieg_swiezy';
    const snowMiss = isSnow && cached?.data && (!cached.data[targetParam] || !cached.data[targetParam].pt_lats.length);

    if (cached && (now - cached.time < 60000) && !snowMiss) return cached.data;

    const loadingEl = document.getElementById('imgw-loading');
    if (loadingEl) {
        loadingEl.style.display = 'flex';
        loadingEl.innerHTML = '<i data-lucide="loader" class="spin"></i> Pobieranie danych meteorologicznych...';
    }

    try {
        const reqRR = isRR ? fetch('https://rafalraczynski.com.pl/imgw/maps-2/getJSON.php?type=maps').then(r => r.ok ? r.json() : []).catch(() => []) : Promise.resolve([]);
        const reqMeteo = !isRR ? fetch('https://danepubliczne.imgw.pl/api/data/meteo/').then(r => r.ok ? r.json() : []).catch(() => []) : Promise.resolve([]);
        const reqSynop = fetch('https://danepubliczne.imgw.pl/api/data/synop').then(r => r.ok ? r.json() : []).catch(() => []);
        const [rawData, rrData, synopData, asosData, snowData, modelData] = await Promise.all([
            reqMeteo, reqRR, reqSynop, fetchForeignASOSData(),
            window.getSnowData ? window.getSnowData().catch(() => null) : Promise.resolve(null),
            (dataMode === 'hybrid') ? fetchIconModelData() : Promise.resolve({ pl: [], foreign: [] })
        ]);

        const { dataObj, realCoords } = initDataBuffers();
        parseSynopPoints(synopData, dataObj, realCoords, now);
        const parseList = isRR ? rrData : rawData;
        if (Array.isArray(parseList)) {
            parseList.forEach(st => parseTelemetryStation(st, isRR, dataObj, realCoords, now));
        }
        parseASOSData(asosData, dataObj, realCoords);
        parseModelData(modelData, dataObj, realCoords, dataMode === 'hybrid');
        appendSnowData(snowData, dataObj);

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
window.BMapaApi = { getLiveData: getIMGWLiveData, calculateDewPoint, DEFAULT_ZMIENNE, fmtPlTime, toIsoUtc, fmtTime };
window.getMapExportData = async (param = null) => await getIMGWLiveData(param);

