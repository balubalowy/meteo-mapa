// js/map/interpolation.js
// Numeryczna interpolacja IDW (Inverse Distance Weighting), skale barwne i wektorowanie

import { POLAND_POLY_COORDS } from './coords_border.js';
import { drawIsolines } from './marching_squares.js';

function _calcWndNorm(kmh, mx = 259) { return +(kmh / mx).toFixed(4); }

export const COLORSCALES = {
    temp: [
        [0.0, '#f4c2f4'], [0.055, '#e020e0'], [0.111, '#8a2be2'], [0.166, '#4b0082'],
        [0.222, '#000080'], [0.277, '#0000ff'], [0.333, '#1e90ff'], [0.388, '#00bfff'],
        [0.444, '#00ffff'], [0.5, '#00fa9a'], [0.555, '#32cd32'], [0.611, '#adff2f'],
        [0.666, '#ffd700'], [0.722, '#ffa500'], [0.777, '#ff4500'], [0.833, '#ff0000'],
        [0.888, '#8b0000'], [0.944, '#5c4033'], [1.0, '#808080']
    ],
    wind: [
        [0.0, '#FFFFFF'], [_calcWndNorm(9), '#C8FFFF'], [_calcWndNorm(19), '#00FFFF'], [_calcWndNorm(28), '#0088FF'],
        [_calcWndNorm(37), '#0000CD'], [_calcWndNorm(46), '#00C800'], [_calcWndNorm(56), '#80FF00'],
        [_calcWndNorm(65), '#FFFF00'], [_calcWndNorm(74), '#FFD700'], [_calcWndNorm(83), '#FFA500'],
        [_calcWndNorm(93), '#FF4500'], [_calcWndNorm(102), '#FF0000'], [_calcWndNorm(111), '#CC0000'],
        [_calcWndNorm(120), '#800000'], [_calcWndNorm(130), '#800080'], [_calcWndNorm(139), '#4B0082'],
        [_calcWndNorm(148), '#FF00FF'], [_calcWndNorm(157), '#FF69B4'], [_calcWndNorm(167), '#808080'], [1.0, '#000000']
    ],
    humidity: [[0.0, '#FFD700'], [0.25, '#FF8C00'], [0.5, '#32CD32'], [0.75, '#1E90FF'], [1.0, '#00008B']],
    dewpoint: [[0.0, '#0000FF'], [0.26, '#00BFFF'], [0.39, '#00FF7F'], [0.53, '#ADFF2F'], [0.66, '#FFD700'], [0.79, '#FF4500'], [0.92, '#FF0000'], [1.0, '#8B0000']],
    pressure: [[0.0, '#3b0764'], [0.17, '#991b1b'], [0.33, '#ea580c'], [0.47, '#eab308'], [0.55, '#22c55e'], [0.67, '#06b6d4'], [0.80, '#2563eb'], [0.92, '#1e1b4b'], [1.0, '#4338ca']],
    lcl: [[0.0, '#312e81'], [0.15, '#2563eb'], [0.30, '#06b6d4'], [0.45, '#10b981'], [0.60, '#eab308'], [0.75, '#f97316'], [0.90, '#ef4444'], [1.0, '#831843']],
    snow: [[0.0, '#fdf2f8'], [0.08, '#fbcfe8'], [0.20, '#f472b6'], [0.35, '#ec4899'], [0.55, '#a855f7'], [0.75, '#7e22ce'], [0.90, '#581c87'], [1.0, '#2e0854']],
    trend_temp: [[0.0, '#1e3a8a'], [0.2, '#3b82f6'], [0.4, '#93c5fd'], [0.5, '#f3f4f6'], [0.6, '#fca5a5'], [0.8, '#ef4444'], [1.0, '#991b1b']],
    trend_humidity: [[0.0, '#854d0e'], [0.25, '#d97706'], [0.5, '#f3f4f6'], [0.75, '#0284c7'], [1.0, '#1e3a8a']]
};

export const DEFAULT_ZMIENNE = {
    'temp':         { nazwa: 'Temperatura', cscale: COLORSCALES.temp, cmin: -40, cmax: 50, unit: '°C', step: 2.0 },
    'grunt':        { nazwa: 'Temperatura Gruntu', cscale: COLORSCALES.temp, cmin: -40, cmax: 50, unit: '°C', step: 2.0 },
    'rosy':         { nazwa: 'Punkt Rosy', cscale: COLORSCALES.dewpoint, cmin: -10, cmax: 28, unit: '°C', step: 2.0 },
    'wilg':         { nazwa: 'Wilgotność', cscale: COLORSCALES.humidity, cmin: 0, cmax: 100, unit: '%', step: 10.0 },
    'lcl':          { nazwa: 'LCL', cscale: COLORSCALES.lcl, cmin: 0, cmax: 3000, unit: 'm', step: 250.0 },
    'wiatr_sr':     { nazwa: 'Prędkość Wiatru', cscale: COLORSCALES.wind, cmin: 0, cmax: 259, unit: 'km/h', step: 10.0 },
    'wiatr':        { nazwa: 'Porywy Wiatru', cscale: COLORSCALES.wind, cmin: 0, cmax: 259, unit: 'km/h', step: 10.0 },
    'cisnienie':    { nazwa: 'Ciśnienie QFF', cscale: COLORSCALES.pressure, cmin: 980, cmax: 1040, unit: 'hPa', step: 2.0 },
    'snieg':        { nazwa: 'Pokrywa Śnieżna', cscale: COLORSCALES.snow, cmin: 0, cmax: 100, unit: 'cm', step: 5.0 },
    'snieg_swiezy': { nazwa: 'Świeży Śnieg', cscale: COLORSCALES.snow, cmin: 0, cmax: 50, unit: 'cm', step: 2.0 }
};

function hexToRgb(hex) {
    const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return res ? [parseInt(res[1], 16), parseInt(res[2], 16), parseInt(res[3], 16)] : [0, 0, 0];
}

const _scaleRgbCache = new WeakMap();
function getParsedScale(scale) {
    let parsed = _scaleRgbCache.get(scale);
    if (!parsed) {
        parsed = scale.map(s => [s[0], hexToRgb(s[1])]);
        _scaleRgbCache.set(scale, parsed);
    }
    return parsed;
}

export function getColorRGBA(val, scale, cmin, cmax, alpha = 160) {
    if (val === null || isNaN(val)) return [0, 0, 0, 0];
    const parsed = getParsedScale(scale);
    const norm = Math.max(0, Math.min(1, (val - cmin) / (cmax - cmin)));
    for (let i = 0; i < parsed.length - 1; i++) {
        if (norm >= parsed[i][0] && norm <= parsed[i + 1][0]) {
            const span = parsed[i + 1][0] - parsed[i][0];
            const t = span > 0 ? (norm - parsed[i][0]) / span : 0;
            const c1 = parsed[i][1], c2 = parsed[i + 1][1];
            return [
                Math.round(c1[0] + t * (c2[0] - c1[0])),
                Math.round(c1[1] + t * (c2[1] - c1[1])),
                Math.round(c1[2] + t * (c2[2] - c1[2])),
                alpha
            ];
        }
    }
    const c = parsed[parsed.length - 1][1];
    return [c[0], c[1], c[2], alpha];
}

export function latToMercY(lat) {
    const rad = lat * Math.PI / 180.0;
    return Math.log(Math.tan(Math.PI / 4.0 + rad / 2.0));
}

// Oblicza wezly siatki IDW z metryka kilometrowa (brak znieksztalcen osi X/Y) i wykladnikiem p=3.5
function computeIdwRaster(pts, gw, gh, kx, ky, scale, cmin, cmax) {
    const valGrid = new Float32Array(gw * gh);
    const heatCanvas = document.createElement('canvas');
    heatCanvas.width = gw; heatCanvas.height = gh;
    const heatCtx = heatCanvas.getContext('2d');
    const heatImg = heatCtx.createImageData(gw, gh);
    const pScale = getParsedScale(scale), pLen = pts.length, invSpan = 1.0 / (cmax - cmin);

    for (let y = 0; y < gh; y++) {
        const rowOff = y * gw;
        for (let x = 0; x < gw; x++) {
            let num = 0, den = 0;
            for (let i = 0; i < pLen; i++) {
                const dxKm = (x - pts[i].x) * kx, dyKm = (y - pts[i].y) * ky;
                const d2 = dxKm * dxKm + dyKm * dyKm + 0.04;
                const w = 1.0 / (d2 * Math.sqrt(d2));
                num += w * pts[i].v; den += w;
            }
            const val = num / den, idx = rowOff + x;
            valGrid[idx] = val;

            const norm = Math.max(0, Math.min(1, (val - cmin) * invSpan));
            let r = pScale[0][1][0], g = pScale[0][1][1], b = pScale[0][1][2];
            for (let s = 0; s < pScale.length - 1; s++) {
                if (norm >= pScale[s][0] && norm <= pScale[s + 1][0]) {
                    const span = pScale[s + 1][0] - pScale[s][0];
                    const t = span > 0 ? (norm - pScale[s][0]) / span : 0;
                    r = Math.round(pScale[s][1][0] + t * (pScale[s + 1][1][0] - pScale[s][1][0]));
                    g = Math.round(pScale[s][1][1] + t * (pScale[s + 1][1][1] - pScale[s][1][1]));
                    b = Math.round(pScale[s][1][2] + t * (pScale[s + 1][1][2] - pScale[s][1][2]));
                    break;
                }
            }
            const pIdx = idx * 4;
            heatImg.data[pIdx] = r; heatImg.data[pIdx + 1] = g;
            heatImg.data[pIdx + 2] = b; heatImg.data[pIdx + 3] = 160;
        }
    }
    heatCtx.putImageData(heatImg, 0, 0);
    return { valGrid, heatCanvas };
}

// Przycina plotno do pelnego wektora granic Rzeczypospolitej Polskiej
function clipRasterToPoland(offCanvas, w, h, minLon, maxLon, minMercY, maxMercY) {
    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = w; mainCanvas.height = h;
    const mainCtx = mainCanvas.getContext('2d');
    mainCtx.beginPath();
    POLAND_POLY_COORDS.forEach(([pLon, pLat], i) => {
        const px = ((pLon - minLon) / (maxLon - minLon)) * w;
        const py = (1 - (latToMercY(pLat) - minMercY) / (maxMercY - minMercY)) * h;
        if (i === 0) mainCtx.moveTo(px, py); else mainCtx.lineTo(px, py);
    });
    mainCtx.closePath();
    mainCtx.clip();
    mainCtx.drawImage(offCanvas, 0, 0);
    return mainCanvas.toDataURL();
}

export function generateIDWImage(lats, lons, vals, scale, cmin, cmax, drawIso, stepVal, unit, bounds, clipToPoland) {
    const minLat = bounds?.minLat ?? 48.5, maxLat = bounds?.maxLat ?? 55.5;
    const minLon = bounds?.minLon ?? 13.5, maxLon = bounds?.maxLon ?? 24.5;
    const minMercY = latToMercY(minLat), maxMercY = latToMercY(maxLat);
    const gw = bounds ? 280 : 240, gh = bounds ? 190 : 170, w = 1200, h = 900;

    const midLatRad = ((minLat + maxLat) * 0.5) * (Math.PI / 180.0);
    const kx = ((maxLon - minLon) * 111.32 * Math.cos(midLatRad)) / gw;
    const ky = ((maxLat - minLat) * 111.13) / gh;

    const pts = lats.map((lat, i) => ({
        x: ((lons[i] - minLon) / (maxLon - minLon)) * gw,
        y: (1 - (latToMercY(lat) - minMercY) / (maxMercY - minMercY)) * gh,
        v: vals[i]
    }));

    const { valGrid, heatCanvas } = computeIdwRaster(pts, gw, gh, kx, ky, scale, cmin, cmax);
    const offCanvas = document.createElement('canvas');
    offCanvas.width = w; offCanvas.height = h;
    const offCtx = offCanvas.getContext('2d');
    offCtx.imageSmoothingQuality = 'high';
    offCtx.drawImage(heatCanvas, 0, 0, w, h);

    if (drawIso) drawIsolines(offCtx, valGrid, { gw, gh, w, h }, { cmin, cmax, stepVal, unit });
    if (!clipToPoland) return offCanvas.toDataURL();
    return clipRasterToPoland(offCanvas, w, h, minLon, maxLon, minMercY, maxMercY);
}
