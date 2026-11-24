// js/map/stations.js
// Pobieranie i parsowanie danych telemetrycznych IMGW, R.R. 10m, ASOS oraz modelu DWD ICON z kontrola jakosci (QC)

import { SYNOP_STATIONS_COORDS } from './coords.js';
import { DEFAULT_ZMIENNE } from './interpolation.js';
import { fetchForeignASOSData, fetchIconModelData, parseASOSData, parseModelData } from './external_sources.js';
import { COMPASS_TO_DEG, calculateDewPoint, toIsoUtc, fmtPlTime, fmtTime } from './time.js';
import { isValueInPhysicalRange, isGroundTempConsistent, filterSpatialOutliers } from './qc.js';

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

function parseFreshTimeMs(time, now) {
    const tIso = toIsoUtc(time);
    const tMs = tIso ? Date.parse(tIso) : NaN;
    if (isNaN(tMs) || !inRange(now - tMs, -900000, 9000000)) return null;
    return { tIso, tMs };
}

function pushStationPoint(ctx, z, pt, metric) {
    const { val, txt, hov, dir, time } = metric;
    if (!isValueInPhysicalRange(z, val, pt.nazwa)) return;
    const ts = parseFreshTimeMs(time, ctx.now);
    if (!ts) return;
    if (ts.tMs > ctx.dataObj[z].latestTimeMs) ctx.dataObj[z].latestTimeMs = ts.tMs;

    const d = ctx.dataObj[z];
    d.pt_lats.push(pt.lat); d.pt_lons.push(pt.lon); d.pt_vals.push(val); d.pt_dirs.push(dir ?? null);
    d.pt_txts.push(txt); d.pt_hov.push(`<b>${pt.nazwa}</b><br>${hov}${fmtTime(time)}`);
    d.pt_foreign.push(false); d.pt_types.push('ODCZYT');
    d.pt_meta.push({ id: pt.kod, nazwa: pt.nazwa, zrodlo: pt.zrodlo, czas: ts.tIso });
    ctx.realCoords[z].lats.push(pt.lat); ctx.realCoords[z].lons.push(pt.lon);
}

function parseSynopPoints(synopData, ctx) {
    if (!Array.isArray(synopData)) return;
    window._stationMetaMap = window._stationMetaMap || {};
    synopData.forEach(st => {
        const pVal = parseFloat(st.cisnienie), coord = SYNOP_STATIONS_COORDS[st.id_stacji];
        if (!pVal || !coord) return;
        const sName = coord.name || st.stacja, kod = String(st.id_stacji);
        const sIso = toIsoUtc(`${st.data_pomiaru} ${String(st.godzina_pomiaru).padStart(2, '0')}:00:00`);
        window._stationMetaMap[kod] = { lat: coord.lat, lon: coord.lon, nazwa: sName };
        pushStationPoint(ctx, 'cisnienie', { lat: coord.lat, lon: coord.lon, nazwa: sName, kod, zrodlo: 'SYNOP' }, { val: pVal, txt: pVal.toFixed(1), hov: `QFF: <b>${pVal.toFixed(1)} hPa</b>`, time: sIso });
    });
}

function extractTelemetryMetrics(st, isRR) {
    const temp = parseFloat(isRR ? st.temp : st.temperatura_powietrza);
    const wilg = parseFloat(isRR ? st.wilgBezw : st.wilgotnosc_wzgledna);
    const dp = (isValueInPhysicalRange('temp', temp) && isValueInPhysicalRange('wilg', wilg)) ? calculateDewPoint(temp, wilg) : null;
    const lcl = (dp !== null) ? Math.round(125 * Math.max(0, temp - dp)) : NaN;
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
        wDate: isRR ? (st.windLastTime || st.strTime || st.tempLastTime) : st.wiatr_srednia_predkosc_data,
        gDate: isRR ? (st.tempGruntTime || st.strTime) : st.temperatura_gruntu_data,
        wPorDate: isRR ? (st.windLastTime || st.strTime || st.tempLastTime) : (st.wiatr_poryw_10min_data ?? st.wiatr_predkosc_maksymalna_data)
    };
}

function parseTelemetryStation(st, isRR, ctx) {
    if (st.isModel) return;
    const lat = parseFloat(st.lat), lon = parseFloat(isRR ? (st.lng ?? st.lon) : st.lon);
    if (isNaN(lat) || isNaN(lon)) return;
    const nazwa = isRR ? (st.statName || 'Stacja IMGW') : st.nazwa_stacji;
    const kod = String(isRR ? st.statId : (st.kod_stacji || st.id_stacji || ''));
    if (kod) { window._stationMetaMap = window._stationMetaMap || {}; window._stationMetaMap[kod] = { lat, lon, nazwa }; }

    const m = extractTelemetryMetrics(st, isRR);
    const pt = { lat, lon, nazwa, kod, zrodlo: isRR ? 'RR' : 'IMGW' };
    const tTs = parseFreshTimeMs(m.tDate, ctx.now);
    const gTs = parseFreshTimeMs(m.gDate, ctx.now);
    const gruntValid = gTs && isGroundTempConsistent(m.tGrunt, m.temp, gTs.tMs, tTs?.tMs);

    const metrics = [
        { z: 'temp', val: m.temp, txt: m.temp.toFixed(1), hov: `T2m: <b>${m.temp.toFixed(1)}°C</b>`, time: m.tDate },
        { z: 'wilg', val: m.wilg, txt: m.wilg.toFixed(1), hov: `RH: <b>${m.wilg.toFixed(1)}%</b>`, time: m.rhDate },
        { z: 'rosy', val: m.dp, txt: m.dp?.toFixed(1), hov: `Td: <b>${m.dp?.toFixed(1)}°C</b>`, time: m.tDate },
        { z: 'lcl', val: m.lcl, txt: `${m.lcl}`, hov: `LCL: <b>${m.lcl} m n.p.g.</b>`, time: m.tDate },
        { z: 'wiatr_sr', val: m.wSrVal, txt: m.wSrVal.toFixed(1), hov: `Śr. Wiatr: <b>${m.wSrVal.toFixed(1)} km/h</b>`, dir: m.dir, time: m.wDate },
        { z: 'wiatr', val: m.wPorVal, txt: m.wPorVal.toFixed(1), hov: `Maks. Wiatr: <b>${m.wPorVal.toFixed(1)} km/h</b>`, dir: m.dir, time: m.wPorDate }
    ];
    if (gruntValid) {
        metrics.push({ z: 'grunt', val: m.tGrunt, txt: m.tGrunt.toFixed(1), hov: `T grunt: <b>${m.tGrunt.toFixed(1)}°C</b>`, time: m.gDate });
    }

    for (const item of metrics) pushStationPoint(ctx, item.z, pt, item);
}

function replaceSnowData(snowData, dataObj) {
    if (!snowData) return;
    ['snieg', 'snieg_swiezy'].forEach(sp => {
        const src = snowData[sp];
        if (!src?.pt_lats?.length) return;
        dataObj[sp] = {
            pt_lats: [...src.pt_lats], pt_lons: [...src.pt_lons], pt_vals: [...src.pt_vals],
            pt_dirs: src.pt_lats.map(() => null), pt_txts: [...src.pt_txts], pt_hov: [...src.pt_hov],
            pt_foreign: src.pt_lats.map(() => false), pt_types: src.pt_lats.map(() => 'ODCZYT'),
            pt_meta: src.pt_meta ? [...src.pt_meta] : src.pt_lats.map(() => ({ id: '', nazwa: '', zrodlo: 'SNIEG', czas: '' })),
            latestTimeMs: src.latestTimeMs || 0
        };
    });
}

function isSnowDateStale(latestTimeMs) {
    if (!latestTimeMs) return true;
    const fmt = ms => new Date(ms).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw', day: '2-digit', month: '2-digit', year: 'numeric' });
    return fmt(latestTimeMs) !== fmt(Date.now());
}

async function ensureSnowFresh(cached, now, loadingEl) {
    const sp = cached.data?.snieg;
    if (sp?.pt_lats?.length && (!isSnowDateStale(sp.latestTimeMs) || (now - (cached.snowTime || 0) < 120000))) return;
    if (loadingEl) { loadingEl.style.display = 'flex'; loadingEl.innerHTML = '<i data-lucide="loader" class="spin"></i> Pobieranie pokrywy śnieżnej IMGW...'; }
    try {
        const snowData = window.getSnowData ? await window.getSnowData().catch(() => null) : null;
        replaceSnowData(snowData, cached.data);
        cached.snowTime = now;
    } finally {
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

export function clearLiveStationsCache() {
    Object.keys(imgwLiveCacheByMode).forEach(k => delete imgwLiveCacheByMode[k]);
}

export async function getIMGWLiveData(targetParam = null) {
    const isRR = Boolean(window.firebaseUser) && (document.getElementById('provider-rr')?.checked ?? false);
    const dataMode = document.getElementById('chk-source-model')?.checked ? 'hybrid' : 'stations';
    const cacheKey = `${dataMode}_${isRR ? 'rr' : 'imgw'}`, now = Date.now();
    const needSnow = targetParam === null || targetParam === 'snieg' || targetParam === 'snieg_swiezy';
    const cached = imgwLiveCacheByMode[cacheKey], loadingEl = document.getElementById('imgw-loading');

    if (cached && (now - cached.time < 60000)) {
        if (needSnow) await ensureSnowFresh(cached, now, loadingEl);
        return cached.data;
    }
    if (loadingEl) { loadingEl.style.display = 'flex'; loadingEl.innerHTML = '<i data-lucide="loader" class="spin"></i> Pobieranie danych meteorologicznych...'; }

    try {
        // Zrodla: IMGW-PIB (danepubliczne.imgw.pl), Rafal Raczynski 10m (rafalraczynski.com.pl), IEM ASOS, Open-Meteo ICON
        const reqRR = isRR ? fetch('https://rafalraczynski.com.pl/imgw/maps-2/getJSON.php?type=maps').then(r => r.ok ? r.json() : []).catch(() => []) : Promise.resolve([]);
        const reqMeteo = !isRR ? fetch('https://danepubliczne.imgw.pl/api/data/meteo/').then(r => r.ok ? r.json() : []).catch(() => []) : Promise.resolve([]);
        const reqSynop = fetch('https://danepubliczne.imgw.pl/api/data/synop').then(r => r.ok ? r.json() : []).catch(() => []);
        const reqSnow = (needSnow && window.getSnowData) ? window.getSnowData().catch(() => null) : Promise.resolve(null);
        const [rawData, rrData, synopData, asosData, snowData, modelData] = await Promise.all([
            reqMeteo, reqRR, reqSynop, fetchForeignASOSData(), reqSnow,
            (dataMode === 'hybrid') ? fetchIconModelData() : Promise.resolve({ pl: [], foreign: [] })
        ]);

        const { dataObj, realCoords } = initDataBuffers(), ctx = { dataObj, realCoords, now };
        parseSynopPoints(synopData, ctx);
        const parseList = isRR ? rrData : rawData;
        if (Array.isArray(parseList)) parseList.forEach(st => parseTelemetryStation(st, isRR, ctx));
        parseASOSData(asosData, dataObj, realCoords);
        ['temp', 'grunt', 'rosy', 'cisnienie'].forEach(p => filterSpatialOutliers(dataObj[p], p));
        parseModelData(modelData, dataObj, realCoords, dataMode === 'hybrid');
        replaceSnowData(snowData, dataObj);

        imgwLiveCacheByMode[cacheKey] = { data: dataObj, time: now, snowTime: needSnow ? now : 0 };
        if (loadingEl) loadingEl.style.display = 'none';
        return dataObj;
    } catch (err) {
        console.error('Błąd pobierania stacji:', err);
        if (loadingEl) loadingEl.innerHTML = 'Błąd pobierania danych.';
        return null;
    }
}

// Rejestracja publicznego API dla export.js i history.js
window.BMapaApi = { getLiveData: getIMGWLiveData, clearLiveCache: clearLiveStationsCache, calculateDewPoint, DEFAULT_ZMIENNE, fmtPlTime, toIsoUtc, fmtTime };
window.getMapExportData = async (param = null) => await getIMGWLiveData(param);
