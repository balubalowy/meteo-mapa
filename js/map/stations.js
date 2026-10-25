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

const inRange = (v, min, max) => v >= min && v <= max;

function pushStationPoint(ctx, z, pt, metric) {
    const { val, txt, hov, dir, time } = metric;
    if (val == null || isNaN(val)) return;
    const tIso = toIsoUtc(time);
    const tMs = tIso ? Date.parse(tIso) : NaN;
    if (isNaN(tMs) || !inRange(ctx.now - tMs, -900000, 9000000)) return;
    if (tMs > ctx.dataObj[z].latestTimeMs) ctx.dataObj[z].latestTimeMs = tMs;

    ctx.dataObj[z].pt_lats.push(pt.lat);
    ctx.dataObj[z].pt_lons.push(pt.lon);
    ctx.dataObj[z].pt_vals.push(val);
    ctx.dataObj[z].pt_dirs.push(dir ?? null);
    ctx.dataObj[z].pt_txts.push(txt);
    ctx.dataObj[z].pt_hov.push(`<b>${pt.nazwa}</b><br>${hov}${fmtTime(time)}`);
    ctx.dataObj[z].pt_foreign.push(false);
    ctx.dataObj[z].pt_types.push('ODCZYT');
    ctx.dataObj[z].pt_meta.push({ id: pt.kod, nazwa: pt.nazwa, zrodlo: pt.zrodlo, czas: tIso });
    ctx.realCoords[z].lats.push(pt.lat);
    ctx.realCoords[z].lons.push(pt.lon);
}

function parseSynopPoints(synopData, ctx) {
    if (!Array.isArray(synopData)) return;
    synopData.forEach(st => {
        const pVal = parseFloat(st.cisnienie);
        const coord = SYNOP_STATIONS_COORDS[st.id_stacji];
        if (!pVal || !coord) return;
        const sName = coord.name || st.stacja;
        const timeStr = `${String(st.godzina_pomiaru).padStart(2, '0')}:00`;
        const sIso = toIsoUtc(`${st.data_pomiaru} ${timeStr}:00`);

        window._stationMetaMap = window._stationMetaMap || {};
        window._stationMetaMap[String(st.id_stacji)] = { lat: coord.lat, lon: coord.lon, nazwa: sName };

        const pt = { lat: coord.lat, lon: coord.lon, nazwa: sName, kod: String(st.id_stacji), zrodlo: 'SYNOP' };
        pushStationPoint(ctx, 'cisnienie', pt, { val: pVal, txt: pVal.toFixed(1), hov: `QFF: <b>${pVal.toFixed(1)} hPa</b>`, time: sIso });
    });
}

function extractTelemetryMetrics(st, isRR) {
    const temp = parseFloat(isRR ? st.temp : st.temperatura_powietrza);
    const wilg = parseFloat(isRR ? st.wilgBezw : st.wilgotnosc_wzgledna);
    const dp = calculateDewPoint(temp, wilg);
    const lcl = (!isNaN(temp) && dp !== null) ? Math.round(125 * Math.max(0, temp - dp)) : NaN;
    const wSr = parseFloat(isRR ? st.predWiatru : st.wiatr_srednia_predkosc);
    const wPor = parseFloat(isRR ? (st.predWiatruMax10min ?? st.predWiatru) : (st.wiatr_poryw_10min ?? st.wiatr_predkosc_maksymalna));
    const dirStr = isRR ? st.kierWiatru : st.wiatr_kierunek;
    const trimmedDir = typeof dirStr === 'string' ? dirStr.trim().toUpperCase() : '';
    const dir = COMPASS_TO_DEG[trimmedDir] ?? (dirStr !== '' && !isNaN(dirStr) ? parseFloat(dirStr) : NaN);
    const tGrunt = parseFloat(isRR ? (st.tempGrunt ?? st.temperatura_gruntu) : st.temperatura_gruntu);
    const wSrVal = !isNaN(wSr) ? (isRR ? wSr : wSr * 3.6) : NaN;
    const wPorVal = !isNaN(wPor) ? (isRR ? wPor : wPor * 3.6) : NaN;

    return {
        temp, wilg, dp, lcl, tGrunt, dir, wSrVal, wPorVal,
        tDate: isRR ? st.tempLastTime : st.temperatura_powietrza_data,
        rhDate: isRR ? st.tempLastTime : st.wilgotnosc_wzgledna_data,
        wDate: isRR ? st.windLastTime : st.wiatr_srednia_predkosc_data,
        gDate: isRR ? st.tempGruntTime : st.temperatura_gruntu_data,
        wPorDate: isRR ? st.windLastTime : (st.wiatr_poryw_10min_data ?? st.wiatr_predkosc_maksymalna_data)
    };
}

function parseTelemetryStation(st, isRR, ctx) {
    if (st.isModel) return;
    const lat = parseFloat(st.lat), lon = parseFloat(isRR ? (st.lng ?? st.lon) : st.lon);
    if (isNaN(lat) || isNaN(lon)) return;
    const nazwa = isRR ? (st.statName || 'Stacja IMGW') : st.nazwa_stacji;
    const kod = String(isRR ? st.statId : (st.kod_stacji || st.id_stacji || ''));
    if (kod) {
        window._stationMetaMap = window._stationMetaMap || {};
        window._stationMetaMap[kod] = { lat, lon, nazwa };
    }

    const m = extractTelemetryMetrics(st, isRR);
    const pt = { lat, lon, nazwa, kod, zrodlo: isRR ? 'RR' : 'IMGW' };

    const metrics = [
        { z: 'temp', val: m.temp, txt: `${m.temp.toFixed(1)}°`, hov: `T2m: <b>${m.temp.toFixed(1)}°C</b>`, time: m.tDate },
        { z: 'wilg', val: m.wilg, txt: `${m.wilg.toFixed(1)}%`, hov: `RH: <b>${m.wilg.toFixed(1)}%</b>`, time: m.rhDate },
        { z: 'rosy', val: m.dp, txt: `${m.dp?.toFixed(1)}°`, hov: `Td: <b>${m.dp?.toFixed(1)}°C</b>`, time: m.tDate },
        { z: 'lcl', val: m.lcl, txt: `${m.lcl}m`, hov: `LCL: <b>${m.lcl} m n.p.g.</b>`, time: m.tDate },
        { z: 'wiatr_sr', val: m.wSrVal, txt: m.wSrVal.toFixed(1), hov: `Śr. Wiatr: <b>${m.wSrVal.toFixed(1)} km/h</b>`, dir: m.dir, time: m.wDate },
        { z: 'wiatr', val: m.wPorVal, txt: m.wPorVal.toFixed(1), hov: `Maks. Wiatr: <b>${m.wPorVal.toFixed(1)} km/h</b>`, dir: m.dir, time: m.wPorDate },
        { z: 'grunt', val: m.tGrunt, txt: `${m.tGrunt.toFixed(1)}°`, hov: `T grunt: <b>${m.tGrunt.toFixed(1)}°C</b>`, time: m.gDate }
    ];

    for (const item of metrics) pushStationPoint(ctx, item.z, pt, item);
}

function appendSnowData(snowData, dataObj) {
    if (!snowData) return;
    ['snieg', 'snieg_swiezy'].forEach(sp => {
        if (snowData[sp]?.latestTimeMs) dataObj[sp].latestTimeMs = snowData[sp].latestTimeMs;
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

function isCacheFresh(cached, now, isSnow, targetParam) {
    if (!cached || (now - cached.time >= 60000)) return false;
    if (isSnow && (!cached.data?.[targetParam]?.pt_lats?.length)) return false;
    return true;
}

export async function getIMGWLiveData(targetParam = null) {
    const chkModel = document.getElementById('chk-source-model');
    const isRR = document.getElementById('provider-rr')?.checked ?? false;
    const dataMode = chkModel?.checked ? 'hybrid' : 'stations';
    const cacheKey = `${dataMode}_${isRR ? 'rr' : 'imgw'}`;
    const now = Date.now();

    const cached = imgwLiveCacheByMode[cacheKey];
    const isSnow = targetParam === 'snieg' || targetParam === 'snieg_swiezy';
    if (isCacheFresh(cached, now, isSnow, targetParam)) return cached.data;

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
        const ctx = { dataObj, realCoords, now };
        parseSynopPoints(synopData, ctx);
        const parseList = isRR ? rrData : rawData;
        if (Array.isArray(parseList)) {
            parseList.forEach(st => parseTelemetryStation(st, isRR, ctx));
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

