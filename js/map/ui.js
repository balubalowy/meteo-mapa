// js/map/ui.js
// Obsługa interfejsu użytkownika: panel boczny, pełny ekran i wskaźnik opóźnienia danych

import { fmtPlTime } from './stations.js';

export function updateDelayBadge(latestTimeMs, paramName) {
    const badge = document.getElementById('map-delay-badge');
    if (!badge) return;
    if (!latestTimeMs || latestTimeMs <= 0) {
        badge.style.display = 'none';
        return;
    }
    badge.style.display = 'inline-flex';

    const diffMin = Math.round(Math.max(0, Date.now() - latestTimeMs) / 60000);
    badge.classList.toggle('is-stale', diffMin > 45);
    badge.textContent = `${diffMin} min temu`;
    badge.title = `Opóźnienie danych: ${paramName || 'obserwacja'}\nPomiar: ${fmtPlTime(latestTimeMs)}`;
}

export function initUIControls(map) {
    window.toggleMapFullscreen = () => {
        const container = document.querySelector('.map-dashboard-container');
        const fsBtn = document.getElementById('map-fs-btn');
        if (!container) return;

        const isFs = container.classList.toggle('map-fullscreen');
        if (fsBtn) {
            fsBtn.innerHTML = isFs
                ? '<i data-lucide="minimize" id="map-fs-icon" style="width: 16px; height: 16px;"></i>'
                : '<i data-lucide="maximize" id="map-fs-icon" style="width: 16px; height: 16px;"></i>';
        }

        if (isFs && container.requestFullscreen && !document.fullscreenElement) {
            container.requestFullscreen().catch(() => {});
        } else if (!isFs && document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
        setTimeout(() => map?.invalidateSize(), 150);
    };

    window.toggleMapSidebar = () => {
        const sidebar = document.getElementById('map-sidebar');
        const icon = document.getElementById('sidebar-toggle-icon');
        if (!sidebar) return;

        const isHidden = sidebar.classList.toggle('sidebar-collapsed');
        if (icon) icon.setAttribute('data-lucide', isHidden ? 'panel-left-open' : 'panel-left-close');
        if (typeof lucide !== 'undefined') lucide.createIcons();
        setTimeout(() => map?.invalidateSize(), 100);
    };

    if (window.innerWidth <= 768) {
        const mobileSidebar = document.getElementById('map-sidebar');
        const mobileIcon = document.getElementById('sidebar-toggle-icon');
        if (mobileSidebar) mobileSidebar.classList.add('sidebar-collapsed');
        if (mobileIcon) mobileIcon.setAttribute('data-lucide', 'panel-left-open');
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const container = document.querySelector('.map-dashboard-container');
            if (container?.classList.contains('map-fullscreen')) window.toggleMapFullscreen();
        }
    });

    document.addEventListener('fullscreenchange', () => {
        const container = document.querySelector('.map-dashboard-container');
        const fsBtn = document.getElementById('map-fs-btn');
        if (container && !document.fullscreenElement && container.classList.contains('map-fullscreen')) {
            container.classList.remove('map-fullscreen');
            if (fsBtn) fsBtn.innerHTML = '<i data-lucide="maximize" id="map-fs-icon" style="width: 16px; height: 16px;"></i>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
            setTimeout(() => map?.invalidateSize(), 150);
        }
    });

    setInterval(() => {
        if (window.currentDisplayedTimeMs) {
            updateDelayBadge(window.currentDisplayedTimeMs, window.currentDisplayedParamName);
        }
    }, 30000);

    syncValueStyleButtons(getValueStyle());
    syncIsoStepVisibility();
}

const VALUE_STYLE_KEY = 'bmapa_value_style_v2';
const VALID_VALUE_STYLES = ['pill', 'halo', 'white'];

export function getValueStyle() {
    try {
        const saved = localStorage.getItem(VALUE_STYLE_KEY);
        if (VALID_VALUE_STYLES.includes(saved)) return saved;
    } catch (_) {}
    return 'pill';
}

function syncValueStyleButtons(mode) {
    VALID_VALUE_STYLES.forEach(m => {
        const btn = document.getElementById(`val-style-${m}`);
        if (btn) btn.classList.toggle('is-active', m === mode);
    });
}

export function setValueStyle(mode) {
    const next = VALID_VALUE_STYLES.includes(mode) ? mode : 'pill';
    try { localStorage.setItem(VALUE_STYLE_KEY, next); } catch (_) {}
    syncValueStyleButtons(next);
    window.renderIMGW?.();
}

export function selectMapParam(param) {
    const input = document.getElementById('imgw-zmienna');
    if (input) input.value = param;
    document.querySelectorAll('.sb-param-btn').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.param === param);
    });
    const iso = document.getElementById('iso-step');
    if (iso && typeof window.updateIsoStepLabel === 'function') window.updateIsoStepLabel(iso.value);
    window.renderIMGW?.();
}

export function setStationProvider(provider) {
    const isRR = provider === 'rr';
    const rImgw = document.getElementById('provider-imgw');
    const rRr = document.getElementById('provider-rr');
    if (rImgw) rImgw.checked = !isRR;
    if (rRr) rRr.checked = isRR;
    document.getElementById('btn-prov-imgw')?.classList.toggle('is-active', !isRR);
    document.getElementById('btn-prov-rr')?.classList.toggle('is-active', isRR);
    window.renderIMGW?.();
}

export function syncIsoStepVisibility() {
    const show = Boolean(document.getElementById('chk-iso')?.checked);
    document.getElementById('iso-step-wrap')?.classList.toggle('sb-hidden', !show);
}

// Rozjasnia kolor cyfry o 38% w strone bieli, aby wyraznie odcinal sie od identycznego tla IDW
function liftTextColor([r, g, b]) {
    const mix = c => Math.round(c + (255 - c) * 0.38);
    return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

// Renderuje wartosc pomiarowa w wybranym trybie: Kapsulka (domyslna), Kolor (ostry obrys) lub Biale
export function formatStationValueHtml(txt, suffix, rgba) {
    const mode = getValueStyle();
    if (mode === 'white') return `<div class="st-val-white">${txt}${suffix}</div>`;

    const isZero = rgba[3] < 25;
    if (mode === 'pill') {
        if (isZero) return `<div class="st-val-pill st-val-zero">${txt}${suffix}</div>`;
        const lum = 0.299 * rgba[0] + 0.587 * rgba[1] + 0.114 * rgba[2];
        const fg = lum > 142 ? '#0f172a' : '#ffffff';
        return `<div class="st-val-pill" style="background:rgb(${rgba[0]},${rgba[1]},${rgba[2]});color:${fg};">${txt}${suffix}</div>`;
    }
    if (isZero) return `<div class="st-val-halo st-val-zero">${txt}${suffix}</div>`;
    return `<div class="st-val-halo" style="color:${liftTextColor(rgba)};">${txt}${suffix}</div>`;
}

export function updateCitiesVisibility() {
    const show = document.getElementById('chk-cities')?.checked ?? true;
    if (!window.cityLabelsGroup || !window.premiumMap) return;
    if (show && !window.premiumMap.hasLayer(window.cityLabelsGroup)) {
        window.premiumMap.addLayer(window.cityLabelsGroup);
    } else if (!show && window.premiumMap.hasLayer(window.cityLabelsGroup)) {
        window.premiumMap.removeLayer(window.cityLabelsGroup);
    }
    window.refreshCityLabels?.();
}
window.updateCitiesVisibility = updateCitiesVisibility;
window.setValueStyle = setValueStyle;
window.getValueStyle = getValueStyle;
window.selectMapParam = selectMapParam;
window.setStationProvider = setStationProvider;
window.syncIsoStepVisibility = syncIsoStepVisibility;
