// js/map/radar.js
// Kontroler osi czasu i animacji radaru LibreWXR (https://librewxr.net, CC BY 4.0)
// oraz synchronizacja warstwy satelitarnej EUMETSAT WMS (satellite.js).

import { fmtPlTime } from './stations.js';
import { initSatellite, syncSatelliteTime } from './satellite.js';
import {
    applySavedLibreWxrUI, loadLibreWxrFrames, renderLibreWxrFrame,
    getLibreWxrLayer, getLibreWxrFrames, getLibreWxrLastPastTime, getLibreWxrDefaultIndex,
    setLibreWxrBaseTheme, readLibreWxrOptsFromUI, setQuickLightning, formatLibreWxrStatus,
    setRadarStatusMsg, updateForecastBadge
} from './radar_librewxr.js';

let currentFrame = 0;
let animationTimer = null;

function syncSlider(count, idx) {
    const slider = document.getElementById('rv-slider');
    if (slider && count > 0) {
        slider.max = count - 1;
        slider.value = idx;
        currentFrame = idx;
    }
}

export function showRadarFrame(map, index) {
    const frames = getLibreWxrFrames();
    if (!frames.length) return;
    currentFrame = Math.min(Math.max(parseInt(index, 10) || 0, 0), frames.length - 1);
    const frame = frames[currentFrame];
    const opacity = (window.MAP_LAYERS?.radar?.opacity ?? 68) / 100.0;

    renderLibreWxrFrame(map, frame, opacity);
    updateForecastBadge(frame);
    const timeEl = document.getElementById('rv-time');
    if (timeEl) timeEl.textContent = fmtPlTime(frame.time * 1000);
    // Satelita EUMETSAT nie ma przyszlych klatek, wiec w nowcastingu blokujemy go na ostatniej obserwacji
    syncSatelliteTime(frame.isNowcast ? getLibreWxrLastPastTime() : frame.time);
}

async function refreshLibreWxr(map, force = false) {
    setRadarStatusMsg('Ładowanie klatek LibreWXR...');
    try {
        const res = await loadLibreWxrFrames(force);
        if (!res.ok) {
            setRadarStatusMsg('Brak dostępnych klatek LibreWXR.', true);
            return;
        }
        syncSlider(res.frames.length, getLibreWxrDefaultIndex());
        showRadarFrame(map, currentFrame);
        setRadarStatusMsg(formatLibreWxrStatus(Boolean(window.MAP_LAYERS?.radar?.visible)));
    } catch (err) {
        console.error('Błąd pobierania LibreWXR:', err);
        setRadarStatusMsg('Błąd połączenia z LibreWXR. Kliknij Play lub przełącz warstwę, aby ponowić.', true);
    }
}

function setupRadarControls(map) {
    document.getElementById('rv-slider')?.addEventListener('input', e => {
        showRadarFrame(map, parseInt(e.target.value, 10));
    });

    document.getElementById('rv-play-btn')?.addEventListener('click', async e => {
        const btn = e.currentTarget;
        if (animationTimer) {
            clearInterval(animationTimer);
            animationTimer = null;
            btn.innerHTML = '<i data-lucide="play"></i>';
        } else {
            if (!window.MAP_LAYERS?.radar?.visible) {
                window.toggleLayer?.('radar', true);
                window.renderLayerManagerUI?.();
            }
            if (!getLibreWxrFrames().length) await refreshLibreWxr(map, true);
            const max = getLibreWxrFrames().length;
            if (!max) return;
            btn.innerHTML = '<i data-lucide="pause"></i>';
            if (currentFrame >= max - 1) currentFrame = 0;
            animationTimer = setInterval(() => {
                const count = getLibreWxrFrames().length;
                if (!count) return;
                syncSlider(count, currentFrame >= count - 1 ? 0 : currentFrame + 1);
                showRadarFrame(map, currentFrame);
            }, 500);
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });
}

function syncRadarPanelVisibility(visible) {
    const chk = document.getElementById('chk-radar-quick');
    if (chk) chk.checked = Boolean(visible);
    document.getElementById('radar-controls-body')?.classList.toggle('sb-hidden', !visible);
}

function registerRadarGlobals(map) {
    window.updateLibreWxrOptions = () => {
        readLibreWxrOptsFromUI();
        showRadarFrame(map, currentFrame);
    };
    window.toggleQuickLightning = (enabled) => {
        setQuickLightning(enabled);
        showRadarFrame(map, currentFrame);
    };
    window.setLibreWxrTheme = (isLight) => {
        setLibreWxrBaseTheme(isLight);
        showRadarFrame(map, currentFrame);
    };
    window.onRadarVisibilityChange = (visible) => {
        syncRadarPanelVisibility(visible);
        if (visible && !getLibreWxrFrames().length) {
            refreshLibreWxr(map, true);
            return;
        }
        setRadarStatusMsg(formatLibreWxrStatus(visible));
    };
}

export function initRadar(map) {
    const sat = initSatellite(map);
    applySavedLibreWxrUI();
    registerRadarGlobals(map);
    setupRadarControls(map);
    refreshLibreWxr(map);

    return {
        ...sat,
        getRadarOverlay: () => getLibreWxrLayer()
    };
}
