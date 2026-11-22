// js/map/interpolation.js
// Numeryczna interpolacja IDW (Inverse Distance Weighting), skale barwne RGBA i przycinanie do granic RP

import { POLAND_POLY_RINGS } from './coords_border.js';
import { drawIsolines } from './marching_squares.js';

const DEFAULT_ALPHA = 170;

function _calcWndNorm(kmh, mx = 259) { return +(kmh / mx).toFixed(4); }

// Format stopu: [norm, '#RRGGBB'] lub [norm, '#RRGGBB', alpha 0..255]
// Wartosci zerowe/niskie dla sniegu, wiatru i trendow przechodza plynnie w przezroczystosc (alpha=0)
export const COLORSCALES = {
    temp: [
        [0.0, '#f4c2f4'], [0.055, '#e020e0'], [0.111, '#8a2be2'], [0.166, '#4b0082'],
        [0.222, '#000080'], [0.277, '#0000ff'], [0.333, '#1e90ff'], [0.388, '#00bfff'],
        [0.444, '#00ffff'], [0.5, '#00fa9a'], [0.555, '#32cd32'], [0.611, '#adff2f'],
        [0.666, '#ffd700'], [0.722, '#ffa500'], [0.777, '#ff4500'], [0.833, '#ff0000'],
        [0.888, '#8b0000'], [0.944, '#5c4033'], [1.0, '#808080']
    ],
    wind: [
        [0.0, '#7ceeff', 0], [_calcWndNorm(5), '#7ceeff', 0], [_calcWndNorm(12), '#5ce6ff', 95],
        [_calcWndNorm(19), '#00FFFF', 155], [_calcWndNorm(28), '#0088FF', 175],
        [_calcWndNorm(37), '#0000CD', 180], [_calcWndNorm(46), '#00C800', 180], [_calcWndNorm(56), '#80FF00', 180],
        [_calcWndNorm(65), '#FFFF00', 185], [_calcWndNorm(74), '#FFD700', 185], [_calcWndNorm(83), '#FFA500', 185],
        [_calcWndNorm(93), '#FF4500', 190], [_calcWndNorm(102), '#FF0000', 190], [_calcWndNorm(111), '#CC0000', 190],
        [_calcWndNorm(120), '#800000', 195], [_calcWndNorm(130), '#800080', 195], [_calcWndNorm(139), '#4B0082', 195],
        [_calcWndNorm(148), '#FF00FF', 200], [_calcWndNorm(157), '#FF69B4', 200], [_calcWndNorm(167), '#808080', 200], [1.0, '#000000', 205]
    ],
    humidity: [[0.0, '#FFD700'], [0.25, '#FF8C00'], [0.5, '#32CD32'], [0.75, '#1E90FF'], [1.0, '#00008B']],
    dewpoint: [[0.0, '#0000FF'], [0.26, '#00BFFF'], [0.39, '#00FF7F'], [0.53, '#ADFF2F'], [0.66, '#FFD700'], [0.79, '#FF4500'], [0.92, '#FF0000'], [1.0, '#8B0000']],
    pressure: [[0.0, '#3b0764'], [0.17, '#991b1b'], [0.33, '#ea580c'], [0.47, '#eab308'], [0.55, '#22c55e'], [0.67, '#06b6d4'], [0.80, '#2563eb'], [0.92, '#1e1b4b'], [1.0, '#4338ca']],
    lcl: [[0.0, '#312e81'], [0.15, '#2563eb'], [0.30, '#06b6d4'], [0.45, '#10b981'], [0.60, '#eab308'], [0.75, '#f97316'], [0.90, '#ef4444'], [1.0, '#831843']],
    snow: [
        [0.0, '#fbcfe8', 0], [0.005, '#fbcfe8', 0], [0.02, '#fbcfe8', 120], [0.08, '#f9a8d4', 165],
        [0.20, '#f472b6', 180], [0.35, '#ec4899', 185], [0.55, '#a855f7', 190],
        [0.75, '#7e22ce', 195], [0.90, '#581c87', 200], [1.0, '#2e0854', 205]
    ],
    trend_temp: [
        [0.0, '#1e3a8a', 185], [0.2, '#3b82f6', 175], [0.4, '#93c5fd', 135], [0.47, '#93c5fd', 35],
        [0.495, '#93c5fd', 0], [0.505, '#fca5a5', 0], [0.53, '#fca5a5', 35],
        [0.6, '#fca5a5', 135], [0.8, '#ef4444', 175], [1.0, '#991b1b', 185]
    ],
    trend_humidity: [
        [0.0, '#854d0e', 185], [0.25, '#d97706', 165], [0.44, '#d97706', 85],
        [0.495, '#d97706', 0], [0.505, '#0284c7', 0], [0.56, '#0284c7', 85],
        [0.75, '#0284c7', 165], [1.0, '#1e3a8a', 185]
    ]
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
        parsed = scale.map(s => [s[0], hexToRgb(s[1]), s[2] !== undefined ? s[2] : DEFAULT_ALPHA]);
        _scaleRgbCache.set(scale, parsed);
    }
    return parsed;
}

function sampleParsedScale(parsed, norm) {
    for (let i = 0; i < parsed.length - 1; i++) {
        if (norm >= parsed[i][0] && norm <= parsed[i + 1][0]) {
            const span = parsed[i + 1][0] - parsed[i][0];
            const t = span > 0 ? (norm - parsed[i][0]) / span : 0;
            const c1 = parsed[i][1], c2 = parsed[i + 1][1];
            const a1 = parsed[i][2], a2 = parsed[i + 1][2];
            return [
                Math.round(c1[0] + t * (c2[0] - c1[0])),
                Math.round(c1[1] + t * (c2[1] - c1[1])),
                Math.round(c1[2] + t * (c2[2] - c1[2])),
                Math.round(a1 + t * (a2 - a1))
            ];
        }
    }
    const last = parsed[parsed.length - 1];
    return [last[1][0], last[1][1], last[1][2], last[2]];
}

export function getColorRGBA(val, scale, cmin, cmax, alphaOverride = null) {
    if (val === null || isNaN(val)) return [0, 0, 0, 0];
    const parsed = getParsedScale(scale);
    const norm = Math.max(0, Math.min(1, (val - cmin) / (cmax - cmin)));
    const rgba = sampleParsedScale(parsed, norm);
    if (alphaOverride !== null) rgba[3] = alphaOverride;
    return rgba;
}

export function latToMercY(lat) {
    const rad = lat * Math.PI / 180.0;
    return Math.log(Math.tan(Math.PI / 4.0 + rad / 2.0));
}

// Oblicza wezly siatki IDW z metryka kilometrowa (brak znieksztalcen osi X/Y) i wykladnikiem p=3
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
            const rgba = sampleParsedScale(pScale, norm);
            const pIdx = idx * 4;
            heatImg.data[pIdx] = rgba[0]; heatImg.data[pIdx + 1] = rgba[1];
            heatImg.data[pIdx + 2] = rgba[2]; heatImg.data[pIdx + 3] = rgba[3];
        }
    }
    heatCtx.putImageData(heatImg, 0, 0);
    return { valGrid, heatCanvas };
}

// Przycina plotno do pelnego wielopiercieniowego wektora granic Rzeczypospolitej Polskiej (GISCO 1:1M)
function clipRasterToPoland(offCanvas, w, h, minLon, maxLon, minMercY, maxMercY) {
    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = w; mainCanvas.height = h;
    const mainCtx = mainCanvas.getContext('2d');
    mainCtx.beginPath();
    for (const ring of POLAND_POLY_RINGS) {
        ring.forEach(([pLon, pLat], i) => {
            const px = ((pLon - minLon) / (maxLon - minLon)) * w;
            const py = (1 - (latToMercY(pLat) - minMercY) / (maxMercY - minMercY)) * h;
            if (i === 0) mainCtx.moveTo(px, py); else mainCtx.lineTo(px, py);
        });
        mainCtx.closePath();
    }
    mainCtx.clip();
    mainCtx.drawImage(offCanvas, 0, 0);
    return mainCanvas.toDataURL();
}

function prepareIdwPoints(lats, lons, vals, bounds) {
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
    return { minLon, maxLon, minMercY, maxMercY, gw, gh, w, h, kx, ky, pts };
}

export function generateIDWImage(lats, lons, vals, scale, cmin, cmax, drawIso, stepVal, unit, bounds, clipToPoland) {
    const d = prepareIdwPoints(lats, lons, vals, bounds);
    const { valGrid, heatCanvas } = computeIdwRaster(d.pts, d.gw, d.gh, d.kx, d.ky, scale, cmin, cmax);
    const offCanvas = document.createElement('canvas');
    offCanvas.width = d.w; offCanvas.height = d.h;
    const offCtx = offCanvas.getContext('2d');
    offCtx.imageSmoothingQuality = 'high';
    offCtx.drawImage(heatCanvas, 0, 0, d.w, d.h);
    if (drawIso) drawIsolines(offCtx, valGrid, { gw: d.gw, gh: d.gh, w: d.w, h: d.h }, { cmin, cmax, stepVal, unit });
    return clipToPoland ? clipRasterToPoland(offCanvas, d.w, d.h, d.minLon, d.maxLon, d.minMercY, d.maxMercY) : offCanvas.toDataURL();
}

export function generateIsobarsOverlay(lats, lons, vals, bounds, clipToPoland, stepVal = 2.0) {
    const d = prepareIdwPoints(lats, lons, vals, bounds);
    const { valGrid } = computeIdwRaster(d.pts, d.gw, d.gh, d.kx, d.ky, COLORSCALES.pressure, 980, 1040);
    const offCanvas = document.createElement('canvas');
    offCanvas.width = d.w; offCanvas.height = d.h;
    drawIsolines(offCanvas.getContext('2d'), valGrid, { gw: d.gw, gh: d.gh, w: d.w, h: d.h }, { cmin: 980, cmax: 1040, stepVal, unit: '' });
    return clipToPoland ? clipRasterToPoland(offCanvas, d.w, d.h, d.minLon, d.maxLon, d.minMercY, d.maxMercY) : offCanvas.toDataURL();
}
