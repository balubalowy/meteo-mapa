// js/map/satellite.js
// Zrodlo: EUMETSAT GeoServer WMS - https://view.eumetsat.int/geoserver/ows
// Tryb dzienny: MSG FES RGB (msg_fes:rgb_eview), tryb nocny: MTG-I1 FCI IR 10.5 um (mtg_fd:ir105_hrfi)

const WMS_URL = 'https://view.eumetsat.int/geoserver/ows';

let activeSatMode = 'day';
let satelliteDayLayer = null;
let satelliteNightLayer = null;
let lastSatSyncTime = null;

export function initSatellite(map) {
    const baseOpts = {
        format: 'image/png',
        transparent: true,
        opacity: 0.68,
        pane: 'satellitePane',
        maxNativeZoom: 7,
        maxZoom: 18
    };
    satelliteDayLayer = L.tileLayer.wms(WMS_URL, { ...baseOpts, layers: 'msg_fes:rgb_eview', attribution: 'EUMETSAT MSG RGB' });
    satelliteNightLayer = L.tileLayer.wms(WMS_URL, { ...baseOpts, layers: 'mtg_fd:ir105_hrfi', attribution: 'EUMETSAT MTG-IR' });

    window.getSatelliteMode = () => activeSatMode;
    window.setSatelliteMode = (mode) => {
        activeSatMode = mode;
        if (window.MAP_LAYERS?.satellite?.visible) {
            const toRemove = mode === 'day' ? satelliteNightLayer : satelliteDayLayer;
            const toAdd = mode === 'day' ? satelliteDayLayer : satelliteNightLayer;
            if (map.hasLayer(toRemove)) map.removeLayer(toRemove);
            if (!map.hasLayer(toAdd)) map.addLayer(toAdd);
        }
        window.renderLayerManagerUI?.();
    };

    return {
        satelliteDayLayer,
        satelliteNightLayer,
        getActiveSatelliteLayer: () => (activeSatMode === 'night' ? satelliteNightLayer : satelliteDayLayer)
    };
}

export function syncSatelliteTime(timeUnixSec) {
    if (!timeUnixSec || !window.MAP_LAYERS?.satellite?.visible) return;
    const d = new Date(timeUnixSec * 1000);
    d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 15) * 15, 0, 0);
    const timeStr = d.toISOString().replace('.000Z', 'Z');
    if (lastSatSyncTime === timeStr) return;
    lastSatSyncTime = timeStr;
    if (activeSatMode === 'day' && satelliteDayLayer) satelliteDayLayer.setParams({ time: timeStr });
    if (activeSatMode === 'night' && satelliteNightLayer) satelliteNightLayer.setParams({ time: timeStr });
}
