// js/mapa.js
// Główny silnik aplikacji B-Mapa - orkiestracja modułów

import { initMap } from './map/core.js';
import { initGeoman } from './map/drawing.js';
import { initRadar } from './map/radar.js';
import { initLightning } from './map/blitzortung.js';
import { initBoundaries, initLayerManager } from './map/layers.js';
import { renderIMGW, updateIsoStepLabel } from './map/renderer.js';
import { initUIControls } from './map/ui.js';

window.initMapa = function() {
    setTimeout(() => {
        const { map, basemaps } = initMap('premium-map');
        initGeoman(map);

        const radarComponents = initRadar(map);
        const boundariesGroup = initBoundaries(map);
        const lightningGroup = initLightning(map);

        initLayerManager(map, {
            ...radarComponents,
            boundariesGroup,
            lightningGroup
        });

        initUIControls(map);

        window.renderIMGW = () => renderIMGW(map);
        window.updateIsoStepLabel = updateIsoStepLabel;

        L.control.layers(basemaps, {}, { position: 'topright' }).addTo(map);

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Pierwsze wyrenderowanie danych telemetrycznych
        window.renderIMGW();

        // Ponowne odświeżenie danych po zalogowaniu kontem z uprawnieniami
        window.addEventListener('bmeteo-authenticated', () => {
            setTimeout(() => {
                if (map) map.invalidateSize();
                window.renderIMGW();
            }, 250);
        });

        setTimeout(() => map.invalidateSize(), 500);
    }, 150);
};

// Automatyczny start mapy po załadowaniu drzewa DOM
document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    window.initMapa();
});
