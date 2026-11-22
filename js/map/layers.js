// js/map/layers.js
// Menedzer warstw rastrowych (Radar, Interpolacja, Satelita) oraz warstwa granic administracyjnych

export const DEFAULT_MAP_LAYERS = {
    radar:     { id: 'radar',     name: 'Radar', visible: false, opacity: 68, pane: 'radarPane' },
    inter:     { id: 'inter',     name: 'IDW', visible: true, opacity: 88, pane: 'weatherPane' },
    satellite: { id: 'satellite', name: 'Satelita', visible: true, opacity: 68, pane: 'satellitePane' }
};
export const DEFAULT_LAYER_ORDER = ['radar', 'inter', 'satellite'];

const STORAGE_LAYERS_KEY = 'meteo_map_layers_v7', STORAGE_ORDER_KEY = 'meteo_map_order_v7';
let boundariesLayerGroup = null, countriesGeoLayer = null, provincesGeoLayer = null, isCurrentThemeLight = false;

function getBoundaryColors(isLight) {
    return isLight
        ? { country: 'rgba(15, 23, 42, 0.90)', province: 'rgba(15, 23, 42, 0.72)', shadow: 'drop-shadow(0 0 1.2px rgba(255, 255, 255, 0.85))' }
        : { country: 'rgba(248, 250, 252, 0.92)', province: 'rgba(241, 245, 249, 0.78)', shadow: 'drop-shadow(0 0 1.3px rgba(2, 6, 23, 0.85))' };
}

export function initBoundaries(map) {
    const pane = map.getPane('boundariesPane') || map.createPane('boundariesPane');
    pane.style.zIndex = 395; pane.style.pointerEvents = 'none';
    pane.style.filter = getBoundaryColors(isCurrentThemeLight).shadow;
    boundariesLayerGroup = L.layerGroup([], { pane: 'boundariesPane' });

    const loadGeo = (url, weight, dash, isProv) => fetch(url).then(r => r.json()).then(data => {
        const cols = getBoundaryColors(isCurrentThemeLight);
        const style = { color: isProv ? cols.province : cols.country, weight, dashArray: dash || null, fill: false, interactive: false };
        const lyr = L.geoJSON(data, { pane: 'boundariesPane', style }).addTo(boundariesLayerGroup);
        if (isProv) provincesGeoLayer = lyr; else countriesGeoLayer = lyr;
    }).catch(err => console.error('Błąd granic:', err));

    // Granice panstw Eurostat GISCO 1:1M (ciagla linia) + wewnetrzne granice wojewodztw (wyrazna przerywana z kontrastowym cieniem)
    loadGeo('assets/geo/europe_countries.json', 1.7, null, false);
    loadGeo('assets/geo/wojewodztwa.geojson', 1.3, '5, 4', true);

    window.boundariesLayerGroup = boundariesLayerGroup;
    window.updateBoundariesStyle = (isLight) => {
        isCurrentThemeLight = Boolean(isLight);
        const cols = getBoundaryColors(isCurrentThemeLight);
        pane.style.filter = cols.shadow;
        countriesGeoLayer?.setStyle({ color: cols.country });
        provincesGeoLayer?.setStyle({ color: cols.province });
    };
    window.updateBoundariesVisibility = () => {
        const show = document.getElementById('chk-boundaries')?.checked ?? true;
        if (show && !map.hasLayer(boundariesLayerGroup)) map.addLayer(boundariesLayerGroup);
        if (!show && map.hasLayer(boundariesLayerGroup)) map.removeLayer(boundariesLayerGroup);
    };

    if (document.getElementById('chk-boundaries')?.checked ?? true) {
        boundariesLayerGroup.addTo(map);
    }
    return boundariesLayerGroup;
}

function loadSavedLayerState() {
    try {
        const savedLayers = JSON.parse(localStorage.getItem(STORAGE_LAYERS_KEY) || '{}');
        Object.keys(savedLayers).forEach(k => {
            if (window.MAP_LAYERS[k]) {
                window.MAP_LAYERS[k].visible = savedLayers[k].visible;
                window.MAP_LAYERS[k].opacity = savedLayers[k].opacity;
            }
        });
        const savedOrder = JSON.parse(localStorage.getItem(STORAGE_ORDER_KEY) || '[]');
        const validOrder = Array.isArray(savedOrder)
            && savedOrder.length === DEFAULT_LAYER_ORDER.length
            && DEFAULT_LAYER_ORDER.every(k => savedOrder.includes(k));
        if (validOrder) window.layerOrder = savedOrder;
    } catch (_) {}
}

function saveLayerState() {
    try {
        localStorage.setItem(STORAGE_LAYERS_KEY, JSON.stringify(window.MAP_LAYERS));
        localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(window.layerOrder));
    } catch (_) {}
}

const LAYER_TOGGLE_ACTIONS = {
    satellite: (map, comp, chk) => {
        const sLay = comp.getActiveSatelliteLayer?.();
        if (chk && sLay && !map.hasLayer(sLay)) map.addLayer(sLay);
        if (!chk) {
            if (comp.satelliteDayLayer && map.hasLayer(comp.satelliteDayLayer)) map.removeLayer(comp.satelliteDayLayer);
            if (comp.satelliteNightLayer && map.hasLayer(comp.satelliteNightLayer)) map.removeLayer(comp.satelliteNightLayer);
        }
    },
    radar: (map, comp, chk) => {
        window.onRadarVisibilityChange?.(chk);
        const overlay = comp.getRadarOverlay?.();
        if (!overlay) return;
        if (chk && !map.hasLayer(overlay)) map.addLayer(overlay);
        if (!chk && map.hasLayer(overlay)) map.removeLayer(overlay);
    },
    inter: () => { if (typeof window.renderIMGW === 'function') window.renderIMGW(); }
};

const LAYER_OPACITY_ACTIONS = {
    satellite: (comp, op) => { comp.satelliteDayLayer?.setOpacity(op); comp.satelliteNightLayer?.setOpacity(op); },
    radar: (comp, op) => { comp.getRadarOverlay?.()?.setOpacity(op); },
    inter: (comp, op) => { window.idwOverlay?.setOpacity(op); }
};

function renderLayerItem(key, idx, total) {
    const item = window.MAP_LAYERS[key];
    if (!item) return '';
    const isTop = idx === 0, isBottom = idx === total - 1;
    const isDay = (window.getSatelliteMode?.() || 'day') === 'day';
    const satRow = (key === 'satellite' && item.visible)
        ? `<div class="sb-sat-row"><span style="font-size:11px;color:#777;">Tryb</span><div class="sb-seg"><button type="button" class="${isDay ? 'is-active' : ''}" onclick="window.setSatelliteMode('day')">Dzień</button><button type="button" class="${!isDay ? 'is-active' : ''}" onclick="window.setSatelliteMode('night')">Noc</button></div></div>`
        : '';

    return `<div>
        <div class="sb-layer-line">
            <label class="sb-inline-chk"><input type="checkbox" ${item.visible ? 'checked' : ''} onchange="window.toggleLayer('${key}', this.checked)"><span>${item.name}</span></label>
            <input type="range" min="0" max="100" value="${item.opacity}" aria-label="Krycie warstwy ${item.name}" oninput="window.setLayerOpacity('${key}', this.value); document.getElementById('lbl-op-${key}').textContent = this.value + '%'">
            <span id="lbl-op-${key}" class="sb-layer-pct">${item.opacity}%</span>
            <div class="sb-ord">
                <button type="button" title="Przesuń wyżej" onclick="window.moveLayer('${key}', 'up')" ${isTop ? 'disabled' : ''}>▲</button>
                <button type="button" title="Przesuń niżej" onclick="window.moveLayer('${key}', 'down')" ${isBottom ? 'disabled' : ''}>▼</button>
            </div>
        </div>${satRow}
    </div>`;
}

export function initLayerManager(map, components) {
    window.MAP_LAYERS = {};
    Object.keys(DEFAULT_MAP_LAYERS).forEach(k => { window.MAP_LAYERS[k] = { ...DEFAULT_MAP_LAYERS[k] }; });
    window.layerOrder = [...DEFAULT_LAYER_ORDER];
    loadSavedLayerState();

    window.applyLayerOrder = () => {
        const total = window.layerOrder.length;
        window.layerOrder.forEach((key, idx) => {
            const pane = window.MAP_LAYERS[key]?.pane;
            if (pane && map.getPane(pane)) {
                map.getPane(pane).style.zIndex = 240 + (total - idx) * 30;
            }
        });
        saveLayerState();
    };

    window.moveLayer = (key, dir) => {
        const idx = window.layerOrder.indexOf(key);
        if (idx === -1) return;
        const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= window.layerOrder.length) return;
        const tmp = window.layerOrder[idx];
        window.layerOrder[idx] = window.layerOrder[targetIdx];
        window.layerOrder[targetIdx] = tmp;
        window.applyLayerOrder();
        window.renderLayerManagerUI();
    };

    window.toggleLayer = (key, isChecked) => {
        if (!window.MAP_LAYERS[key]) return;
        window.MAP_LAYERS[key].visible = isChecked;
        saveLayerState();
        LAYER_TOGGLE_ACTIONS[key]?.(map, components, isChecked);
        window.renderLayerManagerUI();
    };

    window.setLayerOpacity = (key, val) => {
        const op = parseInt(val, 10) / 100.0;
        if (window.MAP_LAYERS[key]) window.MAP_LAYERS[key].opacity = parseInt(val, 10);
        saveLayerState();
        LAYER_OPACITY_ACTIONS[key]?.(components, op);
    };

    window.renderLayerManagerUI = () => {
        const container = document.getElementById('layer-manager-list');
        if (!container) return;
        const total = window.layerOrder.length;
        container.innerHTML = window.layerOrder.map((k, i) => renderLayerItem(k, i, total)).join('');
    };

    if (window.MAP_LAYERS.satellite?.visible) components.getActiveSatelliteLayer?.()?.addTo(map);
    window.onRadarVisibilityChange?.(Boolean(window.MAP_LAYERS.radar?.visible));
    window.applyLayerOrder();
    window.renderLayerManagerUI();
}
