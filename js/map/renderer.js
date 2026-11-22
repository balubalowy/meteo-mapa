// js/map/renderer.js
// Renderowanie stacji, etykiet, wektorow wiatru oraz nakladki interpolacji IDW i izobar

import { COLORSCALES, DEFAULT_ZMIENNE, generateIDWImage, generateIsobarsOverlay, getColorRGBA } from './interpolation.js';
import { getIMGWLiveData } from './stations.js';
import { updateDelayBadge, formatStationValueHtml } from './ui.js';

const ISO_STEPS = ['auto', 1, 2, 5, 10, 20, 30, 40, 50, 100, 200, 500, 1000];
const TREND_RANGES = {
    temp: { cscale: COLORSCALES.trend_temp, cmin: -4, cmax: 4, step: 0.5 },
    grunt: { cscale: COLORSCALES.trend_temp, cmin: -5, cmax: 5, step: 0.5 },
    rosy: { cscale: COLORSCALES.trend_temp, cmin: -4, cmax: 4, step: 0.5 },
    wilg: { cscale: COLORSCALES.trend_humidity, cmin: -25, cmax: 25, step: 5 },
    cisnienie: { cscale: COLORSCALES.trend_temp, cmin: -4, cmax: 4, step: 0.5 },
    wiatr: { cscale: COLORSCALES.trend_temp, cmin: -25, cmax: 25, step: 5 },
    wiatr_sr: { cscale: COLORSCALES.trend_temp, cmin: -20, cmax: 20, step: 5 }
};

let imgwLayerGroup = null, idwOverlay = null, isobarsOverlay = null, renderSeq = 0;

export function updateIsoStepLabel(sliderVal) {
    const step = ISO_STEPS[parseInt(sliderVal, 10)] ?? 'auto';
    const labelEl = document.getElementById('iso-step-val');
    if (!labelEl) return;
    if (step === 'auto') {
        const zm = document.getElementById('imgw-zmienna')?.value || 'temp';
        const ok = document.getElementById('imgw-okres')?.value || 'now';
        labelEl.textContent = `Auto (${resolveScaleConfig(zm, ok).step || 2})`;
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

function resolveScaleConfig(zmienna, okres) {
    const base = DEFAULT_ZMIENNE[zmienna] || DEFAULT_ZMIENNE.temp;
    if (okres.startsWith('trend') && TREND_RANGES[zmienna]) {
        return { ...base, ...TREND_RANGES[zmienna] };
    }
    return base;
}

function buildMarkerHtml(idx, data, cfg, ptColor, rgba) {
    const isForecast = data.pt_types?.[idx] === 'PROGNOZA';
    const suffix = isForecast ? '<span style="font-size:0.65rem; color:#60a5fa; vertical-align:top; margin-left:1px;">~</span>' : '';
    let html = cfg.showTxt ? formatStationValueHtml(data.pt_txts[idx], suffix, rgba) : '';

    const isWind = (cfg.zmienna === 'wiatr' || cfg.zmienna === 'wiatr_sr');
    const hasDir = !isNaN(data.pt_dirs?.[idx]) && data.pt_dirs?.[idx] !== null && data.pt_vals[idx] > 0;
    if (cfg.showPt && isWind && !cfg.okres.startsWith('trend') && hasDir) {
        const dir = data.pt_dirs[idx] + 180;
        html += `<div style="width:18px; height:18px; flex-shrink:0; margin:2px auto; transform: rotate(${dir}deg); color: ${ptColor}; text-shadow: 0 0 2px black;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 0px 1px black);">
                <line x1="12" y1="21" x2="12" y2="3"></line>
                <polyline points="5 10 12 3 19 10"></polyline>
            </svg>
        </div>`;
    } else if (cfg.showPt) {
        const border = isForecast ? '2px dashed #60a5fa' : '1px solid rgba(255,255,255,0.75)';
        html += `<div style="width:9px;height:9px;flex-shrink:0;background:${ptColor};border-radius:50%;margin:2px auto;box-shadow:0 0 2px black; border:${border};"></div>`;
    }
    return html;
}

function renderMarkers(data, cfg) {
    for (let i = 0; i < data.pt_lats.length; i++) {
        if (data.pt_foreign?.[i] && !cfg.showForeign) continue;

        const val = data.pt_vals[i];
        const rgba = getColorRGBA(val, cfg.scale, cfg.cmin, cfg.cmax);
        // Dla wartosci zerowych/przezroczystych (np. brak sniegu, cisza) kropka stacji pozostaje subtelnie widoczna
        const ptColor = rgba[3] < 25 ? 'rgba(203,213,225,0.65)' : `rgb(${rgba[0]},${rgba[1]},${rgba[2]})`;
        const html = buildMarkerHtml(i, data, cfg, ptColor, rgba);

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
    if (typeof window.getIMGWHistoryData !== 'function') return null;
    if (loadingEl) { loadingEl.style.display = 'flex'; loadingEl.innerHTML = '<i data-lucide="loader" class="spin"></i> Obliczanie trendu z bazy...'; }
    try { return await window.getIMGWHistoryData(zmienna, okres); }
    catch (_) { return null; }
    finally { if (loadingEl) loadingEl.style.display = 'none'; }
}

async function renderIsobarsOverlay(map, showForeign, seq) {
    try {
        const live = await getIMGWLiveData('cisnienie');
        if (seq !== renderSeq) return;
        const pData = live?.cisnienie;
        if (!pData?.pt_lats?.length || pData.pt_lats.length < 5) return;
        const pts = filterIdwPoints(pData, showForeign);
        const hasForeign = showForeign && pData.pt_foreign?.some(Boolean);
        const { geoBounds, layerBounds } = getIdwBounds(hasForeign);
        const dataUrl = generateIsobarsOverlay(pts.lats, pts.lons, pts.vals, geoBounds, !hasForeign, 2.0);
        isobarsOverlay = L.imageOverlay(dataUrl, layerBounds, { opacity: 0.95, pane: 'isobarsPane' }).addTo(map);
        window.isobarsOverlay = isobarsOverlay;
    } catch (err) {
        console.error('Błąd izobar:', err);
    }
}

export async function renderIMGW(map) {
    if (!imgwLayerGroup) imgwLayerGroup = L.layerGroup([], { attribution: 'Dane IMGW-PIB (przetworzone)' }).addTo(map);
    const seq = ++renderSeq;
    const okres = resolveOkres(), zmienna = document.getElementById('imgw-zmienna')?.value || 'temp';
    const data = await fetchParamData(okres, zmienna, document.getElementById('imgw-loading'));
    if (seq !== renderSeq) return;

    imgwLayerGroup.clearLayers();
    if (idwOverlay) { map.removeLayer(idwOverlay); idwOverlay = null; window.idwOverlay = null; }
    if (isobarsOverlay) { map.removeLayer(isobarsOverlay); isobarsOverlay = null; window.isobarsOverlay = null; }
    window.currentRenderedParam = zmienna; window.currentRenderedOkres = okres;
    if (!data?.pt_lats?.length) {
        window.currentRenderedData = null; window.currentDisplayedTimeMs = 0;
        updateDelayBadge(0, zmienna); window.updateExportMetaBadge?.(null); window.refreshCityLabels?.();
        return;
    }

    window.currentRenderedData = data;
    window.updateExportMetaBadge?.(data);
    window.refreshCityLabels?.();

    const zInfo = resolveScaleConfig(zmienna, okres);
    const curParamName = zInfo.nazwa || zmienna;
    window.currentDisplayedTimeMs = data.latestTimeMs > 0 ? data.latestTimeMs : 0;
    window.currentDisplayedParamName = curParamName;
    updateDelayBadge(window.currentDisplayedTimeMs, curParamName);

    const showInter = window.MAP_LAYERS?.inter?.visible ?? true;
    const showTxt = document.getElementById('chk-txt')?.checked ?? true;
    const showPt = document.getElementById('chk-pt')?.checked ?? true;
    const showForeign = document.getElementById('chk-foreign')?.checked ?? false;

    if (showTxt || showPt) {
        renderMarkers(data, { zmienna, okres, scale: zInfo.cscale, cmin: zInfo.cmin, cmax: zInfo.cmax, showTxt, showPt, showForeign });
    }

    if (showInter && data.pt_lats.length > 5) {
        const isoSlider = document.getElementById('iso-step');
        const rawStep = isoSlider ? (ISO_STEPS[parseInt(isoSlider.value, 10)] ?? 'auto') : 'auto';
        const stepVal = rawStep !== 'auto' ? parseFloat(rawStep) : (zInfo.step || 2.0);
        const showIso = document.getElementById('chk-iso')?.checked ?? false;
        const opacityBg = (window.MAP_LAYERS?.inter?.opacity ?? 88) / 100.0;

        const pts = filterIdwPoints(data, showForeign);
        const hasForeign = showForeign && data.pt_foreign?.some(Boolean);
        const { geoBounds, layerBounds } = getIdwBounds(hasForeign);

        const dataUrl = generateIDWImage(pts.lats, pts.lons, pts.vals, zInfo.cscale, zInfo.cmin, zInfo.cmax, showIso, stepVal, '', geoBounds, !hasForeign);
        idwOverlay = L.imageOverlay(dataUrl, layerBounds, { opacity: opacityBg, pane: 'weatherPane' }).addTo(map);
        window.idwOverlay = idwOverlay;
    }

    if (document.getElementById('chk-isobars')?.checked) {
        await renderIsobarsOverlay(map, showForeign, seq);
    }
}
