// js/map/radar.js
// Integracja radaru opadów (IMGW CMAX POLCOMP oraz RainViewer) i satelity EUMETSAT

export const IMGW_RADAR_SCALE = [
    [0, [0, 0, 0, 0]], [3, [4, 5, 147, 20]], [8, [4, 5, 147, 100]], [10, [31, 72, 216, 180]], [12, [58, 126, 231, 230]],
    [14, [86, 181, 247, 255]], [16, [109, 201, 252, 255]], [17, [121, 211, 248, 255]], [20, [174, 233, 251, 255]],
    [23, [231, 248, 255, 255]], [25, [253, 252, 224, 255]], [27, [253, 246, 158, 255]], [28, [254, 241, 136, 255]],
    [30, [249, 232, 90, 255]], [32, [245, 206, 77, 255]], [34, [239, 151, 54, 255]], [36, [233, 98, 43, 255]],
    [37, [236, 73, 38, 255]], [40, [184, 37, 29, 255]], [43, [159, 30, 34, 255]], [44, [149, 29, 39, 255]],
    [46, [142, 28, 51, 255]], [47, [159, 31, 79, 255]], [50, [187, 42, 135, 255]], [53, [210, 55, 172, 255]],
    [55, [219, 72, 189, 255]], [56, [221, 79, 197, 255]], [59, [203, 144, 198, 255]], [65, [180, 100, 180, 255]],
    [100, [0, 0, 0, 255]], [101, [0, 0, 0, 0]], [255, [0, 0, 0, 0]]
];

const IMGW_RADAR_BOUNDS = [[48.2985, 12.4411], [56.3277, 25.6641]];

let activeRadarSource = 'rv';
let radarTileLayer = null;
let radarHost = '';
let radarFrames = [];
let currentFrame = 0;
let animationTimer = null;
let imgwRadarOverlay = null;
let imgwFrames = [];
let satelliteDayLayer = null;
let satelliteNightLayer = null;
let lastSatSyncTime = null;

export function getIMGWRadarColor(dbz) {
    if (dbz <= 0) return [0, 0, 0, 0];
    for (let i = 0; i < IMGW_RADAR_SCALE.length - 1; i++) {
        if (dbz >= IMGW_RADAR_SCALE[i][0] && dbz <= IMGW_RADAR_SCALE[i + 1][0]) {
            return IMGW_RADAR_SCALE[i][1];
        }
    }
    return IMGW_RADAR_SCALE[IMGW_RADAR_SCALE.length - 1][1];
}

function generateImgwRadarFrames() {
    const now = new Date();
    const frames = [];
    for (let i = 47; i >= 0; i--) {
        const d = new Date(now.getTime() - (i * 5 + 3) * 60000);
        const pad = n => String(n).padStart(2, '0');
        const ts = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(Math.floor(d.getUTCMinutes() / 5) * 5)}`;
        const label = d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        const url = `https://danepubliczne.imgw.pl/pl/datastore/getfiledown/Oper/Polrad/Produkty/POLCOMP/COMPO_CMAX_250.comp.cmax/${ts}0000dBZ.cmax_echoOnly.png`;
        
        if (!frames.some(f => f.ts === ts)) {
            frames.push({ ts, url, time: Math.floor(d.getTime() / 1000), label });
        }
    }
    return frames;
}

function syncSatelliteTime(timeUnixSec) {
    if (!timeUnixSec) return;
    const isSatDay = window.MAP_LAYERS?.sat_day?.visible;
    const isSatNight = window.MAP_LAYERS?.sat_night?.visible;
    if (!isSatDay && !isSatNight) return;

    const d = new Date(timeUnixSec * 1000);
    const min15 = Math.floor(d.getUTCMinutes() / 15) * 15;
    d.setUTCMinutes(min15, 0, 0);
    const timeStr = d.toISOString().replace('.000Z', 'Z');

    if (lastSatSyncTime === timeStr) return;
    lastSatSyncTime = timeStr;

    if (isSatDay && satelliteDayLayer) satelliteDayLayer.setParams({ time: timeStr });
    if (isSatNight && satelliteNightLayer) satelliteNightLayer.setParams({ time: timeStr });
}

export function showRadarFrame(map, index) {
    currentFrame = parseInt(index);
    const timeEl = document.getElementById('rv-time');
    const opacity = (window.MAP_LAYERS?.radar?.opacity ?? 87) / 100.0;

    if (activeRadarSource === 'imgw') {
        if (!imgwFrames[currentFrame]) return;
        const frame = imgwFrames[currentFrame];
        
        if (!imgwRadarOverlay) {
            imgwRadarOverlay = L.imageOverlay(frame.url, IMGW_RADAR_BOUNDS, { opacity, pane: 'radarPane' });
        } else {
            imgwRadarOverlay.setUrl(frame.url);
            imgwRadarOverlay.setOpacity(opacity);
        }

        if (window.MAP_LAYERS?.radar?.visible && !map.hasLayer(imgwRadarOverlay)) {
            imgwRadarOverlay.addTo(map);
        }
        if (timeEl) timeEl.textContent = frame.label;
        syncSatelliteTime(frame.time);
    } else {
        if (!radarFrames[currentFrame]) return;
        const frame = radarFrames[currentFrame];
        const tileUrl = `${radarHost}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;

        if (!radarTileLayer) {
            radarTileLayer = L.tileLayer(tileUrl, { opacity, pane: 'radarPane', maxZoom: 18, maxNativeZoom: 8 });
        } else {
            radarTileLayer.setUrl(tileUrl);
            radarTileLayer.setOpacity(opacity);
        }

        if (window.MAP_LAYERS?.radar?.visible && !map.hasLayer(radarTileLayer)) {
            radarTileLayer.addTo(map);
        }
        if (timeEl) timeEl.textContent = new Date(frame.time * 1000).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        syncSatelliteTime(frame.time);
    }
}

export function initRadar(map) {
    imgwFrames = generateImgwRadarFrames();

    satelliteDayLayer = L.tileLayer.wms('https://view.eumetsat.int/geoserver/ows', {
        layers: 'msg_fes:rgb_eview', format: 'image/png', transparent: true,
        opacity: 0.68, pane: 'satellitePane', maxNativeZoom: 7, maxZoom: 18, attribution: 'EUMETSAT HRV'
    });

    map.createPane('satelliteNightPane');
    map.getPane('satelliteNightPane').style.zIndex = 250;
    satelliteNightLayer = L.tileLayer.wms('https://view.eumetsat.int/geoserver/ows', {
        layers: 'mtg_fd:ir105_hrfi', format: 'image/png', transparent: true,
        opacity: 0.52, pane: 'satelliteNightPane', maxNativeZoom: 7, maxZoom: 18, attribution: 'EUMETSAT MTG-IR'
    });

    fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(res => res.json())
        .then(data => {
            radarHost = data.host;
            radarFrames = data.radar.past.concat(data.radar.nowcast);
            if (activeRadarSource === 'rv') {
                const slider = document.getElementById('rv-slider');
                if (slider && radarFrames.length > 0) {
                    slider.max = radarFrames.length - 1;
                    slider.value = radarFrames.length - 1;
                    currentFrame = radarFrames.length - 1;
                }
                showRadarFrame(map, currentFrame);
            }
        })
        .catch(err => console.error("Błąd pobierania RainViewer:", err));

    window.setRadarSource = (src) => {
        activeRadarSource = src;
        const btnImgw = document.getElementById('radar-src-imgw');
        const btnRv = document.getElementById('radar-src-rv');
        
        if (src === 'imgw') {
            if (btnImgw) btnImgw.className = 'btn btn-primary';
            if (btnRv) btnRv.className = 'btn btn-ghost';
            if (radarTileLayer && map.hasLayer(radarTileLayer)) map.removeLayer(radarTileLayer);
            imgwFrames = generateImgwRadarFrames();
        } else {
            if (btnRv) btnRv.className = 'btn btn-primary';
            if (btnImgw) btnImgw.className = 'btn btn-ghost';
            if (imgwRadarOverlay && map.hasLayer(imgwRadarOverlay)) map.removeLayer(imgwRadarOverlay);
        }

        const count = src === 'imgw' ? imgwFrames.length : radarFrames.length;
        const slider = document.getElementById('rv-slider');
        if (slider && count > 0) {
            slider.max = count - 1;
            slider.value = count - 1;
            currentFrame = count - 1;
        }
        showRadarFrame(map, currentFrame);
    };

    const rvSlider = document.getElementById('rv-slider');
    if (rvSlider) rvSlider.addEventListener('input', e => showRadarFrame(map, parseInt(e.target.value)));

    const rvPlayBtn = document.getElementById('rv-play-btn');
    if (rvPlayBtn) {
        rvPlayBtn.addEventListener('click', e => {
            const btn = e.currentTarget;
            if (animationTimer) {
                clearInterval(animationTimer);
                animationTimer = null;
                btn.innerHTML = '<i data-lucide="play"></i>';
            } else {
                btn.innerHTML = '<i data-lucide="pause"></i>';
                const max = activeRadarSource === 'imgw' ? imgwFrames.length : radarFrames.length;
                if (currentFrame >= max - 1) currentFrame = 0;
                animationTimer = setInterval(() => {
                    const count = activeRadarSource === 'imgw' ? imgwFrames.length : radarFrames.length;
                    currentFrame = currentFrame >= count - 1 ? 0 : currentFrame + 1;
                    if (rvSlider) rvSlider.value = currentFrame;
                    showRadarFrame(map, currentFrame);
                }, 500);
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }

    return { satelliteDayLayer, satelliteNightLayer, getRadarOverlay: () => (activeRadarSource === 'imgw' ? imgwRadarOverlay : radarTileLayer) };
}
