// js/map/external_sources.js
// Obsługa zewnętrznych źródeł danych: stacje zagraniczne ASOS oraz model numeryczny DWD ICON

import { PL_ICON_FILL_COORDS, FOREIGN_STATIONS } from './coords.js';
import { fmtPlTime } from './stations.js';

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

function appendPoint(ctx, z, pt, metric) {
    const { val, txt, hov, dir } = metric;
    if (val == null || isNaN(val)) return;
    const { dataObj, realCoords } = ctx;
    dataObj[z].pt_lats.push(pt.lat);
    dataObj[z].pt_lons.push(pt.lon);
    dataObj[z].pt_vals.push(val);
    dataObj[z].pt_dirs.push(dir ?? null);
    dataObj[z].pt_txts.push(txt);
    dataObj[z].pt_hov.push(`<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;"><b style="font-size:0.85rem;">${pt.name}</b><span style="font-size:0.65rem; color:${pt.badgeColor}; border:1px solid ${pt.badgeBorder}; border-radius:3px; padding:1px 4px;">${pt.source}</span></div>${hov}`);
    dataObj[z].pt_foreign.push(pt.isForeign);
    dataObj[z].pt_types.push(pt.type);
    dataObj[z].pt_meta.push({ id: pt.id || '', nazwa: pt.name, zrodlo: pt.source, czas: pt.time || '' });
    if (realCoords && realCoords[z]) {
        realCoords[z].lats.push(pt.lat);
        realCoords[z].lons.push(pt.lon);
    }
}

function addAsosStationPoints(st, ctx, now) {
    const lat = parseFloat(st.lat), lon = parseFloat(st.lon);
    if (isNaN(lat) || isNaN(lon)) return;
    const vStr = st.valid ? String(st.valid).trim() : '';
    const vMs = vStr ? Date.parse(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(vStr) ? vStr : vStr.replace(' ', 'T') + 'Z') : NaN;
    if (!isNaN(vMs) && ((now - vMs) > 9000000 || (now - vMs) < -900000)) return;

    const cc = (st.network || '').slice(0, 2);
    const sName = `${st.name || st.station} [${cc}]`;
    const timeStr = fmtPlTime(st.valid);
    const timeLabel = timeStr ? ` <span style="font-size:0.75rem; color:#a1a1aa;">(${timeStr})</span>` : '';

    const temp = st.tmpf != null ? Math.round(((st.tmpf - 32) * 5 / 9) * 10) / 10 : NaN;
    const dp = st.dwpf != null ? Math.round(((st.dwpf - 32) * 5 / 9) * 10) / 10 : NaN;
    const rh = st.relh != null ? Math.round(st.relh) : NaN;
    const pMsl = st.alti != null ? Math.round(st.alti * 33.8639 * 10) / 10 : NaN;
    const wSpd = st.sknt != null ? Math.round(st.sknt * 1.852) : NaN;
    const wGust = st.gust != null ? Math.round(st.gust * 1.852) : (!isNaN(wSpd) ? wSpd : NaN);
    const wDir = st.drct != null ? st.drct : null;
    const lcl = (!isNaN(temp) && !isNaN(dp)) ? Math.round(125 * Math.max(0, temp - dp)) : NaN;

    const pt = { lat, lon, name: sName, source: 'ASOS', isForeign: true, type: 'ODCZYT', id: st.station || '', time: st.valid || '', badgeColor: '#10b981', badgeBorder: 'rgba(16,185,129,0.3)' };

    const metrics = [
        { z: 'temp', val: temp, txt: `${temp?.toFixed(1)}°`, hov: `T2m: <b>${temp?.toFixed(1)}°C</b>${timeLabel}` },
        { z: 'cisnienie', val: pMsl, txt: pMsl?.toFixed(1), hov: `QFF: <b>${pMsl?.toFixed(1)} hPa</b>${timeLabel}` },
        { z: 'wilg', val: rh, txt: `${rh?.toFixed(0)}%`, hov: `RH: <b>${rh?.toFixed(0)}%</b>${timeLabel}` },
        { z: 'rosy', val: dp, txt: `${dp?.toFixed(1)}°`, hov: `Td: <b>${dp?.toFixed(1)}°C</b>${timeLabel}` },
        { z: 'lcl', val: lcl, txt: `${lcl}m`, hov: `LCL: <b>${lcl} m n.p.g.</b>${timeLabel}` },
        { z: 'wiatr', val: wGust, txt: wGust?.toFixed(0), hov: `Maks. Wiatr: <b>${wGust?.toFixed(0)} km/h</b>${timeLabel}`, dir: wDir },
        { z: 'wiatr_sr', val: wSpd, txt: wSpd?.toFixed(0), hov: `Śr. Wiatr: <b>${wSpd?.toFixed(0)} km/h</b>${timeLabel}`, dir: wDir }
    ];

    for (const m of metrics) appendPoint(ctx, m.z, pt, m);
}

export function parseASOSData(asosData, dataObj, realCoords) {
    if (!Array.isArray(asosData) || !asosData.length) return;
    const now = Date.now();
    const ctx = { dataObj, realCoords };
    for (const st of asosData) addAsosStationPoints(st, ctx, now);
}

function addIconPoint(item, ctx, isHybrid, isForeign) {
    const cur = item.current;
    if (!cur) return;
    const lat = item.latitude, lon = item.longitude;
    const sName = isForeign ? `Prognoza ICON [${lat.toFixed(1)}, ${lon.toFixed(1)}]` : `ICON [${lat.toFixed(1)}, ${lon.toFixed(1)}]`;
    const temp = cur.temperature_2m, dp = cur.dew_point_2m, rh = cur.relative_humidity_2m;
    const pMsl = cur.pressure_msl, wSpd = cur.wind_speed_10m, wGust = cur.wind_gusts_10m, wDir = cur.wind_direction_10m;
    const tSoil = cur.soil_temperature_6cm;
    const lcl = (temp != null && dp != null) ? Math.round(125 * Math.max(0, temp - dp)) : NaN;
    const timeStr = fmtPlTime(cur.time);
    const timeLabel = timeStr ? ` <span style="font-size:0.75rem; color:#a1a1aa;">(${timeStr})</span>` : '';

    const pt = { lat, lon, name: sName, source: 'ICON', isForeign, type: 'PROGNOZA', id: '', time: cur.time || '', badgeColor: '#60a5fa', badgeBorder: 'rgba(96,165,250,0.3)' };
    const canAdd = z => !isHybrid || !ctx.realCoords?.[z]?.lats?.length || getMinDistKm(lat, lon, ctx.realCoords[z].lats, ctx.realCoords[z].lons) >= 22.0;

    const metrics = [
        { z: 'temp', val: temp, txt: `${temp?.toFixed(1)}°`, hov: `T2m: <b>${temp?.toFixed(1)}°C</b>${timeLabel}` },
        { z: 'cisnienie', val: pMsl, txt: pMsl?.toFixed(1), hov: `QFF: <b>${pMsl?.toFixed(1)} hPa</b>${timeLabel}` },
        { z: 'wilg', val: rh, txt: `${Math.round(rh || 0)}%`, hov: `RH: <b>${Math.round(rh || 0)}%</b>${timeLabel}` },
        { z: 'rosy', val: dp, txt: `${dp?.toFixed(1)}°`, hov: `Td: <b>${dp?.toFixed(1)}°C</b>${timeLabel}` },
        { z: 'lcl', val: isNaN(lcl) ? null : lcl, txt: `${lcl}m`, hov: `LCL: <b>${lcl} m n.p.g.</b>${timeLabel}` },
        { z: 'wiatr', val: wGust, txt: Math.round(wGust || 0).toString(), hov: `Maks. Wiatr: <b>${Math.round(wGust || 0)} km/h</b>${timeLabel}`, dir: wDir },
        { z: 'wiatr_sr', val: wSpd, txt: Math.round(wSpd || 0).toString(), hov: `Śr. Wiatr: <b>${Math.round(wSpd || 0)} km/h</b>${timeLabel}`, dir: wDir },
        { z: 'grunt', val: tSoil, txt: `${tSoil?.toFixed(1)}°`, hov: `T grunt (6cm): <b>${tSoil?.toFixed(1)}°C</b>${timeLabel}` }
    ];

    for (const m of metrics) {
        if (canAdd(m.z)) appendPoint(ctx, m.z, pt, m);
    }
}

export function parseModelData(modelData, dataObj, realCoords, isHybrid) {
    if (!modelData) return;
    const ctx = { dataObj, realCoords };
    if (Array.isArray(modelData.pl)) {
        for (const item of modelData.pl) addIconPoint(item, ctx, isHybrid, false);
    }
    if (Array.isArray(modelData.foreign)) {
        for (const item of modelData.foreign) addIconPoint(item, ctx, isHybrid, true);
    }
}

