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
    let color = '#22c55e', bg = 'rgba(34, 197, 94, 0.12)', border = 'rgba(34, 197, 94, 0.35)';

    if (diffMin > 45) {
        color = '#ef4444'; bg = 'rgba(239, 68, 68, 0.12)'; border = 'rgba(239, 68, 68, 0.35)';
    } else if (diffMin > 20) {
        color = '#eab308'; bg = 'rgba(234, 179, 8, 0.12)'; border = 'rgba(234, 179, 8, 0.35)';
    }

    badge.style.color = color;
    badge.style.background = bg;
    badge.style.borderColor = border;
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
}

const VALUE_STYLE_KEY = 'bmapa_value_style_v1';
const VALID_VALUE_STYLES = ['halo', 'pill', 'white'];

export function getValueStyle() {
    try {
        const saved = localStorage.getItem(VALUE_STYLE_KEY);
        if (VALID_VALUE_STYLES.includes(saved)) return saved;
    } catch (_) {}
    return 'halo';
}

function syncValueStyleButtons(mode) {
    VALID_VALUE_STYLES.forEach(m => {
        const btn = document.getElementById(`val-style-${m}`);
        if (btn) btn.className = m === mode ? 'btn btn-primary' : 'btn btn-ghost';
    });
}

export function setValueStyle(mode) {
    const next = VALID_VALUE_STYLES.includes(mode) ? mode : 'halo';
    try { localStorage.setItem(VALUE_STYLE_KEY, next); } catch (_) {}
    syncValueStyleButtons(next);
    window.renderIMGW?.();
}

// Renderuje wartosc pomiarowa w wybranym trybie: Wariant E (Smart Halo), Wariant B (kapsulka) lub klasyczna biel
export function formatStationValueHtml(txt, suffix, rgba) {
    const mode = getValueStyle();
    if (mode === 'white') return `<div class="st-val-white">${txt}${suffix}</div>`;

    const isZero = rgba[3] < 25;
    const lum = 0.299 * rgba[0] + 0.587 * rgba[1] + 0.114 * rgba[2];
    if (mode === 'pill') {
        if (isZero) return `<div class="st-val-pill st-val-zero">${txt}${suffix}</div>`;
        const fg = lum > 142 ? '#0f172a' : '#ffffff';
        return `<div class="st-val-pill" style="background:rgb(${rgba[0]},${rgba[1]},${rgba[2]});color:${fg};">${txt}${suffix}</div>`;
    }
    if (isZero) return `<div class="st-val-halo st-val-zero">${txt}${suffix}</div>`;
    const cls = lum < 75 ? 'st-val-halo st-val-halo-light' : 'st-val-halo';
    return `<div class="${cls}" style="color:rgb(${rgba[0]},${rgba[1]},${rgba[2]});">${txt}${suffix}</div>`;
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
