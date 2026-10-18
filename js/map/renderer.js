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
    if (labelEl) {
        if (step === 'auto') {
            const zEl = document.getElementById('imgw-zmienna');
            const curZ = zEl?.value || 'temp';
            const defStep = DEFAULT_ZMIENNE[curZ]?.step || 2;
            labelEl.textContent = `Auto (${defStep})`;
        } else {
            labelEl.textContent = `${step}`;
        }
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

function renderMarkers(data, zmienna, okres, scale, cmin, cmax, showTxt, showPt, showForeign) {
    for (let i = 0; i < data.pt_lats.length; i++) {
        const isForeign = !!data.pt_foreign?.[i];
        if (isForeign && !showForeign) continue;

        const val = data.pt_vals[i];
        const ptColor = `rgb(${getColorRGBA(val, scale, cmin, cmax).slice(0, 3).join(',')})`;

        let htmlContent = '';
        const isForecast = data.pt_types?.[i] === 'PROGNOZA';
        const forecastSuffix = isForecast ? '<span style="font-size:0.65rem; color:#60a5fa; vertical-align:top; margin-left:1px;">~</span>' : '';
        if (showTxt) {
            htmlContent += `<div style="color: white; text-shadow: 0 0 3px black, 0 0 3px black; font-weight: bold;">${data.pt_txts[i]}${forecastSuffix}</div>`;
        }

        const isWind = (zmienna === 'wiatr' || zmienna === 'wiatr_sr');
        if (isWind && !okres.startsWith('trend') && !isNaN(data.pt_dirs?.[i]) && data.pt_dirs?.[i] !== null) {
            const dir = data.pt_dirs[i] + 180;
            htmlContent += `<div style="width:18px; height:18px; margin:2px auto; transform: rotate(${dir}deg); color: ${ptColor}; text-shadow: 0 0 2px black;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 0px 1px black);">
                    <line x1="12" y1="21" x2="12" y2="3"></line>
                    <polyline points="5 10 12 3 19 10"></polyline>
                </svg>
            </div>`;
        } else if (showPt) {
            const borderStyle = isForecast ? '2px dashed #60a5fa' : '1px solid rgba(255,255,255,0.7)';
            htmlContent += `<div style="width:10px;height:10px;background:${ptColor};border-radius:50%;margin:2px auto;box-shadow:0 0 2px black; border:${borderStyle};"></div>`;
        }

        const icon = L.divIcon({ className: 'imgw-station-marker', html: htmlContent, iconSize: [30, 25], iconAnchor: [15, 12] });
        L.marker([data.pt_lats[i], data.pt_lons[i]], { icon, pane: 'stationsPane' })
            .bindTooltip(data.pt_hov[i])
            .addTo(imgwLayerGroup);
    }
}

export async function renderIMGW(map) {
    if (!imgwLayerGroup) imgwLayerGroup = L.layerGroup().addTo(map);

    const okres = resolveOkres();
    const zmienna = document.getElementById('imgw-zmienna')?.value || 'temp';
    const loadingEl = document.getElementById('imgw-loading');

    let data = null;
    if (okres === 'now') {
        const live = await getIMGWLiveData(zmienna);
        if (live) data = live[zmienna];
    } else if (typeof window.getIMGWHistoryData === 'function') {
        if (loadingEl) { loadingEl.style.display = 'flex'; loadingEl.innerHTML = '<i data-lucide="loader" class="spin"></i> Obliczanie trendu z bazy...'; }
        try {
            data = await window.getIMGWHistoryData(zmienna, okres);
        } catch (_) {}
        if (loadingEl) loadingEl.style.display = 'none';
    }

    imgwLayerGroup.clearLayers();
    if (idwOverlay) { map.removeLayer(idwOverlay); idwOverlay = null; }
    if (!data?.pt_lats?.length) return;

    window.currentRenderedData = data;
    window.currentRenderedParam = zmienna;
    window.currentRenderedOkres = okres;

    const zInfo = DEFAULT_ZMIENNE[zmienna] || DEFAULT_ZMIENNE['temp'];
    const curParamName = zInfo.nazwa || zmienna;
    const paramTimeMs = data.latestTimeMs || 0;
    if (paramTimeMs > 0) {
        window.currentDisplayedTimeMs = paramTimeMs;
        window.currentDisplayedParamName = curParamName;
        updateDelayBadge(paramTimeMs, curParamName);
    }

    const scale = zInfo.cscale;
    const cmin = zInfo.cmin;
    const cmax = zInfo.cmax;

    const showStations = window.MAP_LAYERS?.stations?.visible ?? true;
    const showInter = window.MAP_LAYERS?.inter?.visible ?? true;
    const showTxt = document.getElementById('chk-txt')?.checked ?? true;
    const showPt = document.getElementById('chk-pt')?.checked ?? false;
    const showIso = document.getElementById('chk-iso')?.checked ?? false;
    const showForeign = document.getElementById('chk-foreign')?.checked ?? false;
    const opacityBg = (window.MAP_LAYERS?.inter?.opacity ?? 70) / 100.0;

    if (showStations && (showTxt || showPt)) {
        renderMarkers(data, zmienna, okres, scale, cmin, cmax, showTxt, showPt, showForeign);
    }

    if (showInter && data.pt_lats.length > 5) {
        const isoSlider = document.getElementById('iso-step');
        const rawStep = isoSlider ? (ISO_STEPS[parseInt(isoSlider.value, 10)] ?? 'auto') : 'auto';
        const stepVal = rawStep !== 'auto' ? parseFloat(rawStep) : (zInfo.step || 2.0);

        let idwLats = data.pt_lats;
        let idwLons = data.pt_lons;
        let idwVals = data.pt_vals;

        if (!showForeign && data.pt_foreign) {
            idwLats = []; idwLons = []; idwVals = [];
            for (let i = 0; i < data.pt_lats.length; i++) {
                if (!data.pt_foreign[i]) {
                    idwLats.push(data.pt_lats[i]);
                    idwLons.push(data.pt_lons[i]);
                    idwVals.push(data.pt_vals[i]);
                }
            }
        }

        const hasForeign = showForeign && data.pt_foreign?.some(Boolean);
        const geoBounds = hasForeign ? { minLat: 47.0, maxLat: 56.5, minLon: 11.0, maxLon: 27.5 } : { minLat: 48.5, maxLat: 55.5, minLon: 13.5, maxLon: 24.5 };
        const bounds = hasForeign ? [[47.0, 11.0], [56.5, 27.5]] : [[48.5, 13.5], [55.5, 24.5]];

        const dataUrl = generateIDWImage(idwLats, idwLons, idwVals, scale, cmin, cmax, showIso, stepVal, zInfo.unit, geoBounds, !hasForeign);
        idwOverlay = L.imageOverlay(dataUrl, bounds, { opacity: opacityBg, pane: 'weatherPane' }).addTo(map);
        window.idwOverlay = idwOverlay;
    }
}
