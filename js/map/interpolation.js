// js/map/interpolation.js
// Numeryczna interpolacja IDW (Inverse Distance Weighting), skale barwne i Marching Squares

function _calcWndNorm(kmh, mx = 259) { return +(kmh / mx).toFixed(4); }

export const COLORSCALES = {
    temp: [
        [0.0, "#f4c2f4"], [0.055, "#e020e0"], [0.111, "#8a2be2"], [0.166, "#4b0082"],
        [0.222, "#000080"], [0.277, "#0000ff"], [0.333, "#1e90ff"], [0.388, "#00bfff"],
        [0.444, "#00ffff"], [0.5, "#00fa9a"], [0.555, "#32cd32"], [0.611, "#adff2f"],
        [0.666, "#ffd700"], [0.722, "#ffa500"], [0.777, "#ff4500"], [0.833, "#ff0000"],
        [0.888, "#8b0000"], [0.944, "#5c4033"], [1.0, "#808080"]
    ],
    wind: [
        [0.0, "#FFFFFF"], [_calcWndNorm(9), "#C8FFFF"], [_calcWndNorm(19), "#00FFFF"], [_calcWndNorm(28), "#0088FF"],
        [_calcWndNorm(37), "#0000CD"], [_calcWndNorm(46), "#00C800"], [_calcWndNorm(56), "#80FF00"],
        [_calcWndNorm(65), "#FFFF00"], [_calcWndNorm(74), "#FFD700"], [_calcWndNorm(83), "#FFA500"],
        [_calcWndNorm(93), "#FF4500"], [_calcWndNorm(102), "#FF0000"], [_calcWndNorm(111), "#CC0000"],
        [_calcWndNorm(120), "#800000"], [_calcWndNorm(130), "#800080"], [_calcWndNorm(139), "#4B0082"],
        [_calcWndNorm(148), "#FF00FF"], [_calcWndNorm(157), "#FF69B4"], [_calcWndNorm(167), "#808080"], [1.0, "#000000"]
    ],
    humidity: [[0.0, "#FFD700"], [0.25, "#FF8C00"], [0.5, "#32CD32"], [0.75, "#1E90FF"], [1.0, "#00008B"]],
    dewpoint: [[0.0, "#0000FF"], [0.26, "#00BFFF"], [0.39, "#00FF7F"], [0.53, "#ADFF2F"], [0.66, "#FFD700"], [0.79, "#FF4500"], [0.92, "#FF0000"], [1.0, "#8B0000"]],
    pressure: [[0.0, "#3b0764"], [0.17, "#991b1b"], [0.33, "#ea580c"], [0.47, "#eab308"], [0.55, "#22c55e"], [0.67, "#06b6d4"], [0.80, "#2563eb"], [0.92, "#1e1b4b"], [1.0, "#4338ca"]],
    lcl: [[0.0, "#312e81"], [0.15, "#2563eb"], [0.30, "#06b6d4"], [0.45, "#10b981"], [0.60, "#eab308"], [0.75, "#f97316"], [0.90, "#ef4444"], [1.0, "#831843"]],
    snow: [[0.0, "#fdf2f8"], [0.08, "#fbcfe8"], [0.20, "#f472b6"], [0.35, "#ec4899"], [0.55, "#a855f7"], [0.75, "#7e22ce"], [0.90, "#581c87"], [1.0, "#2e0854"]],
    trend_temp: [[0.0, "#1e3a8a"], [0.2, "#3b82f6"], [0.4, "#93c5fd"], [0.5, "#f3f4f6"], [0.6, "#fca5a5"], [0.8, "#ef4444"], [1.0, "#991b1b"]],
    trend_humidity: [[0.0, "#854d0e"], [0.25, "#d97706"], [0.5, "#f3f4f6"], [0.75, "#0284c7"], [1.0, "#1e3a8a"]]
};

export const DEFAULT_ZMIENNE = {
    "temp":         { nazwa: "Temperatura", cscale: COLORSCALES.temp, cmin: -40, cmax: 50, unit: "°C", step: 2.0 },
    "grunt":        { nazwa: "Temperatura Gruntu", cscale: COLORSCALES.temp, cmin: -40, cmax: 50, unit: "°C", step: 2.0 },
    "rosy":         { nazwa: "Punkt Rosy", cscale: COLORSCALES.dewpoint, cmin: -10, cmax: 28, unit: "°C", step: 2.0 },
    "wilg":         { nazwa: "Wilgotność", cscale: COLORSCALES.humidity, cmin: 0, cmax: 100, unit: "%", step: 10.0 },
    "lcl":          { nazwa: "LCL", cscale: COLORSCALES.lcl, cmin: 0, cmax: 3000, unit: "m", step: 250.0 },
    "wiatr_sr":     { nazwa: "Prędkość Wiatru", cscale: COLORSCALES.wind, cmin: 0, cmax: 259, unit: "km/h", step: 10.0 },
    "wiatr":        { nazwa: "Porywy Wiatru", cscale: COLORSCALES.wind, cmin: 0, cmax: 259, unit: "km/h", step: 10.0 },
    "cisnienie":    { nazwa: "Ciśnienie QFF", cscale: COLORSCALES.pressure, cmin: 980, cmax: 1040, unit: "hPa", step: 2.0 },
    "snieg":        { nazwa: "Pokrywa Śnieżna", cscale: COLORSCALES.snow, cmin: 0, cmax: 100, unit: "cm", step: 5.0 },
    "snieg_swiezy": { nazwa: "Świeży Śnieg", cscale: COLORSCALES.snow, cmin: 0, cmax: 50, unit: "cm", step: 2.0 }
};

const POLAND_POLY_COORDS = [
    [18.8332, 49.5103], [18.7884, 49.6686], [18.6177, 49.7139], [18.5592, 49.9072], [18.2925, 49.9078], [18.0024, 50.0468],
    [17.8394, 49.9736], [17.732, 50.0949], [17.4242, 50.2406], [17.1876, 50.3785], [16.893, 50.4329], [16.6606, 50.093],
    [16.3437, 50.3699], [16.0865, 50.6468], [15.7922, 50.7427], [15.4418, 50.8002], [15.2698, 50.9527], [15.004, 51.0207],
    [14.8104, 50.8584], [15.0195, 51.2717], [14.9451, 51.4492], [14.71, 51.5302], [14.5858, 51.8039], [14.7614, 52.0767],
    [14.7124, 52.2359], [14.5454, 52.3822], [14.6448, 52.5769], [14.1239, 52.8507], [14.1445, 52.9599], [14.4416, 53.2518],
    [14.2639, 53.7], [14.531, 53.6578], [14.6238, 53.7695], [14.4412, 53.8696], [14.1753, 53.9065], [14.4067, 53.9218],
    [14.7819, 54.0346], [15.8597, 54.25], [16.5696, 54.5572], [17.3374, 54.749], [18.1524, 54.8383], [18.8353, 54.6031],
    [18.5881, 54.4337], [19.6095, 54.4567], [22.6984, 54.3429], [23.0501, 54.2948], [23.4962, 54.0446], [23.8006, 53.2425],
    [23.9225, 52.7426], [23.1656, 52.2894], [23.6375, 52.0845], [23.5946, 51.8433], [23.5434, 51.5927], [23.8636, 51.1483],
    [24.1432, 50.8564], [24.1077, 50.5408], [23.6822, 50.3682], [22.6658, 49.5674], [22.8553, 48.994], [21.8196, 49.3772],
    [21.0333, 49.3997], [20.0505, 49.1732], [19.7607, 49.1942], [19.2341, 49.5072], [18.8332, 49.5103]
];

function hexToRgb(hex) {
    const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return res ? [parseInt(res[1], 16), parseInt(res[2], 16), parseInt(res[3], 16)] : [0, 0, 0];
}

export function getColorRGBA(val, scale, cmin, cmax, alpha = 160) {
    if (val === null || isNaN(val)) return [0, 0, 0, 0];
    let norm = Math.max(0, Math.min(1, (val - cmin) / (cmax - cmin)));
    for (let i = 0; i < scale.length - 1; i++) {
        if (norm >= scale[i][0] && norm <= scale[i + 1][0]) {
            const span = scale[i + 1][0] - scale[i][0];
            const t = span > 0 ? (norm - scale[i][0]) / span : 0;
            const c1 = hexToRgb(scale[i][1]);
            const c2 = hexToRgb(scale[i + 1][1]);
            return [
                Math.round(c1[0] + t * (c2[0] - c1[0])),
                Math.round(c1[1] + t * (c2[1] - c1[1])),
                Math.round(c1[2] + t * (c2[2] - c1[2])),
                alpha
            ];
        }
    }
    const c = hexToRgb(scale[scale.length - 1][1]);
    return [c[0], c[1], c[2], alpha];
}

export function latToMercY(lat) {
    const rad = lat * Math.PI / 180.0;
    return Math.log(Math.tan(Math.PI / 4.0 + rad / 2.0));
}

export function generateIDWImage(lats, lons, vals, scale, cmin, cmax, drawIso, stepVal, unit, bounds, clipToPoland) {
    const minLat = bounds?.minLat ?? 48.5;
    const maxLat = bounds?.maxLat ?? 55.5;
    const minLon = bounds?.minLon ?? 13.5;
    const maxLon = bounds?.maxLon ?? 24.5;
    const minMercY = latToMercY(minLat);
    const maxMercY = latToMercY(maxLat);

    const gw = bounds ? 200 : 160;
    const gh = bounds ? 130 : 120;
    const w = 1200, h = 900;

    const pts = lats.map((lat, i) => ({
        x: ((lons[i] - minLon) / (maxLon - minLon)) * gw,
        y: (1 - (latToMercY(lat) - minMercY) / (maxMercY - minMercY)) * gh,
        v: vals[i]
    }));

    const heatCanvas = document.createElement('canvas');
    heatCanvas.width = gw;
    heatCanvas.height = gh;
    const heatCtx = heatCanvas.getContext('2d');
    const heatImg = heatCtx.createImageData(gw, gh);

    for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
            let num = 0, den = 0;
            for (let i = 0; i < pts.length; i++) {
                const dx = x - pts[i].x;
                const dy = y - pts[i].y;
                let d2 = Math.max(1.0, dx * dx + dy * dy);
                const weight = 1.0 / (d2 * Math.sqrt(d2));
                num += weight * pts[i].v;
                den += weight;
            }
            const rgba = getColorRGBA(num / den, scale, cmin, cmax);
            const idx = (y * gw + x) * 4;
            heatImg.data[idx] = rgba[0];
            heatImg.data[idx + 1] = rgba[1];
            heatImg.data[idx + 2] = rgba[2];
            heatImg.data[idx + 3] = rgba[3];
        }
    }
    heatCtx.putImageData(heatImg, 0, 0);

    const offCanvas = document.createElement('canvas');
    offCanvas.width = w;
    offCanvas.height = h;
    const offCtx = offCanvas.getContext('2d');
    offCtx.imageSmoothingQuality = 'high';
    offCtx.drawImage(heatCanvas, 0, 0, w, h);

    if (!clipToPoland) return offCanvas.toDataURL();

    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = w;
    mainCanvas.height = h;
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
