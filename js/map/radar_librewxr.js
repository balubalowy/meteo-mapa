// js/map/radar_librewxr.js
// Zrodlo: LibreWXR Public Weather Maps API (CC BY 4.0) - https://librewxr.net
// Endpoint katalogu klatek: https://api.librewxr.net/public/weather-maps.json

const LIBREWXR_API_URL = 'https://api.librewxr.net/public/weather-maps.json';
const CACHE_TTL_MS = 300000;
const STORAGE_KEY = 'bmapa_lwxr_opts_v1';
const DEFAULT_OPTS = { color: '10', arrows: false, cells: false, lightning: '', snow: true };

let apiHost = 'https://api.librewxr.net';
let frames = [];
let nowcastStartIndex = -1;
let lastPastTimeSec = null;
let tileLayer = null;
let isLightBase = false;
let lastFetchMs = 0;

function readSavedOpts() {
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return { ...DEFAULT_OPTS, ...raw };
    } catch (_) {
        return { ...DEFAULT_OPTS };
    }
}

function saveOpts(opts) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(opts));
    } catch (_) {}
}

export function applySavedLibreWxrUI() {
    const opts = readSavedOpts();
    const colorEl = document.getElementById('lwxr-color');
    const lightEl = document.getElementById('lwxr-lightning');
    const arrowsEl = document.getElementById('lwxr-arrows');
    const cellsEl = document.getElementById('lwxr-cells');
    const snowEl = document.getElementById('lwxr-snow');
    if (colorEl) colorEl.value = String(opts.color);
    if (lightEl) lightEl.value = String(opts.lightning || '');
    if (arrowsEl) arrowsEl.checked = Boolean(opts.arrows);
    if (cellsEl) cellsEl.checked = Boolean(opts.cells);
    if (snowEl) snowEl.checked = Boolean(opts.snow);
}

export function readLibreWxrOptsFromUI() {
    const opts = {
        color: document.getElementById('lwxr-color')?.value || DEFAULT_OPTS.color,
        arrows: Boolean(document.getElementById('lwxr-arrows')?.checked),
        cells: Boolean(document.getElementById('lwxr-cells')?.checked),
        lightning: document.getElementById('lwxr-lightning')?.value || '',
        snow: document.getElementById('lwxr-snow')?.checked ?? true
    };
    saveOpts(opts);
    return opts;
}

function syncColorSchemeSelect(schemes) {
    const sel = document.getElementById('lwxr-color');
    if (!sel || !Array.isArray(schemes) || !schemes.length) return;
    const prev = sel.value || readSavedOpts().color;
    sel.innerHTML = schemes
        .map(s => `<option value="${s.id}">${s.id}: ${s.name}</option>`)
        .join('');
    sel.value = schemes.some(s => String(s.id) === String(prev)) ? String(prev) : DEFAULT_OPTS.color;
}

function buildLibreWxrFrames(data) {
    const past = Array.isArray(data?.radar?.past) ? data.radar.past : [];
    const nowcast = Array.isArray(data?.radar?.nowcast) ? data.radar.nowcast : [];
    const lastPast = past.length ? past[past.length - 1].time : null;
    lastPastTimeSec = lastPast;
    nowcastStartIndex = nowcast.length ? past.length : -1;

    const pastItems = past.map(f => ({ time: f.time, path: f.path, isNowcast: false, offsetMin: 0 }));
    const nowcastItems = nowcast.map(f => ({
        time: f.time,
        path: f.path,
        isNowcast: true,
        offsetMin: lastPast ? Math.round((f.time - lastPast) / 60) : 0
    }));
    return pastItems.concat(nowcastItems);
}

// Pobiera katalog klatek LibreWXR (archiwum + nowcasting +60 min) z cache 5 min
export async function loadLibreWxrFrames(force = false) {
    const now = Date.now();
    if (!force && frames.length && (now - lastFetchMs < CACHE_TTL_MS)) {
        return { ok: true, frames };
    }
    const res = await fetch(LIBREWXR_API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    apiHost = data?.host || 'https://api.librewxr.net';
    syncColorSchemeSelect(data?.radar?.colorSchemes);
    frames = buildLibreWxrFrames(data);
    lastFetchMs = now;
    return { ok: frames.length > 0, frames };
}

export function buildLibreWxrTileUrl(frame) {
    const opts = readLibreWxrOptsFromUI();
    const theme = isLightBase ? 'dark' : 'light';
    const snowFlag = opts.snow ? 1 : 0;
    const params = [];
    if (opts.arrows) params.push(`arrows=${theme}`);
    if (opts.cells) params.push(`cells=${theme}`);
    if (opts.lightning) params.push(`lightning=${encodeURIComponent(opts.lightning)}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return `${apiHost}${frame.path}/256/{z}/{x}/{y}/${opts.color}/1_${snowFlag}.png${qs}`;
}

export function renderLibreWxrFrame(map, frame, opacity) {
    const tileUrl = buildLibreWxrTileUrl(frame);
    if (!tileLayer) {
        tileLayer = L.tileLayer(tileUrl, {
            opacity,
            pane: 'radarPane',
            maxZoom: 18,
            maxNativeZoom: 12,
            attribution: 'LibreWXR / EUMETNET OPERA (CC BY 4.0)'
        });
    } else {
        tileLayer.setUrl(tileUrl);
        tileLayer.setOpacity(opacity);
    }
    if (window.MAP_LAYERS?.radar?.visible && !map.hasLayer(tileLayer)) {
        tileLayer.addTo(map);
    }
}

export function hideLibreWxrLayer(map) {
    if (tileLayer && map.hasLayer(tileLayer)) map.removeLayer(tileLayer);
}

export function getLibreWxrLayer() { return tileLayer; }
export function getLibreWxrFrames() { return frames; }
export function getLibreWxrLastPastTime() { return lastPastTimeSec; }

// Domyslnie ustawia suwak na ostatnia klatke obserwowana (na prawo od niej zaczyna sie prognoza +60 min)
export function getLibreWxrDefaultIndex() {
    if (!frames.length) return 0;
    return nowcastStartIndex > 0 ? nowcastStartIndex - 1 : frames.length - 1;
}

export function setLibreWxrBaseTheme(isLight) {
    isLightBase = Boolean(isLight);
}

export function formatLibreWxrStatus(isVisible) {
    if (!frames.length) return '';
    if (!isVisible) return 'Warstwa Radar wyłączona - włącz ją w sekcji Warstwy.';
    const nowcCount = frames.filter(f => f.isNowcast).length;
    const pastCount = frames.length - nowcCount;
    return `Archiwum: ${pastCount} klatek | Prognoza: +${nowcCount * 10} min`;
}

export function setRadarStatusMsg(text, isError = false) {
    const el = document.getElementById('radar-status-msg');
    if (!el) return;
    el.textContent = text || '';
    el.style.display = text ? 'block' : 'none';
    el.classList.toggle('is-error', Boolean(isError));
}

export function updateForecastBadge(frame) {
    const badge = document.getElementById('rv-forecast-badge');
    const slider = document.getElementById('rv-slider');
    const isNowcast = Boolean(frame?.isNowcast);
    if (badge) {
        badge.style.display = isNowcast ? 'inline-flex' : 'none';
        badge.textContent = frame?.offsetMin ? `PROGNOZA +${frame.offsetMin}m` : 'PROGNOZA';
    }
    if (slider) slider.classList.toggle('slider-nowcast', isNowcast);
}
