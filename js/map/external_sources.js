// js/map/external_sources.js
// Obsługa zewnętrznych źródeł danych: stacje zagraniczne ASOS oraz model numeryczny DWD ICON

import { PL_ICON_FILL_COORDS, FOREIGN_STATIONS } from './coords.js';

let foreignAsosCache = null;
let foreignAsosCacheTime = 0;
let iconModelCache = null;
let iconModelCacheTime = 0;

export function getMinDistKm(lat, lon, stationLats, stationLons) {
    if (!stationLats?.length) return 99999;
    let minDist = 99999;
    const cosLat = Math.cos(lat * Math.PI / 180);
    for (let i = 0; i < stationLats.length; i++) {
        const dLat = (lat - stationLats[i]) * 111.0;
        const dLon = (lon - stationLons[i]) * 111.0 * cosLat;
        const d = Math.sqrt(dLat * dLat + dLon * dLon);
        if (d < minDist) {
            minDist = d;
            if (d < 18) return d;
        }
    }
    return minDist;
}

export async function fetchForeignASOSData() {
    const now = Date.now();
    if (foreignAsosCache && (now - foreignAsosCacheTime < 120000)) return foreignAsosCache;

    const networks = ['CZ__ASOS', 'SK__ASOS', 'DE__ASOS', 'LT__ASOS', 'UA__ASOS', 'BY__ASOS'];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
        const fetchPromises = networks.map(net =>
            fetch(`https://mesonet.agron.iastate.edu/api/1/currents.json?network=${net}`, { signal: controller.signal })
                .then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] }))
        );
        const results = await Promise.all(fetchPromises);
        clearTimeout(timeoutId);

        const stations = [];
        for (const res of results) {
            if (!Array.isArray(res?.data)) continue;
            for (const d of res.data) {
                const lat = parseFloat(d.lat);
                const lon = parseFloat(d.lon);
                const sid = d.station || '';
                if (!isNaN(lat) && !isNaN(lon) && lat >= 48.0 && lat <= 56.5 && lon >= 11.5 && lon <= 26.5 && !sid.startsWith('EP')) {
                    stations.push(d);
                }
            }
        }
        foreignAsosCache = stations;
        foreignAsosCacheTime = now;
        return stations;
    } catch (_) {
        clearTimeout(timeoutId);
        return foreignAsosCache || [];
    }
}

export async function fetchIconModelData() {
    const now = Date.now();
    if (iconModelCache && (now - iconModelCacheTime < 180000)) return iconModelCache;

    try {
        const plLats = PL_ICON_FILL_COORDS.map(s => s.lat.toFixed(2)).join(',');
        const plLons = PL_ICON_FILL_COORDS.map(s => s.lon.toFixed(2)).join(',');
        const plUrl = `https://api.open-meteo.com/v1/forecast?latitude=${plLats}&longitude=${plLons}&current=temperature_2m,relative_humidity_2m,dew_point_2m,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,snow_depth,snowfall,soil_temperature_6cm&models=icon_seamless`;

        const fLats = FOREIGN_STATIONS.map(s => s.lat.toFixed(2)).join(',');
        const fLons = FOREIGN_STATIONS.map(s => s.lon.toFixed(2)).join(',');
        const fUrl = `https://api.open-meteo.com/v1/forecast?latitude=${fLats}&longitude=${fLons}&current=temperature_2m,relative_humidity_2m,dew_point_2m,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,snow_depth,snowfall,soil_temperature_6cm&models=icon_seamless`;

        const [resPL, resForeign] = await Promise.all([
            fetch(plUrl).then(r => r.ok ? r.json() : []).catch(() => []),
            fetch(fUrl).then(r => r.ok ? r.json() : []).catch(() => [])
        ]);

        const combined = {
            pl: Array.isArray(resPL) ? resPL : (resPL ? [resPL] : []),
            foreign: Array.isArray(resForeign) ? resForeign : (resForeign ? [resForeign] : [])
        };
        iconModelCache = combined;
        iconModelCacheTime = now;
        return combined;
    } catch (_) {
        return iconModelCache || { pl: [], foreign: [] };
    }
}

export function parseASOSData(asosData, dataObj, realCoords) {
    if (!Array.isArray(asosData) || !asosData.length) return;
    for (const st of asosData) {
        const lat = parseFloat(st.lat);
        const lon = parseFloat(st.lon);
        if (isNaN(lat) || isNaN(lon)) continue;

        const cc = (st.network || '').slice(0, 2);
        const sName = `${st.name || st.station} [${cc}]`;
        const timeStr = st.local_valid ? st.local_valid.slice(11, 16) : (st.valid ? st.valid.slice(11, 16) : '');
        const timeLabel = timeStr ? ` <span style="font-size:0.75rem; color:#a1a1aa;">(${timeStr})</span>` : '';

        const temp = st.tmpf != null ? Math.round(((st.tmpf - 32) * 5 / 9) * 10) / 10 : NaN;
        const dp = st.dwpf != null ? Math.round(((st.dwpf - 32) * 5 / 9) * 10) / 10 : NaN;
        const rh = st.relh != null ? Math.round(st.relh) : NaN;
        const pMsl = st.alti != null ? Math.round(st.alti * 33.8639 * 10) / 10 : NaN;
        const wSpd = st.sknt != null ? Math.round(st.sknt * 1.852) : NaN;
        const wGust = st.gust != null ? Math.round(st.gust * 1.852) : (!isNaN(wSpd) ? wSpd : NaN);
        const wDir = st.drct != null ? st.drct : null;
        const lcl = (!isNaN(temp) && !isNaN(dp)) ? Math.round(125 * Math.max(0, temp - dp)) : NaN;

        const addPt = (z, val, txt, hov, dir) => {
            if (isNaN(val) || val === null) return;
            dataObj[z].pt_lats.push(lat);
            dataObj[z].pt_lons.push(lon);
            dataObj[z].pt_vals.push(val);
            dataObj[z].pt_dirs.push(dir ?? null);
            dataObj[z].pt_txts.push(txt);
            dataObj[z].pt_hov.push(`<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;"><b style="font-size:0.85rem;">${sName}</b><span style="font-size:0.65rem; color:#10b981; border:1px solid rgba(16,185,129,0.3); border-radius:3px; padding:1px 4px;">ASOS</span></div>${hov}`);
            dataObj[z].pt_foreign.push(true);
            dataObj[z].pt_types.push('ODCZYT');
            dataObj[z].pt_meta.push({ id: st.station || '', nazwa: sName, zrodlo: 'ASOS', czas: st.valid || '' });
            realCoords[z].lats.push(lat);
            realCoords[z].lons.push(lon);
        };

        if (!isNaN(temp)) addPt('temp', temp, temp.toFixed(1) + '°', `T2m: <b>${temp.toFixed(1)}°C</b>${timeLabel}`);
        if (!isNaN(pMsl)) addPt('cisnienie', pMsl, pMsl.toFixed(1), `QFF: <b>${pMsl.toFixed(1)} hPa</b>${timeLabel}`);
        if (!isNaN(rh)) addPt('wilg', rh, rh.toFixed(0) + '%', `RH: <b>${rh.toFixed(0)}%</b>${timeLabel}`);
        if (!isNaN(dp)) addPt('rosy', dp, dp.toFixed(1) + '°', `Td: <b>${dp.toFixed(1)}°C</b>${timeLabel}`);
        if (!isNaN(lcl)) addPt('lcl', lcl, lcl + 'm', `LCL: <b>${lcl} m n.p.g.</b>${timeLabel}`);
        if (!isNaN(wGust)) addPt('wiatr', wGust, wGust.toFixed(0), `Maks. Wiatr: <b>${wGust.toFixed(0)} km/h</b>${timeLabel}`, wDir);
        if (!isNaN(wSpd)) addPt('wiatr_sr', wSpd, wSpd.toFixed(0), `Śr. Wiatr: <b>${wSpd.toFixed(0)} km/h</b>${timeLabel}`, wDir);
    }
}

export function parseModelData(modelData, dataObj, realCoords, isHybrid) {
    if (!modelData) return;
    const processList = (list, isForeign) => {
        if (!Array.isArray(list)) return;
        for (const item of list) {
            const cur = item.current;
            if (!cur) continue;
            const lat = item.latitude;
            const lon = item.longitude;
            const sName = isForeign ? `Prognoza ICON [${lat.toFixed(1)}, ${lon.toFixed(1)}]` : `ICON [${lat.toFixed(1)}, ${lon.toFixed(1)}]`;

            const temp = cur.temperature_2m;
            const dp = cur.dew_point_2m;
            const rh = cur.relative_humidity_2m;
            const pMsl = cur.pressure_msl;
            const wSpd = cur.wind_speed_10m;
            const wGust = cur.wind_gusts_10m;
            const wDir = cur.wind_direction_10m;
            const tSoil = cur.soil_temperature_6cm;
            const lcl = (temp != null && dp != null) ? Math.round(125 * Math.max(0, temp - dp)) : NaN;
            const timeStr = cur.time ? cur.time.slice(11, 16) : '';
            const timeLabel = timeStr ? ` <span style="font-size:0.75rem; color:#a1a1aa;">(${timeStr})</span>` : '';

            const addPt = (z, val, txt, hov, dir) => {
                if (val == null || isNaN(val)) return;
                if (isHybrid && realCoords[z].lats.length > 0) {
                    const d = getMinDistKm(lat, lon, realCoords[z].lats, realCoords[z].lons);
                    if (d < 22.0) return;
                }
                dataObj[z].pt_lats.push(lat);
                dataObj[z].pt_lons.push(lon);
                dataObj[z].pt_vals.push(val);
                dataObj[z].pt_dirs.push(dir ?? null);
                dataObj[z].pt_txts.push(txt);
                dataObj[z].pt_hov.push(`<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;"><b style="font-size:0.85rem;">${sName}</b><span style="font-size:0.65rem; color:#60a5fa; border:1px solid rgba(96,165,250,0.3); border-radius:3px; padding:1px 4px;">ICON</span></div>${hov}`);
                dataObj[z].pt_foreign.push(isForeign);
                dataObj[z].pt_types.push('PROGNOZA');
                dataObj[z].pt_meta.push({ id: '', nazwa: sName, zrodlo: 'ICON', czas: cur.time || '' });
            };

            if (temp != null) addPt('temp', temp, temp.toFixed(1) + '°', `T2m: <b>${temp.toFixed(1)}°C</b>${timeLabel}`);
            if (pMsl != null) addPt('cisnienie', pMsl, pMsl.toFixed(1), `QFF: <b>${pMsl.toFixed(1)} hPa</b>${timeLabel}`);
            if (rh != null) addPt('wilg', rh, Math.round(rh) + '%', `RH: <b>${Math.round(rh)}%</b>${timeLabel}`);
            if (dp != null) addPt('rosy', dp, dp.toFixed(1) + '°', `Td: <b>${dp.toFixed(1)}°C</b>${timeLabel}`);
            if (!isNaN(lcl)) addPt('lcl', lcl, lcl + 'm', `LCL: <b>${lcl} m n.p.g.</b>${timeLabel}`);
            if (wGust != null) addPt('wiatr', wGust, Math.round(wGust).toString(), `Maks. Wiatr: <b>${Math.round(wGust)} km/h</b>${timeLabel}`, wDir);
            if (wSpd != null) addPt('wiatr_sr', wSpd, Math.round(wSpd).toString(), `Śr. Wiatr: <b>${Math.round(wSpd)} km/h</b>${timeLabel}`, wDir);
            if (tSoil != null) addPt('grunt', tSoil, tSoil.toFixed(1) + '°', `T grunt (6cm): <b>${tSoil.toFixed(1)}°C</b>${timeLabel}`);
        }
    };
    processList(modelData.pl, false);
    processList(modelData.foreign, true);
}
