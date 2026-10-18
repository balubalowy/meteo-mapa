// js/map/layers.js
// Menedżer warstw mapy, kolejność Z-Index, widoczność i przezroczystość

export const DEFAULT_MAP_LAYERS = {
    'boundaries': { id: 'boundaries', name: 'Granice', visible: true, opacity: 100, pane: 'boundariesPane' },
    'drawings':   { id: 'drawings',   name: 'Rysowanie', visible: false, opacity: 100, pane: 'drawingsPane' },
    'stations':   { id: 'stations',   name: 'Stacje', visible: true, opacity: 100, pane: 'stationsPane' },
    'lightning':  { id: 'lightning',  name: 'Wyładowania', visible: true, opacity: 95, pane: 'lightningPane' },
    'radar':      { id: 'radar',      name: 'Radar', visible: false, opacity: 68, pane: 'radarPane' },
    'inter':      { id: 'inter',      name: 'Interpolacja', visible: true, opacity: 88, pane: 'weatherPane' },
    'sat_day':    { id: 'sat_day',    name: 'Satelita (dzień)', visible: true, opacity: 68, pane: 'satellitePane' },
    'sat_night':  { id: 'sat_night',  name: 'Satelita (noc)', visible: false, opacity: 52, pane: 'satelliteNightPane' }
};

export const DEFAULT_LAYER_ORDER = ['boundaries', 'drawings', 'stations', 'lightning', 'radar', 'inter', 'sat_day', 'sat_night'];

let boundariesLayerGroup = null;
let countriesGeoLayer = null;
let provincesGeoLayer = null;
let isCurrentThemeLight = false;

export function initBoundaries(map) {
    map.createPane('boundariesPane');
    map.getPane('boundariesPane').style.zIndex = 500;
    map.getPane('boundariesPane').style.pointerEvents = 'none';

    boundariesLayerGroup = L.layerGroup([], { pane: 'boundariesPane' });

    fetch('assets/geo/europe_countries.json')
        .then(res => res.json())
        .then(data => {
            countriesGeoLayer = L.geoJSON(data, {
                pane: 'boundariesPane',
                style: {
                    color: isCurrentThemeLight ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.75)',
                    weight: 1.5, dashArray: '4, 4', fill: false, interactive: false
                }
            }).addTo(boundariesLayerGroup);
        })
        .catch(err => console.error("Błąd ładowania granic państw:", err));

    fetch('assets/geo/wojewodztwa.geojson')
        .then(res => res.json())
        .then(data => {
            provincesGeoLayer = L.geoJSON(data, {
                pane: 'boundariesPane',
                style: {
                    color: isCurrentThemeLight ? 'rgba(51, 65, 85, 0.65)' : 'rgba(255, 255, 255, 0.45)',
                    weight: 1.1, dashArray: '2, 3', fill: false, interactive: false
                }
            }).addTo(boundariesLayerGroup);
        })
        .catch(err => console.error("Błąd ładowania granic województw:", err));

    window.updateBoundariesStyle = (isLight) => {
        isCurrentThemeLight = isLight;
        if (countriesGeoLayer) {
            countriesGeoLayer.setStyle({ color: isLight ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.75)' });
        }
        if (provincesGeoLayer) {
            provincesGeoLayer.setStyle({ color: isLight ? 'rgba(51, 65, 85, 0.65)' : 'rgba(255, 255, 255, 0.45)' });
        }
    };

    return boundariesLayerGroup;
}

export function initLayerManager(map, components) {
    window.MAP_LAYERS = { ...DEFAULT_MAP_LAYERS };
    window.layerOrder = [...DEFAULT_LAYER_ORDER];

    try {
        const savedLayers = localStorage.getItem('meteo_map_layers_v5');
        const savedOrder = localStorage.getItem('meteo_map_order_v5');
        if (savedLayers) {
            const parsed = JSON.parse(savedLayers);
            Object.keys(parsed).forEach(k => {
                if (window.MAP_LAYERS[k]) {
                    window.MAP_LAYERS[k].visible = parsed[k].visible;
                    window.MAP_LAYERS[k].opacity = parsed[k].opacity;
                }
            });
        }
        if (savedOrder) {
            const parsedOrder = JSON.parse(savedOrder);
            if (Array.isArray(parsedOrder) && parsedOrder.length === window.layerOrder.length) {
                window.layerOrder = parsedOrder;
            }
        }
    } catch (_) {}

    function saveLayerState() {
        try {
            localStorage.setItem('meteo_map_layers_v5', JSON.stringify(window.MAP_LAYERS));
            localStorage.setItem('meteo_map_order_v5', JSON.stringify(window.layerOrder));
        } catch (_) {}
    }

    window.applyLayerOrder = () => {
        const total = window.layerOrder.length;
        window.layerOrder.forEach((key, idx) => {
            const item = window.MAP_LAYERS[key];
            if (item?.pane && map.getPane(item.pane)) {
                map.getPane(item.pane).style.zIndex = 240 + (total - idx) * 30;
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

        if (key === 'drawings') {
            const sec = document.getElementById('section-rysowanie');
            if (sec) sec.style.display = isChecked ? 'block' : 'none';
        } else if (key === 'boundaries') {
            if (isChecked) { if (!map.hasLayer(boundariesLayerGroup)) map.addLayer(boundariesLayerGroup); }
            else { if (map.hasLayer(boundariesLayerGroup)) map.removeLayer(boundariesLayerGroup); }
        } else if (key === 'sat_day' && components.satelliteDayLayer) {
            if (isChecked) { if (!map.hasLayer(components.satelliteDayLayer)) map.addLayer(components.satelliteDayLayer); }
            else { if (map.hasLayer(components.satelliteDayLayer)) map.removeLayer(components.satelliteDayLayer); }
        } else if (key === 'sat_night' && components.satelliteNightLayer) {
            if (isChecked) { if (!map.hasLayer(components.satelliteNightLayer)) map.addLayer(components.satelliteNightLayer); }
            else { if (map.hasLayer(components.satelliteNightLayer)) map.removeLayer(components.satelliteNightLayer); }
        } else if (key === 'lightning' && components.lightningGroup) {
            if (isChecked) { if (!map.hasLayer(components.lightningGroup)) map.addLayer(components.lightningGroup); }
            else { if (map.hasLayer(components.lightningGroup)) map.removeLayer(components.lightningGroup); }
        } else if (key === 'radar') {
            const overlay = components.getRadarOverlay ? components.getRadarOverlay() : null;
            if (overlay) {
                if (isChecked) { if (!map.hasLayer(overlay)) map.addLayer(overlay); }
                else { if (map.hasLayer(overlay)) map.removeLayer(overlay); }
            }
        } else if (key === 'inter' || key === 'stations') {
            if (typeof window.renderIMGW === 'function') window.renderIMGW();
        }
    };

    window.setLayerOpacity = (key, val) => {
        const op = parseInt(val) / 100.0;
        if (window.MAP_LAYERS[key]) window.MAP_LAYERS[key].opacity = parseInt(val);
        saveLayerState();

        if (key === 'sat_day') components.satelliteDayLayer?.setOpacity(op);
        else if (key === 'sat_night') components.satelliteNightLayer?.setOpacity(op);
        else if (key === 'boundaries') boundariesLayerGroup?.eachLayer(l => l.setStyle?.({ opacity: op }));
        else if (key === 'radar') components.getRadarOverlay?.()?.setOpacity(op);
        else if (key === 'inter') window.idwOverlay?.setOpacity(op);
    };

    window.renderLayerManagerUI = () => {
        const container = document.getElementById('layer-manager-list');
        if (!container) return;

        container.innerHTML = window.layerOrder.map((key, idx) => {
            const item = window.MAP_LAYERS[key];
            if (!item) return '';
            const isTop = idx === 0;
            const isBottom = idx === window.layerOrder.length - 1;
            const extra = key === 'lightning' ? ' <span id="bo-strike-count" style="font-size: 0.65rem; color: #eab308;"></span>' : '';
            return `<div class="layer-item-card" style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 7px 10px; display: flex; flex-direction: column; gap: 5px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; margin: 0; color: var(--text-primary);"><input type="checkbox" ${item.visible ? 'checked' : ''} onchange="window.toggleLayer('${key}', this.checked)"><span>${item.name}${extra}</span></label>
                    <div style="display: flex; gap: 3px;">
                        <button class="btn btn-ghost" style="padding: 2px 6px; font-size: 0.75rem; border: 1px solid var(--border-subtle);" title="Przesuń wyżej" onclick="window.moveLayer('${key}', 'up')" ${isTop ? 'disabled style="opacity:0.25; cursor:default;"' : ''}>▲</button>
                        <button class="btn btn-ghost" style="padding: 2px 6px; font-size: 0.75rem; border: 1px solid var(--border-subtle);" title="Przesuń niżej" onclick="window.moveLayer('${key}', 'down')" ${isBottom ? 'disabled style="opacity:0.25; cursor:default;"' : ''}>▼</button>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 0.7rem; color: var(--text-muted);">
                    <span style="min-width: 42px;">Krycie:</span>
                    <input type="range" min="0" max="100" value="${item.opacity}" oninput="window.setLayerOpacity('${key}', this.value); document.getElementById('lbl-op-${key}').textContent = this.value + '%'" style="flex: 1; accent-color: var(--accent-primary); height: 4px;">
                    <span id="lbl-op-${key}" style="width: 32px; text-align: right;">${item.opacity}%</span>
                </div>
            </div>`;
        }).join('');
    };

    if (window.MAP_LAYERS['boundaries']?.visible && boundariesLayerGroup) boundariesLayerGroup.addTo(map);
    window.applyLayerOrder();
    window.renderLayerManagerUI();
}
