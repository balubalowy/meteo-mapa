// js/map/renderer.js
// Renderowanie stacji, etykiet, wektorów wiatru oraz nakładki interpolacji IDW

import { DEFAULT_ZMIENNE, generateIDWImage, getColorRGBA } from './interpolation.js';
import { getIMGWLiveData } from './stations.js';
import { updateDelayBadge } from './ui.js';

const ISO_STEPS = ['auto', 1, 2, 5, 10, 20, 30, 40, 50, 100, 200, 500, 1000];

let imgwLayerGroup = null;
let idwOverlay = null;

export function updateIsoStepLabel(sliderVal) {
    const idx = parseInt(sliderVal, 10);
    const step = ISO_STEPS[idx] ?? 'auto';
    const labelEl = document.getElementById('iso-step-val');
    if (!labelEl) return;
    if (step === 'auto') {
        const curZ = document.getElementById('imgw-zmienna')?.value || 'temp';
        const defStep = DEFAULT_ZMIENNE[curZ]?.step || 2;
        labelEl.textContent = `Auto (${defStep})`;
    } else {
        labelEl.textContent = `${step}`;
    }
}

function resolveOkres() {
    const okresSelect = document.getElementById('imgw-okres');
    const okres = okresSelect?.value || 'now';
    const historyReady = typeof window.getIMGWHistoryData === 'function' && typeof window.isHistoryDbEnabled === 'function' && window.isHistoryDbEnabled();
    if (okres !== 'now' && !historyReady) {
        if (okresSelect) okresSelect.value = 'now';
        return 'now';
    }
    return okres;
}

function buildMarkerHtml(idx, data, cfg, ptColor) {
    const isForecast = data.pt_types?.[idx] === 'PROGNOZA';
    const suffix = isForecast ? '<span style="font-size:0.65rem; color:#60a5fa; vertical-align:top; margin-left:1px;">~</span>' : '';
    let html = cfg.showTxt ? `<div style="color: white; text-shadow: 0 0 3px black, 0 0 3px black; font-weight: bold;">${data.pt_txts[idx]}${suffix}</div>` : '';

    const isWind = (cfg.zmienna === 'wiatr' || cfg.zmienna === 'wiatr_sr');
    const hasDir = !isNaN(data.pt_dirs?.[idx]) && data.pt_dirs?.[idx] !== null;
    if (isWind && !cfg.okres.startsWith('trend') && hasDir) {
        const dir = data.pt_dirs[idx] + 180;
        html += `<div style="width:18px; height:18px; margin:2px auto; transform: rotate(${dir}deg); color: ${ptColor}; text-shadow: 0 0 2px black;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 0px 1px black);">
                <line x1="12" y1="21" x2="12" y2="3"></line>
                <polyline points="5 10 12 3 19 10"></polyline>
            </svg>
        </div>`;
    } else if (cfg.showPt) {
        const border = isForecast ? '2px dashed #60a5fa' : '1px solid rgba(255,255,255,0.7)';
        html += `<div style="width:10px;height:10px;background:${ptColor};border-radius:50%;margin:2px auto;box-shadow:0 0 2px black; border:${border};"></div>`;
    }
    return html;
}

function renderMarkers(data, cfg) {
    for (let i = 0; i < data.pt_lats.length; i++) {
        if (data.pt_foreign?.[i] && !cfg.showForeign) continue;

        const val = data.pt_vals[i];
        const ptColor = `rgb(${getColorRGBA(val, cfg.scale, cfg.cmin, cfg.cmax).slice(0, 3).join(',')})`;
        const html = buildMarkerHtml(i, data, cfg, ptColor);

        const icon = L.divIcon({ className: 'imgw-station-marker', html, iconSize: [30, 25], iconAnchor: [15, 12] });
        L.marker([data.pt_lats[i], data.pt_lons[i]], { icon, pane: 'stationsPane' })
            .bindTooltip(data.pt_hov[i])
            .addTo(imgwLayerGroup);
    }
}

function filterIdwPoints(data, showForeign) {
    if (showForeign || !data.pt_foreign) {
        return { lats: data.pt_lats, lons: data.pt_lons, vals: data.pt_vals };
    }
    const lats = [], lons = [], vals = [];
    for (let i = 0; i < data.pt_lats.length; i++) {
        if (!data.pt_foreign[i]) {
            lats.push(data.pt_lats[i]);
            lons.push(data.pt_lons[i]);
            vals.push(data.pt_vals[i]);
        }
    }
    return { lats, lons, vals };
}

function getIdwBounds(hasForeign) {
    return {
        geoBounds: hasForeign ? { minLat: 47.0, maxLat: 56.5, minLon: 11.0, maxLon: 27.5 } : { minLat: 48.5, maxLat: 55.5, minLon: 13.5, maxLon: 24.5 },
        layerBounds: hasForeign ? [[47.0, 11.0], [56.5, 27.5]] : [[48.5, 13.5], [55.5, 24.5]]
    };
}

async function fetchParamData(okres, zmienna, loadingEl) {
    if (okres === 'now') {
        const live = await getIMGWLiveData(zmienna);
        return live ? live[zmienna] : null;
    }
    if (typeof window.getIMGWHistoryData === 'function') {
        if (loadingEl) { loadingEl.style.display = 'flex'; loadingEl.innerHTML = '<i data-lucide="loader" class="spin"></i> Obliczanie trendu z bazy...'; }
        try {
            return await window.getIMGWHistoryData(zmienna, okres);
        } catch (_) {
            return null;
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }
    return null;
}

export async function renderIMGW(map) {
    if (!imgwLayerGroup) imgwLayerGroup = L.layerGroup().addTo(map);

    const okres = resolveOkres();
    const zmienna = document.getElementById('imgw-zmienna')?.value || 'temp';
    const data = await fetchParamData(okres, zmienna, document.getElementById('imgw-loading'));

    imgwLayerGroup.clearLayers();
    if (idwOverlay) { map.removeLayer(idwOverlay); idwOverlay = null; }
    if (!data?.pt_lats?.length) return;

    window.currentRenderedData = data;
    window.currentRenderedParam = zmienna;
    window.currentRenderedOkres = okres;

    const zInfo = DEFAULT_ZMIENNE[zmienna] || DEFAULT_ZMIENNE['temp'];
    const curParamName = zInfo.nazwa || zmienna;
    if (data.latestTimeMs > 0) {
        window.currentDisplayedTimeMs = data.latestTimeMs;
        window.currentDisplayedParamName = curParamName;
        updateDelayBadge(data.latestTimeMs, curParamName);
    }

    const showStations = window.MAP_LAYERS?.stations?.visible ?? true;
    const showInter = window.MAP_LAYERS?.inter?.visible ?? true;
    const showTxt = document.getElementById('chk-txt')?.checked ?? true;
    const showPt = document.getElementById('chk-pt')?.checked ?? false;
    const showForeign = document.getElementById('chk-foreign')?.checked ?? false;

    if (showStations && (showTxt || showPt)) {
        renderMarkers(data, { zmienna, okres, scale: zInfo.cscale, cmin: zInfo.cmin, cmax: zInfo.cmax, showTxt, showPt, showForeign });
    }

    if (showInter && data.pt_lats.length > 5) {
        const isoSlider = document.getElementById('iso-step');
        const rawStep = isoSlider ? (ISO_STEPS[parseInt(isoSlider.value, 10)] ?? 'auto') : 'auto';
        const stepVal = rawStep !== 'auto' ? parseFloat(rawStep) : (zInfo.step || 2.0);
        const showIso = document.getElementById('chk-iso')?.checked ?? false;
        const opacityBg = (window.MAP_LAYERS?.inter?.opacity ?? 70) / 100.0;

        const pts = filterIdwPoints(data, showForeign);
        const hasForeign = showForeign && data.pt_foreign?.some(Boolean);
        const { geoBounds, layerBounds } = getIdwBounds(hasForeign);

        const dataUrl = generateIDWImage(pts.lats, pts.lons, pts.vals, zInfo.cscale, zInfo.cmin, zInfo.cmax, showIso, stepVal, zInfo.unit, geoBounds, !hasForeign);
        idwOverlay = L.imageOverlay(dataUrl, layerBounds, { opacity: opacityBg, pane: 'weatherPane' }).addTo(map);
        window.idwOverlay = idwOverlay;
    }
}
