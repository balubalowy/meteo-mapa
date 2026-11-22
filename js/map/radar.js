// js/map/radar.js
// Zrodla: IMGW-PIB POLRAD CMAX (danepubliczne.imgw.pl), RainViewer (rainviewer.com),
// LibreWXR (librewxr.net, CC BY 4.0). Synchronizacja satelity w satellite.js.

import { fmtPlTime } from './stations.js';
import { initSatellite, syncSatelliteTime } from './satellite.js';
import {
    applySavedLibreWxrUI, loadLibreWxrFrames, renderLibreWxrFrame, hideLibreWxrLayer,
    getLibreWxrLayer, getLibreWxrFrames, getLibreWxrLastPastTime, getLibreWxrDefaultIndex,
    setLibreWxrBaseTheme, readLibreWxrOptsFromUI, formatLibreWxrStatus, setRadarStatusMsg,
    updateForecastBadge
} from './radar_librewxr.js';

const IMGW_RADAR_BOUNDS = [[48.2985, 12.4411], [56.3277, 25.6641]];

let activeRadarSource = 'rv', radarTileLayer = null, radarHost = '';
let radarFrames = [], currentFrame = 0, animationTimer = null, imgwRadarOverlay = null, imgwFrames = [];

function getFramesForSource(src) {
    if (src === 'imgw') return imgwFrames;
    if (src === 'lwxr') return getLibreWxrFrames();
    return radarFrames;
}

function generateImgwRadarFrames() {
    const now = new Date(), frames = [], pad = n => String(n).padStart(2, '0');
    for (let i = 47; i >= 0; i--) {
        const d = new Date(now.getTime() - (i * 5 + 6) * 60000);
        d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 5) * 5, 0, 0);
        const ts = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
        const url = `https://danepubliczne.imgw.pl/pl/datastore/getfiledown/Oper/Polrad/Produkty/POLCOMP/COMPO_CMAX_250.comp.cmax/${ts}0000dBZ.cmax_echoOnly.png`;
        if (!frames.some(f => f.ts === ts)) frames.push({ ts, url, time: Math.floor(d.getTime() / 1000), label: fmtPlTime(d) });
    }
    return frames;
}

function renderImgwFrame(map, frame, opacity) {
    if (!imgwRadarOverlay) {
        imgwRadarOverlay = L.imageOverlay(frame.url, IMGW_RADAR_BOUNDS, { opacity, pane: 'radarPane' });
        imgwRadarOverlay.on('error', () => {
            if (activeRadarSource === 'imgw' && currentFrame > Math.max(0, imgwFrames.length - 4)) {
                syncSlider(imgwFrames.length, currentFrame - 1);
                showRadarFrame(map, currentFrame);
            }
        });
    } else {
        imgwRadarOverlay.setUrl(frame.url);
        imgwRadarOverlay.setOpacity(opacity);
    }
    if (window.MAP_LAYERS?.radar?.visible && !map.hasLayer(imgwRadarOverlay)) imgwRadarOverlay.addTo(map);
}

function renderRvFrame(map, frame, opacity) {
    const tileUrl = `${radarHost}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
    if (!radarTileLayer) {
        radarTileLayer = L.tileLayer(tileUrl, { opacity, pane: 'radarPane', maxZoom: 18, maxNativeZoom: 8 });
    } else {
        radarTileLayer.setUrl(tileUrl);
        radarTileLayer.setOpacity(opacity);
    }
    if (window.MAP_LAYERS?.radar?.visible && !map.hasLayer(radarTileLayer)) radarTileLayer.addTo(map);
}

function syncSlider(count, idx) {
    const slider = document.getElementById('rv-slider');
    if (slider && count > 0) {
        slider.max = count - 1;
        slider.value = idx;
        currentFrame = idx;
    }
}

export function showRadarFrame(map, index) {
    currentFrame = parseInt(index, 10) || 0;
    const timeEl = document.getElementById('rv-time');
    const opacity = (window.MAP_LAYERS?.radar?.opacity ?? 68) / 100.0;
    const frame = getFramesForSource(activeRadarSource)[currentFrame];
    if (!frame) return;

    updateForecastBadge(frame);
    if (activeRadarSource === 'imgw') {
        renderImgwFrame(map, frame, opacity);
        if (timeEl) timeEl.textContent = frame.label;
        syncSatelliteTime(frame.time);
    } else if (activeRadarSource === 'lwxr') {
        renderLibreWxrFrame(map, frame, opacity);
        if (timeEl) timeEl.textContent = fmtPlTime(frame.time * 1000);
        // Satelita EUMETSAT nie ma przyszlych klatek, wiec w prognozie blokujemy go na ostatniej obserwacji
        syncSatelliteTime(frame.isNowcast ? getLibreWxrLastPastTime() : frame.time);
    } else {
        renderRvFrame(map, frame, opacity);
        if (timeEl) timeEl.textContent = fmtPlTime(frame.time * 1000);
        syncSatelliteTime(frame.time);
    }
}

async function loadRainViewer(map) {
    try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        radarHost = data.host || '';
        const past = (data.radar?.past || []).map(f => ({ ...f, isNowcast: false }));
        const nowc = (data.radar?.nowcast || []).map(f => ({ ...f, isNowcast: true }));
        radarFrames = past.concat(nowc);
        if (activeRadarSource === 'rv' && radarFrames.length) {
            syncSlider(radarFrames.length, Math.max(0, past.length - 1));
            showRadarFrame(map, currentFrame);
        }
    } catch (err) {
        console.error('Błąd pobierania RainViewer:', err);
        if (activeRadarSource === 'rv') setRadarStatusMsg('Błąd pobierania RainViewer.', true);
    }
}

async function activateLibreWxr(map) {
    setRadarStatusMsg('Ładowanie klatek LibreWXR...');
    try {
        const res = await loadLibreWxrFrames();
        if (activeRadarSource !== 'lwxr') return;
        if (!res.ok) { setRadarStatusMsg('Brak dostępnych klatek LibreWXR.', true); return; }
        syncSlider(res.frames.length, getLibreWxrDefaultIndex());
        showRadarFrame(map, currentFrame);
        setRadarStatusMsg(formatLibreWxrStatus(Boolean(window.MAP_LAYERS?.radar?.visible)));
    } catch (err) {
        console.error('Błąd pobierania LibreWXR:', err);
        if (activeRadarSource === 'lwxr') setRadarStatusMsg('Błąd połączenia z LibreWXR. Kliknij ponownie.', true);
    }
}

function setupRadarControls(map) {
    document.getElementById('rv-slider')?.addEventListener('input', e => showRadarFrame(map, parseInt(e.target.value, 10)));
    document.getElementById('rv-play-btn')?.addEventListener('click', e => {
        const btn = e.currentTarget;
        if (animationTimer) {
            clearInterval(animationTimer); animationTimer = null;
            btn.innerHTML = '<i data-lucide="play"></i>';
        } else {
            if (!window.MAP_LAYERS?.radar?.visible) { window.toggleLayer?.('radar', true); window.renderLayerManagerUI?.(); }
            const max = getFramesForSource(activeRadarSource).length;
            if (!max) return;
            btn.innerHTML = '<i data-lucide="pause"></i>';
            if (currentFrame >= max - 1) currentFrame = 0;
            animationTimer = setInterval(() => {
                const count = getFramesForSource(activeRadarSource).length;
                if (!count) return;
                syncSlider(count, currentFrame >= count - 1 ? 0 : currentFrame + 1);
                showRadarFrame(map, currentFrame);
            }, 500);
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });
}

function registerRadarGlobals(map) {
    window.getRadarSource = () => activeRadarSource;
    window.updateLibreWxrOptions = () => { readLibreWxrOptsFromUI(); if (activeRadarSource === 'lwxr') showRadarFrame(map, currentFrame); };
    window.setLibreWxrTheme = (isLight) => { setLibreWxrBaseTheme(isLight); if (activeRadarSource === 'lwxr') showRadarFrame(map, currentFrame); };
    window.onRadarVisibilityChange = (visible) => {
        if (activeRadarSource === 'lwxr') setRadarStatusMsg(formatLibreWxrStatus(visible));
    };
    window.setRadarSource = (src) => {
        activeRadarSource = src;
        ['imgw', 'rv', 'lwxr'].forEach(id => {
            const b = document.getElementById(`radar-src-${id}`);
            if (b) b.className = src === id ? 'btn btn-primary' : 'btn btn-ghost';
        });
        const lwxrBox = document.getElementById('lwxr-options');
        if (lwxrBox) lwxrBox.style.display = src === 'lwxr' ? 'flex' : 'none';
        if (src !== 'imgw' && imgwRadarOverlay && map.hasLayer(imgwRadarOverlay)) map.removeLayer(imgwRadarOverlay);
        if (src !== 'rv' && radarTileLayer && map.hasLayer(radarTileLayer)) map.removeLayer(radarTileLayer);
        if (src !== 'lwxr') { hideLibreWxrLayer(map); setRadarStatusMsg(''); }
        if (src === 'lwxr') { activateLibreWxr(map); } else {
            if (src === 'imgw') imgwFrames = generateImgwRadarFrames();
            const list = getFramesForSource(src);
            syncSlider(list.length, Math.max(0, list.length - 1));
            showRadarFrame(map, currentFrame);
        }
        window.renderLayerManagerUI?.();
    };
}

export function initRadar(map) {
    imgwFrames = generateImgwRadarFrames();
    const sat = initSatellite(map);
    applySavedLibreWxrUI();
    loadRainViewer(map);
    registerRadarGlobals(map);
    setupRadarControls(map);
    return {
        ...sat,
        getRadarOverlay: () => (activeRadarSource === 'imgw' ? imgwRadarOverlay : (activeRadarSource === 'lwxr' ? getLibreWxrLayer() : radarTileLayer))
    };
}
