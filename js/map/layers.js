// js/map/layers.js
// Menedżer warstw mapy, kolejność Z-Index, widoczność i przezroczystość

export const DEFAULT_MAP_LAYERS = {
    boundaries: { id: 'boundaries', name: 'Granice', visible: true, opacity: 100, pane: 'boundariesPane' },
    drawings:   { id: 'drawings',   name: 'Rysowanie', visible: false, opacity: 100, pane: 'drawingsPane' },
    stations:   { id: 'stations',   name: 'Stacje', visible: true, opacity: 100, pane: 'stationsPane' },
    lightning:  { id: 'lightning',  name: 'Wyładowania', visible: true, opacity: 95, pane: 'lightningPane' },
    radar:      { id: 'radar',      name: 'Radar', visible: false, opacity: 68, pane: 'radarPane' },
    inter:      { id: 'inter',      name: 'Interpolacja', visible: true, opacity: 88, pane: 'weatherPane' },
    satellite:  { id: 'satellite',  name: 'Satelita', visible: true, opacity: 68, pane: 'satellitePane' }
};
export const DEFAULT_LAYER_ORDER = ['boundaries', 'drawings', 'stations', 'lightning', 'radar', 'inter', 'satellite'];

let boundariesLayerGroup = null, countriesGeoLayer = null, provincesGeoLayer = null, isCurrentThemeLight = false;

export function initBoundaries(map) {
    map.createPane('boundariesPane');
    map.getPane('boundariesPane').style.zIndex = 500;
    map.getPane('boundariesPane').style.pointerEvents = 'none';
    boundariesLayerGroup = L.layerGroup([], { pane: 'boundariesPane' });

    const loadGeo = (url, weight, dash, isProv) => fetch(url).then(r => r.json()).then(data => {
        const color = isCurrentThemeLight ? (isProv ? 'rgba(51,65,85,0.65)' : 'rgba(15,23,42,0.85)') : (isProv ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.75)');
        const lyr = L.geoJSON(data, { pane: 'boundariesPane', style: { color, weight, dashArray: dash, fill: false, interactive: false } }).addTo(boundariesLayerGroup);
        if (isProv) provincesGeoLayer = lyr; else countriesGeoLayer = lyr;
    }).catch(err => console.error("Błąd granic:", err));

    loadGeo('assets/geo/europe_countries.json', 1.5, '4, 4', false);
    loadGeo('assets/geo/wojewodztwa.geojson', 1.1, '2, 3', true);

    window.updateBoundariesStyle = (isLight) => {
        isCurrentThemeLight = isLight;
        countriesGeoLayer?.setStyle({ color: isLight ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.75)' });
        provincesGeoLayer?.setStyle({ color: isLight ? 'rgba(51, 65, 85, 0.65)' : 'rgba(255, 255, 255, 0.45)' });
    };
    return boundariesLayerGroup;
}

function loadSavedLayerState() {
    try {
        const savedLayers = JSON.parse(localStorage.getItem('meteo_map_layers_v6') || '{}');
        Object.keys(savedLayers).forEach(k => {
            if (window.MAP_LAYERS[k]) {
                window.MAP_LAYERS[k].visible = savedLayers[k].visible;
                window.MAP_LAYERS[k].opacity = savedLayers[k].opacity;
            }
        });
        const savedOrder = JSON.parse(localStorage.getItem('meteo_map_order_v6') || '[]');
        if (Array.isArray(savedOrder) && savedOrder.length === window.layerOrder.length) window.layerOrder = savedOrder;
    } catch (_) {}
}

function saveLayerState() {
    try {
        localStorage.setItem('meteo_map_layers_v6', JSON.stringify(window.MAP_LAYERS));
        localStorage.setItem('meteo_map_order_v6', JSON.stringify(window.layerOrder));
    } catch (_) {}
}

const LAYER_TOGGLE_ACTIONS = {
    drawings: (map, comp, chk) => {
        const sec = document.getElementById('section-rysowanie');
        if (sec) sec.style.display = chk ? 'block' : 'none';
    },
    boundaries: (map, comp, chk) => {
        if (!boundariesLayerGroup) return;
        if (chk && !map.hasLayer(boundariesLayerGroup)) map.addLayer(boundariesLayerGroup);
        if (!chk && map.hasLayer(boundariesLayerGroup)) map.removeLayer(boundariesLayerGroup);
    },
    satellite: (map, comp, chk) => {
        const sLay = comp.getActiveSatelliteLayer?.();
        if (chk && sLay && !map.hasLayer(sLay)) map.addLayer(sLay);
        if (!chk) {
            if (comp.satelliteDayLayer && map.hasLayer(comp.satelliteDayLayer)) map.removeLayer(comp.satelliteDayLayer);
            if (comp.satelliteNightLayer && map.hasLayer(comp.satelliteNightLayer)) map.removeLayer(comp.satelliteNightLayer);
        }
    },
    lightning: (map, comp, chk) => {
        if (!comp.lightningGroup) return;
        if (chk && !map.hasLayer(comp.lightningGroup)) map.addLayer(comp.lightningGroup);
        if (!chk && map.hasLayer(comp.lightningGroup)) map.removeLayer(comp.lightningGroup);
    },
    radar: (map, comp, chk) => {
        const overlay = comp.getRadarOverlay?.();
        if (!overlay) return;
        if (chk && !map.hasLayer(overlay)) map.addLayer(overlay);
        if (!chk && map.hasLayer(overlay)) map.removeLayer(overlay);
    },
    inter: () => { if (typeof window.renderIMGW === 'function') window.renderIMGW(); },
    stations: () => { if (typeof window.renderIMGW === 'function') window.renderIMGW(); }
};

const LAYER_OPACITY_ACTIONS = {
    satellite: (comp, op) => { comp.satelliteDayLayer?.setOpacity(op); comp.satelliteNightLayer?.setOpacity(op); },
    boundaries: (comp, op) => { boundariesLayerGroup?.eachLayer(l => l.setStyle?.({ opacity: op })); },
    radar: (comp, op) => { comp.getRadarOverlay?.()?.setOpacity(op); },
    inter: (comp, op) => { window.idwOverlay?.setOpacity(op); }
};

function renderLayerControls(key) {
    if (key === 'satellite') {
        const isDay = (window.getSatelliteMode?.() || 'day') === 'day';
        return `<div style="display:inline-flex; gap:2px; margin-left:auto; margin-right:6px;">
            <button class="btn ${isDay ? 'btn-primary' : 'btn-ghost'}" onclick="window.setSatelliteMode('day')" style="padding:1px 5px; font-size:0.65rem;">Dzień</button>
            <button class="btn ${!isDay ? 'btn-primary' : 'btn-ghost'}" onclick="window.setSatelliteMode('night')" style="padding:1px 5px; font-size:0.65rem;">Noc</button>
        </div>`;
    }
    if (key === 'radar') {
        const isImgw = (window.getRadarSource?.() || 'rv') === 'imgw';
        return `<div style="display:inline-flex; gap:2px; margin-left:auto; margin-right:6px;">
            <button class="btn ${isImgw ? 'btn-primary' : 'btn-ghost'}" onclick="window.setRadarSource('imgw')" style="padding:1px 5px; font-size:0.65rem;">IMGW</button>
            <button class="btn ${!isImgw ? 'btn-primary' : 'btn-ghost'}" onclick="window.setRadarSource('rv')" style="padding:1px 5px; font-size:0.65rem;">RainViewer</button>
        </div>`;
    }
    return '';
}

function renderLayerItem(key, idx, total) {
    const item = window.MAP_LAYERS[key];
    if (!item) return '';
    const isTop = idx === 0, isBottom = idx === total - 1;
    const extra = key === 'lightning' ? ' <span id="bo-strike-count" style="font-size:0.65rem; color:#eab308;"></span>' : '';
    const ctrl = renderLayerControls(key);

    return `<div class="layer-item-card" style="background:var(--bg-secondary); border:1px solid var(--border-subtle); border-radius:6px; padding:7px 10px; display:flex; flex-direction:column; gap:5px;">
        <div style="display:flex; align-items:center; justify-content:space-between;">
            <label style="display:flex; align-items:center; gap:8px; font-size:0.8rem; font-weight:600; cursor:pointer; margin:0; color:var(--text-primary);"><input type="checkbox" ${item.visible ? 'checked' : ''} onchange="window.toggleLayer('${key}', this.checked)"><span>${item.name}${extra}</span></label>
            <div style="display:flex; align-items:center; gap:3px;">
                ${ctrl}
                <button class="btn btn-ghost" style="padding:2px 6px; font-size:0.75rem; border:1px solid var(--border-subtle);" title="Przesuń wyżej" onclick="window.moveLayer('${key}', 'up')" ${isTop ? 'disabled style="opacity:0.25; cursor:default;"' : ''}>▲</button>
                <button class="btn btn-ghost" style="padding:2px 6px; font-size:0.75rem; border:1px solid var(--border-subtle);" title="Przesuń niżej" onclick="window.moveLayer('${key}', 'down')" ${isBottom ? 'disabled style="opacity:0.25; cursor:default;"' : ''}>▼</button>
            </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px; font-size:0.7rem; color:var(--text-muted);">
            <span style="min-width:42px;">Krycie:</span>
            <input type="range" min="0" max="100" value="${item.opacity}" oninput="window.setLayerOpacity('${key}', this.value); document.getElementById('lbl-op-${key}').textContent = this.value + '%'" style="flex:1; accent-color:var(--accent-primary); height:4px;">
            <span id="lbl-op-${key}" style="width:32px; text-align:right;">${item.opacity}%</span>
        </div>
    </div>`;
}

export function initLayerManager(map, components) {
    window.MAP_LAYERS = { ...DEFAULT_MAP_LAYERS };
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

    if (window.MAP_LAYERS['boundaries']?.visible && boundariesLayerGroup) boundariesLayerGroup.addTo(map);
    if (window.MAP_LAYERS['satellite']?.visible) components.getActiveSatelliteLayer?.()?.addTo(map);

    window.applyLayerOrder();
    window.renderLayerManagerUI();
}
