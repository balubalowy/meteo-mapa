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
