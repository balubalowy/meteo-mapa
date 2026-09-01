// mapa.js - Standalone B-Meteo Synoptic Map Engine (Open & Live)

document.addEventListener('DOMContentLoaded', function() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    initMap();
});

// Słownik 65 stacji synoptycznych IMGW z dokładnymi współrzędnymi
const SYNOP_STATIONS_COORDS = {
    "12100": { "lat": 54.18, "lon": 16.18, "name": "Kołobrzeg" },
    "12105": { "lat": 54.20, "lon": 16.18, "name": "Koszalin" },
    "12115": { "lat": 54.47, "lon": 17.03, "name": "Ustka" },
    "12120": { "lat": 54.76, "lon": 17.55, "name": "Łeba" },
    "12125": { "lat": 54.60, "lon": 18.80, "name": "Hel" },
    "12135": { "lat": 54.38, "lon": 18.47, "name": "Gdańsk-Rębiechowo" },
    "12155": { "lat": 54.17, "lon": 19.43, "name": "Elbląg" },
    "12160": { "lat": 54.25, "lon": 20.83, "name": "Bartoszyce" },
    "12185": { "lat": 54.15, "lon": 22.93, "name": "Suwałki" },
    "12195": { "lat": 53.98, "lon": 22.98, "name": "Augustów" },
    "12200": { "lat": 53.92, "lon": 14.25, "name": "Świnoujście" },
    "12205": { "lat": 53.40, "lon": 14.62, "name": "Szczecin" },
    "12215": { "lat": 53.65, "lon": 15.80, "name": "Resko" },
    "12230": { "lat": 53.72, "lon": 16.70, "name": "Szczecinek" },
    "12235": { "lat": 53.75, "lon": 17.55, "name": "Chojnice" },
    "12250": { "lat": 53.10, "lon": 18.00, "name": "Bydgoszcz" },
    "12270": { "lat": 53.78, "lon": 20.48, "name": "Olsztyn" },
    "12272": { "lat": 53.78, "lon": 21.57, "name": "Mikołajki" },
    "12280": { "lat": 53.35, "lon": 22.05, "name": "Łomża" },
    "12295": { "lat": 53.13, "lon": 23.17, "name": "Białystok" },
    "12300": { "lat": 52.73, "lon": 15.23, "name": "Gorzów Wlkp." },
    "12310": { "lat": 52.97, "lon": 16.57, "name": "Trzcianka" },
    "12330": { "lat": 52.42, "lon": 16.83, "name": "Poznań" },
    "12348": { "lat": 52.53, "lon": 18.25, "name": "Inowrocław" },
    "12360": { "lat": 52.73, "lon": 19.05, "name": "Włocławek" },
    "12375": { "lat": 52.17, "lon": 20.97, "name": "Warszawa-Okęcie" },
    "12385": { "lat": 52.18, "lon": 22.27, "name": "Siedlce" },
    "12399": { "lat": 52.03, "lon": 23.13, "name": "Biała Podlaska" },
    "12400": { "lat": 51.55, "lon": 15.03, "name": "Zielona Góra" },
    "12415": { "lat": 51.67, "lon": 16.08, "name": "Głogów" },
    "12418": { "lat": 51.65, "lon": 16.53, "name": "Leszno" },
    "12424": { "lat": 51.77, "lon": 18.08, "name": "Kalisz" },
    "12435": { "lat": 51.72, "lon": 19.40, "name": "Łódź" },
    "12455": { "lat": 51.55, "lon": 20.02, "name": "Tomaszów Maz." },
    "12465": { "lat": 51.40, "lon": 21.15, "name": "Radom" },
    "12485": { "lat": 51.57, "lon": 23.53, "name": "Włodawa" },
    "12495": { "lat": 51.23, "lon": 22.57, "name": "Lublin" },
    "12500": { "lat": 51.18, "lon": 15.00, "name": "Zgorzelec" },
    "12510": { "lat": 50.90, "lon": 15.73, "name": "Jelenia Góra" },
    "12520": { "lat": 51.10, "lon": 16.98, "name": "Wrocław" },
    "12530": { "lat": 50.72, "lon": 16.65, "name": "Kłodzko" },
    "12540": { "lat": 50.67, "lon": 17.93, "name": "Opole" },
    "12550": { "lat": 50.48, "lon": 17.33, "name": "Nysa" },
    "12560": { "lat": 50.23, "lon": 19.03, "name": "Katowice" },
    "12566": { "lat": 50.07, "lon": 19.95, "name": "Kraków" },
    "12570": { "lat": 50.80, "lon": 20.63, "name": "Kielce" },
    "12580": { "lat": 50.68, "lon": 21.75, "name": "Sandomierz" },
    "12585": { "lat": 50.60, "lon": 22.72, "name": "Zamość" },
    "12595": { "lat": 50.03, "lon": 22.00, "name": "Rzeszów" },
    "12600": { "lat": 49.80, "lon": 19.05, "name": "Bielsko-Biała" },
    "12625": { "lat": 49.23, "lon": 19.98, "name": "Zakopane" },
    "12650": { "lat": 49.63, "lon": 20.70, "name": "Nowy Sącz" },
    "12660": { "lat": 49.68, "lon": 21.77, "name": "Krosno" },
    "12670": { "lat": 49.45, "lon": 22.33, "name": "Lesko" },
    "12695": { "lat": 49.78, "lon": 22.77, "name": "Przemyśl" }
};

const DEFAULT_TEMP_COLORSCALE = [
    [0.0, "#3b0764"], [0.15, "#1e3a8a"], [0.3, "#0284c7"], [0.45, "#06b6d4"],
    [0.55, "#22c55e"], [0.7, "#eab308"], [0.85, "#ea580c"], [1.0, "#991b1b"]
];

const DEFAULT_PRESSURE_COLORSCALE = [
    [0.0, "#3b0764"], [0.17, "#991b1b"], [0.33, "#ea580c"], [0.47, "#eab308"],
    [0.55, "#22c55e"], [0.67, "#06b6d4"], [0.8, "#2563eb"], [0.92, "#1e1b4b"], [1.0, "#4338ca"]
];

const DEFAULT_WIND_COLORSCALE = [
    [0.0, "#10b981"], [0.25, "#eab308"], [0.5, "#f97316"], [0.75, "#ef4444"], [1.0, "#831843"]
];

const DEFAULT_ZMIENNE = {
    "temp": { nazwa: "Temperatura", cscale: DEFAULT_TEMP_COLORSCALE, cmin: -25, cmax: 40, unit: "°C" },
    "cisnienie": { nazwa: "Ciśnienie", cscale: DEFAULT_PRESSURE_COLORSCALE, cmin: 980, cmax: 1040, unit: "hPa" },
    "wiatr": { nazwa: "Porywy Wiatru", cscale: DEFAULT_WIND_COLORSCALE, cmin: 0, cmax: 140, unit: "km/h" },
    "wiatr_sr": { nazwa: "Średni Wiatr", cscale: DEFAULT_WIND_COLORSCALE, cmin: 0, cmax: 100, unit: "km/h" },
    "rosy": { nazwa: "Punkt Rosy", cscale: DEFAULT_TEMP_COLORSCALE, cmin: -20, cmax: 26, unit: "°C" },
    "lcl": { nazwa: "LCL", cscale: DEFAULT_WIND_COLORSCALE, cmin: 0, cmax: 3000, unit: "m" },
    "wilg": { nazwa: "Wilgotność", cscale: DEFAULT_WIND_COLORSCALE, cmin: 10, cmax: 100, unit: "%" },
    "grunt": { nazwa: "Temp. Gruntu", cscale: DEFAULT_TEMP_COLORSCALE, cmin: -25, cmax: 50, unit: "°C" }
};

let map = null;
let satDayLayer = null;
let satNightLayer = null;
let radarOverlay = null;
let idwOverlay = null;
let stationsGroup = null;
let boundariesGroup = null;
let lightningGroup = null;

let activeRadarSource = 'imgw';
let imgwFrames = [];
let rvFrames = [];
let currentFrame = 0;
let animationTimer = null;
let lastSatSyncTime = null;
let imgwCache = null;
let imgwCacheTime = 0;

window.MAP_LAYERS = {
    'drawings': { id: 'drawings', name: 'Kreator Ostrzeżeń', visible: false, opacity: 100, pane: 'drawingsPane' },
    'stations': { id: 'stations', name: 'Stacje i Pomiary IMGW', visible: true, opacity: 100, pane: 'stationsPane' },
    'boundaries': { id: 'boundaries', name: 'Granice Polski', visible: true, opacity: 100, pane: 'boundariesPane' },
    'lightning': { id: 'lightning', name: 'Wyładowania (Live)', visible: false, opacity: 95, pane: 'lightningPane' },
    'radar': { id: 'radar', name: 'Radar Opadów', visible: false, opacity: 87, pane: 'radarPane' },
    'sat_day': { id: 'sat_day', name: 'Satelita Dzienny (HRV)', visible: false, opacity: 100, pane: 'satellitePane' },
    'inter': { id: 'inter', name: 'Interpolacja IMGW', visible: true, opacity: 70, pane: 'weatherPane' },
    'sat_night': { id: 'sat_night', name: 'Satelita Nocny (IR)', visible: false, opacity: 60, pane: 'satelliteNightPane' }
};

window.layerOrder = ['drawings', 'stations', 'boundaries', 'lightning', 'radar', 'sat_day', 'inter', 'sat_night'];

function initMap() {
    map = L.map('premium-map', { center: [51.9194, 19.1451], zoom: 6, zoomControl: false });
    window.map = map;
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Panes Z-Index
    map.createPane('basePane'); map.getPane('basePane').style.zIndex = 200;
    map.createPane('satellitePane'); map.getPane('satellitePane').style.zIndex = 240;
    map.createPane('satelliteNightPane'); map.getPane('satelliteNightPane').style.zIndex = 250;
    map.createPane('weatherPane'); map.getPane('weatherPane').style.zIndex = 270;
    map.createPane('radarPane'); map.getPane('radarPane').style.zIndex = 300;
    map.createPane('boundariesPane'); map.getPane('boundariesPane').style.zIndex = 330;
    map.createPane('lightningPane'); map.getPane('lightningPane').style.zIndex = 360;
    map.createPane('drawingsPane'); map.getPane('drawingsPane').style.zIndex = 390;
    map.createPane('stationsPane'); map.getPane('stationsPane').style.zIndex = 420;
    map.createPane('labelsPane'); map.getPane('labelsPane').style.zIndex = 650;
    map.getPane('labelsPane').style.pointerEvents = 'none';

    // Czysty, ciemny podkład synoptyczny Esri Dark Gray Base (brak watermarku API)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri, HERE, Garmin', pane: 'basePane', maxZoom: 16
    }).addTo(map);

    // Satelita EUMETSAT WMS
    satDayLayer = L.tileLayer.wms('https://view.eumetsat.int/geoserver/ows', {
        layers: 'msg_fes:rgb_eview', format: 'image/png', transparent: true, opacity: 0.65, pane: 'satellitePane', maxNativeZoom: 7, maxZoom: 18, attribution: '© EUMETSAT HRV'
    });

    satNightLayer = L.tileLayer.wms('https://view.eumetsat.int/geoserver/ows', {
        layers: 'mtg_fd:ir105_hrfi', format: 'image/png', transparent: true, opacity: 0.60, pane: 'satelliteNightPane', maxNativeZoom: 7, maxZoom: 18, attribution: '© EUMETSAT MTG-IR'
    });

    // Granice i Wyładowania
    boundariesGroup = L.layerGroup([], { pane: 'boundariesPane' }).addTo(map);
    lightningGroup = L.layerGroup([], { pane: 'lightningPane' });
    stationsGroup = L.layerGroup([], { pane: 'stationsPane' }).addTo(map);

    fetch('geo/poland_hires.geojson')
        .then(r => r.json())
        .then(geo => {
            L.geoJSON(geo, { style: { color: '#64748b', weight: 1.5, fillOpacity: 0 }, pane: 'boundariesPane' }).addTo(boundariesGroup);
        }).catch(() => {});

    // Radar & Oś czasu
    initRadar();
    initLayers();
    initGeoman();
    renderIMGW();
}

function generateImgwFrames() {
    const frames = [];
    const now = new Date();
    now.setUTCMinutes(Math.floor(now.getUTCMinutes() / 5) * 5, 0, 0);

    for (let i = 11; i >= 0; i--) {
        const t = new Date(now.getTime() - (i * 5 * 60 * 1000));
        const y = t.getUTCFullYear();
        const m = String(t.getUTCMonth() + 1).padStart(2, '0');
        const d = String(t.getUTCDate()).padStart(2, '0');
        const h = String(t.getUTCHours()).padStart(2, '0');
        const mn = String(t.getUTCMinutes()).padStart(2, '0');
        frames.push({
            time: Math.floor(t.getTime() / 1000),
            label: t.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
            url: `https://danepubliczne.imgw.pl/datastore/getfiledown/Arch/Met/Biez/Radar/cmax_${y}${m}${d}${h}${mn}0000dBZ.cmax.png`
        });
    }
    return frames;
}

function syncSatelliteTime(timeSec) {
    if (!timeSec) return;
    const isSatDay = window.MAP_LAYERS['sat_day'].visible;
    const isSatNight = window.MAP_LAYERS['sat_night'].visible;
    if (!isSatDay && !isSatNight) return;

    const d = new Date(timeSec * 1000);
    d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 15) * 15, 0, 0);
    const timeStr = d.toISOString().replace('.000Z', 'Z');
    if (lastSatSyncTime === timeStr) return;
    lastSatSyncTime = timeStr;

    if (isSatDay && satDayLayer) satDayLayer.setParams({ time: timeStr });
    if (isSatNight && satNightLayer) satNightLayer.setParams({ time: timeStr });
}

function showRadarFrame(index) {
    currentFrame = parseInt(index);
    const timeEl = document.getElementById('rv-time');
    const op = (window.MAP_LAYERS['radar'].opacity || 87) / 100.0;

    if (activeRadarSource === 'imgw') {
        const frame = imgwFrames[currentFrame];
        if (!frame) return;
        if (!radarOverlay) {
            radarOverlay = L.imageOverlay(frame.url, [[48.8, 13.8], [55.2, 24.5]], { opacity: op, pane: 'radarPane' });
        } else {
            radarOverlay.setUrl(frame.url);
            radarOverlay.setOpacity(op);
        }
        if (window.MAP_LAYERS['radar'].visible && !map.hasLayer(radarOverlay)) radarOverlay.addTo(map);
        if (timeEl) timeEl.textContent = frame.label;
        syncSatelliteTime(frame.time);
    }
}

window.setRadarSource = function(src) {
    activeRadarSource = src;
    document.getElementById('radar-src-imgw').className = src === 'imgw' ? 'btn btn-primary' : 'btn btn-ghost';
    document.getElementById('radar-src-rv').className = src === 'rv' ? 'btn btn-primary' : 'btn btn-ghost';
    imgwFrames = generateImgwFrames();
    showRadarFrame(document.getElementById('rv-slider').value);
};

function initRadar() {
    imgwFrames = generateImgwFrames();
    const slider = document.getElementById('rv-slider');
    slider.addEventListener('input', e => showRadarFrame(e.target.value));

    const playBtn = document.getElementById('rv-play-btn');
    playBtn.addEventListener('click', () => {
        if (animationTimer) {
            clearInterval(animationTimer); animationTimer = null;
            playBtn.innerHTML = '<i data-lucide="play" style="width:16px;height:16px;"></i>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            playBtn.innerHTML = '<i data-lucide="pause" style="width:16px;height:16px;"></i>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
            animationTimer = setInterval(() => {
                let next = parseInt(slider.value) + 1;
                if (next > parseInt(slider.max)) next = 0;
                slider.value = next;
                showRadarFrame(next);
            }, 600);
        }
    });

    setRadarSource('imgw');
}

// IMGW Data & IDW Interpolation
async function fetchIMGW() {
    const now = Date.now();
    if (imgwCache && (now - imgwCacheTime < 60000)) return imgwCache;
    const loader = document.getElementById('imgw-loading');
    if (loader) loader.style.display = 'flex';

    try {
        const [resMeteo, resSynop] = await Promise.all([
            fetch('https://danepubliczne.imgw.pl/api/data/meteo/'),
            fetch('https://danepubliczne.imgw.pl/api/data/synop')
        ]);
        const [rawMeteo, rawSynop] = await Promise.all([resMeteo.json(), resSynop.json()]);

        const dataObj = { 'temp': { lats: [], lons: [], vals: [], txts: [], hovs: [] }, 'cisnienie': { lats: [], lons: [], vals: [], txts: [], hovs: [] }, 'wiatr': { lats: [], lons: [], vals: [], txts: [], hovs: [] }, 'wiatr_sr': { lats: [], lons: [], vals: [], txts: [], hovs: [] }, 'rosy': { lats: [], lons: [], vals: [], txts: [], hovs: [] }, 'lcl': { lats: [], lons: [], vals: [], txts: [], hovs: [] }, 'wilg': { lats: [], lons: [], vals: [], txts: [], hovs: [] }, 'grunt': { lats: [], lons: [], vals: [], txts: [], hovs: [] } };

        for (let st of rawSynop) {
            const p = parseFloat(st.cisnienie);
            const c = SYNOP_STATIONS_COORDS[st.id_stacji];
            if (!isNaN(p) && c) {
                dataObj['cisnienie'].lats.push(c.lat); dataObj['cisnienie'].lons.push(c.lon); dataObj['cisnienie'].vals.push(p); dataObj['cisnienie'].txts.push(p.toFixed(1));
                dataObj['cisnienie'].hovs.push(`<b>${c.name || st.stacja}</b> (SYNOP)<br>Ciśnienie QNH: <b>${p.toFixed(1)} hPa</b><br>Temp: ${st.temperatura || '-'}°C, Wilgotność: ${st.wilgotnosc_wzgledna || '-'}%`);
            }
        }

        for (let st of rawMeteo) {
            const lat = parseFloat(st.lat), lon = parseFloat(st.lon);
            if (isNaN(lat) || isNaN(lon)) continue;
            const t = parseFloat(st.temperatura_powietrza), tg = parseFloat(st.temperatura_gruntu), rh = parseFloat(st.wilgotnosc_wzgledna);
            const poryw = Math.max(parseFloat(st.wiatr_poryw_10min) || 0, parseFloat(st.wiatr_predkosc_maksymalna) || 0) * 3.6;
            const wsr = (parseFloat(st.wiatr_srednia_predkosc) || 0) * 3.6;
            let dp = null, lcl = NaN;
            if (!isNaN(t) && !isNaN(rh) && rh > 0) {
                const alpha = (17.27 * t) / (237.7 + t) + Math.log(rh / 100);
                dp = (237.7 * alpha) / (17.27 - alpha);
                lcl = Math.round(125 * Math.max(0, t - dp));
            }

            const add = (k, v, txt, hov) => {
                if (v !== null && !isNaN(v)) { dataObj[k].lats.push(lat); dataObj[k].lons.push(lon); dataObj[k].vals.push(v); dataObj[k].txts.push(txt); dataObj[k].hovs.push(`<b>${st.nazwa_stacji}</b><br>${hov}`); }
            };

            add('temp', t, t?.toFixed(1) + '°', `Temperatura: ${t?.toFixed(1)}°C`);
            add('grunt', tg, tg?.toFixed(1) + '°', `Temp. Gruntu: ${tg?.toFixed(1)}°C`);
            add('wilg', rh, rh?.toFixed(0) + '%', `Wilgotność: ${rh?.toFixed(0)}%`);
            add('rosy', dp, dp?.toFixed(1) + '°', `Punkt Rosy: ${dp?.toFixed(1)}°C`);
            add('lcl', lcl, !isNaN(lcl) ? (lcl + 'm') : '', `Podstawa Chmur (LCL): ${lcl} m`);
            add('wiatr', poryw, poryw > 0 ? (poryw.toFixed(0) + ' km/h') : '', `Poryw: <b>${poryw.toFixed(0)} km/h</b>`);
            add('wiatr_sr', wsr, wsr > 0 ? (wsr.toFixed(0) + ' km/h') : '', `Śr. wiatr: <b>${wsr.toFixed(0)} km/h</b>`);
        }

        imgwCache = dataObj; imgwCacheTime = now; return dataObj;
    } catch (e) { console.error('Błąd IMGW:', e); return null; }
    finally { if (loader) loader.style.display = 'none'; }
}

window.renderIMGW = async function() {
    const zmienna = document.getElementById('imgw-zmienna')?.value || 'temp';
    const drawIso = document.getElementById('chk-iso')?.checked ?? true;
    const drawPts = document.getElementById('chk-pt')?.checked ?? true;
    const drawTxt = document.getElementById('chk-txt')?.checked ?? true;
    const stepVal = document.getElementById('iso-step')?.value === 'auto' ? null : parseFloat(document.getElementById('iso-step')?.value);

    const cfg = DEFAULT_ZMIENNE[zmienna] || DEFAULT_ZMIENNE['temp'];
    const data = await fetchIMGW();
    if (!data || !data[zmienna]) return;
    const d = data[zmienna];

    // IDW Raster
    if (window.MAP_LAYERS['inter'].visible && d.lats.length >= 3) {
        const dataUrl = generateIDWImage(d.lats, d.lons, d.vals, cfg.cscale, cfg.cmin, cfg.cmax, drawIso, stepVal);
        const op = (window.MAP_LAYERS['inter'].opacity || 70) / 100.0;
        if (idwOverlay) { idwOverlay.setUrl(dataUrl); idwOverlay.setOpacity(op); }
        else { idwOverlay = L.imageOverlay(dataUrl, [[48.5, 13.5], [55.5, 24.5]], { opacity: op, pane: 'weatherPane' }).addTo(map); }
    } else if (idwOverlay) { map.removeLayer(idwOverlay); idwOverlay = null; }

    // Punkty
    stationsGroup.clearLayers();
    if (window.MAP_LAYERS['stations'].visible && (drawPts || drawTxt)) {
        for (let i = 0; i < d.lats.length; i++) {
            if (drawPts) {
                const marker = L.circleMarker([d.lats[i], d.lons[i]], { radius: 3.5, fillColor: '#38bdf8', color: '#0f172a', weight: 1, fillOpacity: 0.9, pane: 'stationsPane' });
                marker.bindPopup(d.hovs[i]); stationsGroup.addLayer(marker);
            }
            if (drawTxt && d.txts[i]) {
                const icon = L.divIcon({ className: 'station-val-label', html: `<div style="font-size:10px;font-weight:700;color:#fff;text-shadow:0 0 2px #000,0 0 4px #000;transform:translate(-50%,-18px);">${d.txts[i]}</div>`, iconSize: [0, 0] });
                stationsGroup.addLayer(L.marker([d.lats[i], d.lons[i]], { icon: icon, pane: 'labelsPane', interactive: false }));
            }
        }
    }
};

function generateIDWImage(lats, lons, vals, scale, cmin, cmax, drawIso, stepVal) {
    const w = 360, h = 270;
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(w, h);
    const valGrid = new Float32Array(w * h);

    const pts = [];
    for (let i = 0; i < lats.length; i++) {
        const px = ((lons[i] - 13.5) / (24.5 - 13.5)) * w;
        const py = (1 - (lats[i] - 48.5) / (55.5 - 48.5)) * h;
        pts.push({ x: px, y: py, v: vals[i] });
    }

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let num = 0, den = 0;
            for (let p of pts) {
                const dx = x - p.x, dy = y - p.y;
                let d2 = dx * dx + dy * dy;
                if (d2 < 0.5) d2 = 0.5;
                const weight = 1.0 / (d2 * d2);
                num += weight * p.v; den += weight;
            }
            const val = num / den;
            valGrid[y * w + x] = val;

            let norm = Math.max(0, Math.min(1, (val - cmin) / (cmax - cmin)));
            const pIdx = (y * w + x) * 4;
            imgData.data[pIdx] = Math.round(50 + norm * 180);
            imgData.data[pIdx + 1] = Math.round(100 + (1 - Math.abs(norm - 0.5) * 2) * 120);
            imgData.data[pIdx + 2] = Math.round(220 - norm * 180);
            imgData.data[pIdx + 3] = 160;
        }
    }

    if (drawIso) {
        const step = stepVal || ((cmax - cmin) / 15);
        for (let y = 0; y < h - 1; y++) {
            for (let x = 0; x < w - 1; x++) {
                const idx = y * w + x;
                const q1 = Math.floor(valGrid[idx] / step);
                const q2 = Math.floor(valGrid[idx + 1] / step);
                const q3 = Math.floor(valGrid[idx + w] / step);
                if (q1 !== q2 || q1 !== q3) {
                    const pIdx = idx * 4;
                    imgData.data[pIdx] = 15; imgData.data[pIdx + 1] = 23; imgData.data[pIdx + 2] = 42; imgData.data[pIdx + 3] = 220;
                }
            }
        }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
}

function initLayers() {
    const list = document.getElementById('layer-manager-list');
    if (!list) return;

    list.innerHTML = window.layerOrder.map((key, idx) => {
        const item = window.MAP_LAYERS[key];
        const isTop = idx === 0, isBottom = idx === window.layerOrder.length - 1;
        return `
            <div style="background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:6px;padding:6px 10px;display:flex;flex-direction:column;gap:4px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <label style="font-size:0.8rem;font-weight:600;cursor:pointer;margin:0;display:flex;align-items:center;gap:6px;">
                        <input type="checkbox" ${item.visible ? 'checked' : ''} onchange="toggleLayer('${key}', this.checked)"> ${item.name}
                    </label>
                    <div style="display:flex;gap:3px;">
                        <button class="btn btn-ghost" style="padding:1px 5px;font-size:0.7rem;" onclick="moveLayer('${key}', 'up')" ${isTop ? 'disabled style="opacity:0.3"' : ''}></button>
                        <button class="btn btn-ghost" style="padding:1px 5px;font-size:0.7rem;" onclick="moveLayer('${key}', 'down')" ${isBottom ? 'disabled style="opacity:0.3"' : ''}></button>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;font-size:0.7rem;color:var(--text-muted);">
                    <span>Krycie:</span>
                    <input type="range" min="0" max="100" value="${item.opacity}" oninput="setLayerOpacity('${key}', this.value)" style="flex:1;accent-color:var(--accent-primary);height:3px;">
                    <span id="op-${key}">${item.opacity}%</span>
                </div>
            </div>
        `;
    }).join('');
}

window.toggleLayer = function(key, isChecked) {
    window.MAP_LAYERS[key].visible = isChecked;
    if (key === 'sat_day') { if (isChecked) { satDayLayer.addTo(map); syncSatelliteTime(Date.now() / 1000); } else map.removeLayer(satDayLayer); }
    else if (key === 'sat_night') { if (isChecked) { satNightLayer.addTo(map); syncSatelliteTime(Date.now() / 1000); } else map.removeLayer(satNightLayer); }
    else if (key === 'boundaries') { if (isChecked) boundariesGroup.addTo(map); else map.removeLayer(boundariesGroup); }
    else if (key === 'radar') { if (isChecked && radarOverlay) radarOverlay.addTo(map); else if (radarOverlay) map.removeLayer(radarOverlay); }
    else if (key === 'inter' || key === 'stations') renderIMGW();
};

window.setLayerOpacity = function(key, val) {
    const op = parseInt(val) / 100.0;
    window.MAP_LAYERS[key].opacity = parseInt(val);
    document.getElementById(`op-${key}`).textContent = val + '%';
    if (key === 'sat_day') satDayLayer.setOpacity(op);
    else if (key === 'sat_night') satNightLayer.setOpacity(op);
    else if (key === 'radar' && radarOverlay) radarOverlay.setOpacity(op);
    else if (key === 'inter' && idwOverlay) idwOverlay.setOpacity(op);
};

window.moveLayer = function(key, dir) {
    const idx = window.layerOrder.indexOf(key);
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= window.layerOrder.length) return;
    const tmp = window.layerOrder[idx];
    window.layerOrder[idx] = window.layerOrder[target];
    window.layerOrder[target] = tmp;

    window.layerOrder.forEach((k, i) => {
        const p = window.MAP_LAYERS[k].pane;
        if (p && map.getPane(p)) map.getPane(p).style.zIndex = 240 + (window.layerOrder.length - i) * 30;
    });
    initLayers();
};

function initGeoman() {
    if (!map.pm) return;
    map.pm.addControls({ position: 'topleft', drawCircleMarker: false, drawPolyline: false, drawRectangle: false, drawCircle: false, editMode: true, dragMode: true, removalMode: true });
    map.pm.setGlobalOptions({ pathOptions: { color: '#ef4444', weight: 3, fillOpacity: 0.4 } });
}

window.setDrawingMode = function(mode) {
    if (!map.pm) return;
    if (mode === 'front_chlodny') { map.pm.setGlobalOptions({ pathOptions: { color: '#3b82f6', weight: 3 } }); map.pm.enableDraw('Line'); }
    else if (mode === 'front_cieply') { map.pm.setGlobalOptions({ pathOptions: { color: '#ef4444', weight: 3 } }); map.pm.enableDraw('Line'); }
    else if (mode === 'front_zokludowany') { map.pm.setGlobalOptions({ pathOptions: { color: '#d946ef', weight: 3 } }); map.pm.enableDraw('Line'); }
    else if (mode === 'zbieznosc') { map.pm.setGlobalOptions({ pathOptions: { color: '#f97316', weight: 3 } }); map.pm.enableDraw('Line'); }
    else if (['wyz', 'niz', 'burza'].includes(mode)) map.pm.enableDraw('Marker');
};

window.clearMap = function() {
    map.eachLayer(l => {
        if ((l instanceof L.Polygon || l instanceof L.Polyline || l instanceof L.Marker) && !l._url && l.options.icon?.options?.className !== 'leaflet-div-icon leaflet-editing-icon') {
            map.removeLayer(l);
        }
    });
};

window.toggleMapFullscreen = function() {
    const c = document.querySelector('.map-dashboard-container');
    if (!document.fullscreenElement) c.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
    setTimeout(() => map.invalidateSize(), 150);
};

window.toggleMapSidebar = function() {
    const sb = document.getElementById('map-sidebar');
    const icon = document.getElementById('sidebar-toggle-icon');
    const isHidden = sb.classList.toggle('sidebar-collapsed');
    if (icon) icon.setAttribute('data-lucide', isHidden ? 'panel-left-open' : 'panel-left-close');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(() => map.invalidateSize(), 150);
};
