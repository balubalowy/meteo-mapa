// js/map/qc.js
// Kontrola jakosci (QC) danych telemetrycznych: zakres fizyczny, spojnosc T2m/Tgr oraz filtr sasiadow (buddy check)

const QC_BOUNDS = {
    temp: [-45, 45],
    grunt: [-48, 65],
    rosy: [-50, 35],
    wilg: [1, 100],
    lcl: [0, 6000],
    wiatr_sr: [0, 180],
    wiatr: [0, 230],
    cisnienie: [920, 1070],
    snieg: [0, 500],
    snieg_swiezy: [0, 250]
};

const SPATIAL_QC_CONFIG = {
    temp: { radiusKm: 120, maxDev: 18, maxSpread: 4.5 },
    grunt: { radiusKm: 120, maxDev: 20, maxSpread: 5.5 },
    rosy: { radiusKm: 120, maxDev: 18, maxSpread: 4.5 },
    cisnienie: { radiusKm: 160, maxDev: 12, maxSpread: 3.0 }
};

const MOUNTAIN_WIND_STATIONS = [
    'ŚNIEŻKA', 'SNIEZKA', 'SNĚŽKA', 'KASPROWY', 'ŁOMNICA', 'LOMNICKY', 'CHOPOK', 'BROCKEN', 'FICHTELBERG'
];

function isMountainWindStation(name) {
    const up = (name || '').toUpperCase();
    return MOUNTAIN_WIND_STATIONS.some(k => up.includes(k));
}

export function isValueInPhysicalRange(param, val, stationName = '') {
    if (val === null || val === undefined || !Number.isFinite(val)) return false;
    const bounds = QC_BOUNDS[param];
    if (!bounds) return true;
    if (val < bounds[0] || val > bounds[1]) return false;

    if ((param === 'wiatr_sr' || param === 'wiatr') && !isMountainWindStation(stationName)) {
        const cap = param === 'wiatr_sr' ? 130 : 150;
        if (val > cap) return false;
    }
    return true;
}

// Odrzuca skrajnie niespojna temperature gruntu tylko gdy pomiar T2m na tej samej stacji jest swiezy (roznica <= 1h)
export function isGroundTempConsistent(tGrunt, t2m, gMs, tMs) {
    if (!Number.isFinite(tGrunt)) return false;
    if (!Number.isFinite(t2m) || !isValueInPhysicalRange('temp', t2m)) return true;
    if (!Number.isFinite(gMs) || !Number.isFinite(tMs)) return true;
    if (Math.abs(gMs - tMs) > 3600000) return true;
    return tGrunt >= (t2m - 18) && tGrunt <= (t2m + 30);
}

function medianOf(sortedArr) {
    const mid = Math.floor(sortedArr.length / 2);
    return sortedArr.length % 2 ? sortedArr[mid] : (sortedArr[mid - 1] + sortedArr[mid]) * 0.5;
}

function computeNeighborStats(idx, lats, lons, vals, types, radiusKm) {
    const lat = lats[idx], lon = lons[idx];
    const cosLat = Math.cos(lat * Math.PI / 180);
    const nbrs = [];

    for (let j = 0; j < lats.length; j++) {
        if (j === idx || types?.[j] === 'PROGNOZA') continue;
        const dKm = Math.hypot((lat - lats[j]) * 111.13, (lon - lons[j]) * 111.32 * cosLat);
        if (dKm <= radiusKm) nbrs.push({ d: dKm, v: vals[j] });
    }
    if (nbrs.length < 4) return null;

    nbrs.sort((a, b) => a.d - b.d);
    const topVals = nbrs.slice(0, 6).map(x => x.v).sort((a, b) => a - b);
    const med = medianOf(topVals);
    const devs = topVals.map(v => Math.abs(v - med)).sort((a, b) => a - b);
    return { med, mad: medianOf(devs) };
}

function compactArrays(paramData, keepMask) {
    const arrayKeys = ['pt_lats', 'pt_lons', 'pt_vals', 'pt_dirs', 'pt_txts', 'pt_hov', 'pt_foreign', 'pt_types', 'pt_meta'];
    for (const key of arrayKeys) {
        if (Array.isArray(paramData[key])) {
            paramData[key] = paramData[key].filter((_, i) => keepMask[i]);
        }
    }
}

// Spatial buddy check: usuwa izolowane bledne odczyty (np. uszkodzony czujnik) odbiegajace od lokalnych sasiadow
export function filterSpatialOutliers(paramData, param) {
    const cfg = SPATIAL_QC_CONFIG[param];
    if (!cfg || !paramData?.pt_lats || paramData.pt_lats.length < 6) return 0;

    const { pt_lats: lats, pt_lons: lons, pt_vals: vals, pt_types: types } = paramData;
    const keepMask = new Array(lats.length).fill(true);
    let rejected = 0;

    for (let i = 0; i < lats.length; i++) {
        if (types?.[i] === 'PROGNOZA') continue;
        const stats = computeNeighborStats(i, lats, lons, vals, types, cfg.radiusKm);
        if (stats && stats.mad <= cfg.maxSpread && Math.abs(vals[i] - stats.med) > cfg.maxDev) {
            keepMask[i] = false;
            rejected++;
        }
    }

    if (rejected > 0) compactArrays(paramData, keepMask);
    return rejected;
}

if (typeof window !== 'undefined') {
    window.BMapaQC = { isValueInPhysicalRange, isGroundTempConsistent, filterSpatialOutliers };
}
