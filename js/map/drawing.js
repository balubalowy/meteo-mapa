// js/map/drawing.js
// Obsługa narzędzi rysowania Geoman oraz dekoratorów frontów synoptycznych

let activeDrawingMode = 'polygon';

function createFrontDecorator(map, layer, type) {
    if (typeof L.polylineDecorator !== 'function') return null;

    if (type === 'front_chlodny' || type === 'front_chlodny_2') {
        return L.polylineDecorator(layer, {
            patterns: [{
                offset: 15, repeat: 32,
                symbol: L.Symbol.marker({
                    rotate: true,
                    markerOptions: {
                        icon: L.divIcon({
                            className: 'front-chlodny-icon',
                            html: '<svg viewBox="0 0 16 10" style="width:16px;height:10px;display:block;"><polygon points="0,10 8,0 16,10" fill="#2563eb"/></svg>',
                            iconSize: [16, 10], iconAnchor: [8, 10]
                        })
                    }
                })
            }]
        }).addTo(map);
    }

    if (type === 'front_cieply') {
        return L.polylineDecorator(layer, {
            patterns: [{
                offset: 15, repeat: 32,
                symbol: L.Symbol.marker({
                    rotate: true,
                    markerOptions: {
                        icon: L.divIcon({
                            className: 'front-cieply-icon',
                            html: '<svg viewBox="0 0 16 10" style="width:16px;height:10px;display:block;"><path d="M 0 10 A 8 8 0 0 1 16 10 Z" fill="#dc2626"/></svg>',
                            iconSize: [16, 10], iconAnchor: [8, 10]
                        })
                    }
                })
            }]
        }).addTo(map);
    }

    if (type === 'front_zokludowany') {
        return L.polylineDecorator(layer, {
            patterns: [
                {
                    offset: 12, repeat: 48,
                    symbol: L.Symbol.marker({
                        rotate: true,
                        markerOptions: {
                            icon: L.divIcon({
                                className: 'front-zokl-icon',
                                html: '<svg viewBox="0 0 16 10" style="width:16px;height:10px;display:block;"><polygon points="0,10 8,0 16,10" fill="#9333ea"/></svg>',
                                iconSize: [16, 10], iconAnchor: [8, 10]
                            })
                        }
                    })
                },
                {
                    offset: 36, repeat: 48,
                    symbol: L.Symbol.marker({
                        rotate: true,
                        markerOptions: {
                            icon: L.divIcon({
                                className: 'front-zokl-icon',
                                html: '<svg viewBox="0 0 16 10" style="width:16px;height:10px;display:block;"><path d="M 0 10 A 8 8 0 0 1 16 10 Z" fill="#9333ea"/></svg>',
                                iconSize: [16, 10], iconAnchor: [8, 10]
                            })
                        }
                    })
                }
            ]
        }).addTo(map);
    }

    if (type === 'zbieznosc') {
        return L.polylineDecorator(layer, {
            patterns: [{
                offset: 10, repeat: 20,
                symbol: L.Symbol.marker({
                    rotate: true,
                    markerOptions: {
                        icon: L.divIcon({
                            className: 'zbieznosc-icon',
                            html: '<svg viewBox="0 0 8 8" style="width:8px;height:8px;display:block;"><line x1="8" y1="8" x2="0" y2="0" stroke="#f97316" stroke-width="2"/></svg>',
                            iconSize: [8, 8], iconAnchor: [4, 4]
                        })
                    }
                })
            }]
        }).addTo(map);
    }

    if (type === 'strzalka') {
        return L.polylineDecorator(layer, {
            patterns: [{
                offset: '100%', repeat: 0,
                symbol: L.Symbol.arrowHead({ pixelSize: 14, polygon: true, pathOptions: { stroke: false, fillColor: '#cbd5e1', fillOpacity: 1 } })
            }]
        }).addTo(map);
    }

    return null;
}

function applyWeatherMarkerIcon(layer, mode) {
    const iconsMap = {
        wyz: '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(30,58,138,0.92);border:2px solid #60a5fa;border-radius:50%;color:#ffffff;font-weight:800;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.5);transform:translate(-50%,-50%);font-family:sans-serif;">W</div>',
        niz: '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(185,28,28,0.92);border:2px solid #f87171;border-radius:50%;color:#ffffff;font-weight:800;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.5);transform:translate(-50%,-50%);font-family:sans-serif;">N</div>',
        burza: '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(15,23,42,0.85);border:1.5px solid #ef4444;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);transform:translate(-50%,-50%);"><svg viewBox="0 0 24 24" width="16" height="16" fill="#ef4444" stroke="#ef4444" stroke-width="1"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>',
        deszcz: '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(15,23,42,0.85);border:1.5px solid #22c55e;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);transform:translate(-50%,-50%);"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg></div>',
        snieg: '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(15,23,42,0.85);border:1.5px solid #38bdf8;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);transform:translate(-50%,-50%);"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg></div>',
        mgla: '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(15,23,42,0.85);border:1.5px solid #eab308;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);transform:translate(-50%,-50%);"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#eab308" stroke-width="2.5" stroke-linecap="round"><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="16" x2="20" y2="16"/></svg></div>'
    };

    if (iconsMap[mode]) {
        layer.setIcon(L.divIcon({ className: `meteo-icon-${mode}`, html: iconsMap[mode], iconSize: [0, 0] }));
    }
}

export function initGeoman(map) {
    if (!map.pm) return;

    map.pm.addControls({
        position: 'topleft',
        drawCircleMarker: false, drawPolyline: false, drawRectangle: false, drawCircle: false,
        editMode: true, dragMode: true, cutPolygon: false, removalMode: true
    });

    map.pm.setGlobalOptions({ pathOptions: { color: '#ef4444', weight: 3, fillOpacity: 0.4 } });

    map.on('pm:create', (e) => {
        const layer = e.layer;
        const decorator = createFrontDecorator(map, layer, activeDrawingMode);
        if (decorator) layer._myDecorator = decorator;

        applyWeatherMarkerIcon(layer, activeDrawingMode);

        layer.on('click', () => {
            if (map.pm.globalRemovalModeEnabled()) {
                map.removeLayer(layer);
                if (layer._myDecorator) map.removeLayer(layer._myDecorator);
            }
        });

        layer.on('pm:remove', () => {
            if (layer._myDecorator) map.removeLayer(layer._myDecorator);
        });
    });

    window.setDrawingColor = (color) => {
        activeDrawingMode = 'polygon';
        map.pm.setGlobalOptions({ pathOptions: { color, weight: 2, fillOpacity: 0.22, dashArray: '' } });
        map.pm.enableDraw('Polygon');
    };

    window.setDrawingMode = (mode) => {
        activeDrawingMode = mode;
        const modeConfigs = {
            zbieznosc: { color: '#f97316', weight: 2, fillOpacity: 0, dashArray: '6, 6', shape: 'Line' },
            front_chlodny: { color: '#2563eb', weight: 2.5, fillOpacity: 0, dashArray: '', shape: 'Line' },
            front_chlodny_2: { color: '#2563eb', weight: 2.5, fillOpacity: 0, dashArray: '8, 6', shape: 'Line' },
            front_cieply: { color: '#dc2626', weight: 2.5, fillOpacity: 0, dashArray: '', shape: 'Line' },
            front_zokludowany: { color: '#9333ea', weight: 2.5, fillOpacity: 0, dashArray: '', shape: 'Line' },
            strzalka: { color: '#cbd5e1', weight: 3, fillOpacity: 0, dashArray: '', shape: 'Line' },
            kolko: { color: '#22c55e', weight: 2, fillOpacity: 0.22, dashArray: '', shape: 'Circle' }
        };

        if (modeConfigs[mode]) {
            const cfg = modeConfigs[mode];
            map.pm.setGlobalOptions({ pathOptions: { color: cfg.color, weight: cfg.weight, fillOpacity: cfg.fillOpacity, dashArray: cfg.dashArray } });
            map.pm.enableDraw(cfg.shape);
        } else if (['wyz', 'niz', 'burza', 'deszcz', 'snieg', 'mgla'].includes(mode)) {
            map.pm.enableDraw('Marker');
        }
    };

    window.clearMap = () => {
        map.eachLayer(layer => {
            if ((layer instanceof L.Polygon || layer instanceof L.Polyline || layer instanceof L.Circle || layer instanceof L.Marker) 
                && !layer._url && layer.options.icon?.options?.className !== 'leaflet-div-icon leaflet-editing-icon') {
                map.removeLayer(layer);
                if (layer._myDecorator) map.removeLayer(layer._myDecorator);
            }
        });
    };
}
