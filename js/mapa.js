// js/mapa.js
// Główny punkt wejścia aplikacji B-Mapa - orkiestracja modułów

import { initMap } from './map/core.js';
import { initGeoman } from './map/drawing.js';
import { initRadar } from './map/radar.js';
import { initLightning } from './map/blitzortung.js';
import { initBoundaries, initLayerManager } from './map/layers.js';
import { renderIMGW, updateIsoStepLabel } from './map/renderer.js';
import { initUIControls } from './map/ui.js';

let activeMapInstance = null;

export function initMapa() {
    const { map, basemaps } = initMap('premium-map');
    activeMapInstance = map;

    initGeoman(map);
    const radarComponents = initRadar(map);
    const boundariesGroup = initBoundaries(map);
    const lightningGroup = initLightning(map);

    initLayerManager(map, { ...radarComponents, boundariesGroup, lightningGroup });
    initUIControls(map);

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
