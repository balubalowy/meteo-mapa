// js/map/core.js
// Inicjalizacja instancji mapy Leaflet, pane'ów Z-Index oraz warstw bazowych

const MAJOR_CITIES = [
    { name: "Warszawa", lat: 52.2297, lon: 21.0122 },
    { name: "Kraków", lat: 50.0647, lon: 19.9450 },
    { name: "Łódź", lat: 51.7592, lon: 19.4560 },
    { name: "Wrocław", lat: 51.1079, lon: 17.0385 },
    { name: "Poznań", lat: 52.4064, lon: 16.9252 },
    { name: "Gdańsk", lat: 54.3520, lon: 18.6466 },
    { name: "Szczecin", lat: 53.4285, lon: 14.5528 },
    { name: "Bydgoszcz", lat: 53.1235, lon: 18.0084 },
    { name: "Lublin", lat: 51.2465, lon: 22.5684 },
    { name: "Białystok", lat: 53.1325, lon: 23.1688 },
    { name: "Katowice", lat: 50.2649, lon: 19.0238 },
    { name: "Rzeszów", lat: 50.0412, lon: 21.9991 },
    { name: "Olsztyn", lat: 53.7799, lon: 20.4942 },
    { name: "Kielce", lat: 50.8661, lon: 20.6286 },
    { name: "Opole", lat: 50.6711, lon: 17.9253 },
    { name: "Zielona Góra", lat: 51.9355, lon: 15.5062 },
    { name: "Toruń", lat: 53.0137, lon: 18.5984 },
    { name: "Gorzów Wlkp.", lat: 52.7368, lon: 15.2288 }
];

// Utworzenie dedykowanych pane'ów w celu rygorystycznej kontroli kolejności nakładania warstw
export function setupPanes(map) {
    const panesConfig = [
        { name: 'basePane', zIndex: 200, pointerEvents: 'auto' },
        { name: 'satellitePane', zIndex: 260, pointerEvents: 'auto' },
        { name: 'weatherPane', zIndex: 290, pointerEvents: 'auto' },
        { name: 'isobarsPane', zIndex: 305, pointerEvents: 'none' },
        { name: 'radarPane', zIndex: 320, pointerEvents: 'auto' },
        { name: 'lightningPane', zIndex: 350, pointerEvents: 'auto' },
        { name: 'drawingsPane', zIndex: 380, pointerEvents: 'auto' },
        { name: 'stationsPane', zIndex: 410, pointerEvents: 'auto' },
        { name: 'labelsPane', zIndex: 650, pointerEvents: 'none' }
    ];

    panesConfig.forEach(cfg => {
        map.createPane(cfg.name);
        const paneEl = map.getPane(cfg.name);
        paneEl.style.zIndex = cfg.zIndex;
        if (cfg.pointerEvents) paneEl.style.pointerEvents = cfg.pointerEvents;
    });
}

// Inicjalizacja etykiet miast z dostosowaniem kontrastu do jasnego/ciemnego podkładu
export function createCityLabelsGroup(map) {
    const group = L.layerGroup();

    function updateCityLabels(isLight) {
        group.clearLayers();
        const textCol = isLight ? '#0f172a' : '#ffffff';
        const shadowCol = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.95)';

        MAJOR_CITIES.forEach(city => {
            const icon = L.divIcon({
                className: 'custom-city-label',
                html: `<div style="font-weight: bold; font-size: 0.85rem; color: ${textCol}; text-shadow: 0 0 3px ${shadowCol}, 0 0 4px ${shadowCol}, 0 0 5px ${shadowCol}; white-space: nowrap; pointer-events: none;">${city.name}</div>`,
                iconSize: [80, 20],
                iconAnchor: [40, 10]
            });
            L.marker([city.lat, city.lon], { icon, interactive: false, pane: 'labelsPane' }).addTo(group);
        });
    }

    updateCityLabels(false);
    group.addTo(map);
    return { group, updateCityLabels };
}

// Rejestracja podkładów kartograficznych
export function setupBaseLayers(map) {
    const darkBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', { 
        maxZoom: 16, pane: 'basePane', attribution: 'Esri' 
    });
    const lightBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { 
        maxZoom: 16, pane: 'basePane', attribution: 'Esri' 
    });
    const hillshadeBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18, pane: 'basePane', attribution: 'Esri, Copernicus DEM'
    });
    const openTopoBase = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17, pane: 'basePane', attribution: 'OpenTopoMap'
    });
    const esriTopoBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19, pane: 'basePane', attribution: 'Esri World Topo'
    });

    const basemaps = {
        "Ciemny (Dark)": darkBase,
        "Jasny (Light)": lightBase,
        "Rzeźba terenu (Hillshade)": hillshadeBase,
        "Topograficzna (OpenTopo)": openTopoBase,
        "Fizyczna (World Topo)": esriTopoBase
    };

    darkBase.addTo(map);
    return basemaps;
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
        const nameLower = (e.name || '').toLowerCase();
        const isLight = nameLower.includes('jasny') || nameLower.includes('topo') || nameLower.includes('rzeźba');
        cityLabels.updateCityLabels(isLight);
        if (typeof window.updateBoundariesStyle === 'function') {
            window.updateBoundariesStyle(isLight);
        }
    });

    return { map, basemaps, cityLabels };
}
