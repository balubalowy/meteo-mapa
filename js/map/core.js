// js/map/core.js
// Inicjalizacja instancji mapy Leaflet, pane'ow Z-Index oraz podkladow kartograficznych

import { createCityLabelsGroup } from './cities.js';

// Utworzenie dedykowanych pane'ow w celu rygorystycznej kontroli kolejnosci nakladania warstw
export function setupPanes(map) {
    const panesConfig = [
        { name: 'basePane', zIndex: 200, pointerEvents: 'auto' },
        { name: 'satellitePane', zIndex: 250, pointerEvents: 'auto' },
        { name: 'weatherPane', zIndex: 280, pointerEvents: 'auto' },
        { name: 'radarPane', zIndex: 310, pointerEvents: 'auto' },
        { name: 'isobarsPane', zIndex: 365, pointerEvents: 'none' },
        { name: 'drawingsPane', zIndex: 380, pointerEvents: 'auto' },
        { name: 'boundariesPane', zIndex: 395, pointerEvents: 'none' },
        { name: 'labelsPane', zIndex: 415, pointerEvents: 'none' },
        { name: 'stationsPane', zIndex: 420, pointerEvents: 'auto' }
    ];

    panesConfig.forEach(cfg => {
        map.createPane(cfg.name);
        const paneEl = map.getPane(cfg.name);
        paneEl.style.zIndex = cfg.zIndex;
        if (cfg.pointerEvents) paneEl.style.pointerEvents = cfg.pointerEvents;
    });
}

// Rejestracja podkladow kartograficznych (Esri ArcGIS Online, OpenStreetMap, OpenTopoMap)
export function setupBaseLayers(map) {
    const darkBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxNativeZoom: 16, maxZoom: 18, pane: 'basePane', attribution: 'Esri'
    });
    const hillshadeDarkBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade_Dark/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18, pane: 'basePane', attribution: 'Esri, Copernicus DEM'
    });
    const lightBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxNativeZoom: 16, maxZoom: 18, pane: 'basePane', attribution: 'Esri'
    });
    const hillshadeBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18, pane: 'basePane', attribution: 'Esri, Copernicus DEM'
    });
    const osmBase = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, pane: 'basePane', attribution: '&copy; OpenStreetMap contributors'
    });
    const openTopoBase = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17, pane: 'basePane', attribution: 'OpenTopoMap (&copy; OSM)'
    });
    const esriTopoBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19, pane: 'basePane', attribution: 'Esri World Topo'
    });
    const imageryBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19, pane: 'basePane', attribution: 'Esri World Imagery'
    });

    const basemaps = {
        'Ciemny (Dark)': darkBase,
        'Rzeźba ciemna (Hillshade Dark)': hillshadeDarkBase,
        'Jasny (Light)': lightBase,
        'Rzeźba terenu (Hillshade)': hillshadeBase,
        'OpenStreetMap': osmBase,
        'Topograficzna (OpenTopo)': openTopoBase,
        'Fizyczna (World Topo)': esriTopoBase,
        'Satelitarna (Imagery)': imageryBase
    };

    darkBase.addTo(map);
    return basemaps;
}

function isLightBasemap(name) {
    const lower = (name || '').toLowerCase();
    if (lower.includes('ciemny') || lower.includes('ciemna') || lower.includes('dark') || lower.includes('satelitarn')) {
        return false;
    }
    return lower.includes('jasny') || lower.includes('topo') || lower.includes('rzeźba') || lower.includes('openstreetmap') || lower.includes('fizyczna');
}

export function initMap(containerId = 'premium-map') {
    if (window.premiumMap) window.premiumMap.remove();

    const map = L.map(containerId, { center: [51.9194, 19.1451], zoom: 6, zoomControl: false });
    window.premiumMap = map;
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    setupPanes(map);
    const basemaps = setupBaseLayers(map);
    const cityLabels = createCityLabelsGroup(map);
    window.cityLabelsGroup = cityLabels.group;

    map.on('baselayerchange', (e) => {
        const isLight = isLightBasemap(e.name);
        cityLabels.updateCityLabels(isLight);
        if (typeof window.updateBoundariesStyle === 'function') {
            window.updateBoundariesStyle(isLight);
        }
        window.setLibreWxrTheme?.(isLight);
    });

    return { map, basemaps, cityLabels };
}
