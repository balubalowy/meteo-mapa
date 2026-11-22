// js/mapa.js
// Glowny punkt wejscia aplikacji B-Mapa - orkiestracja modulow

import { initMap } from './map/core.js';
import { initGeoman } from './map/drawing.js';
import { initRadar } from './map/radar.js';
import { initBoundaries, initLayerManager } from './map/layers.js';
import { renderIMGW, updateIsoStepLabel } from './map/renderer.js';
import { initUIControls } from './map/ui.js';

let activeMapInstance = null;

function setupStaleSnowAutoRefresh() {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible' || !window.isSnowCacheStale?.()) return;
        window.invalidateSnowCache?.();
        window.BMapaApi?.clearLiveCache?.();
        const param = document.getElementById('imgw-zmienna')?.value;
        if (param === 'snieg' || param === 'snieg_swiezy') window.renderIMGW?.();
    });
}

export function initMapa() {
    const { map, basemaps } = initMap('premium-map');
    activeMapInstance = map;

    initGeoman(map);
    const radarComponents = initRadar(map);
    const boundariesGroup = initBoundaries(map);

    initLayerManager(map, { ...radarComponents, boundariesGroup });
    initUIControls(map);
    setupStaleSnowAutoRefresh();

    window.renderIMGW = () => renderIMGW(map);
    window.updateIsoStepLabel = updateIsoStepLabel;

    L.control.layers(basemaps, {}, { position: 'topright' }).addTo(map);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    window.renderIMGW();

    window.addEventListener('bmeteo-authenticated', () => {
        if (activeMapInstance) activeMapInstance.invalidateSize();
        window.renderIMGW();
    });

    requestAnimationFrame(() => map.invalidateSize());
}

window.initMapa = initMapa;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMapa);
} else {
    initMapa();
}
