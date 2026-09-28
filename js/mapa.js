window.initMapa = function() {
    setTimeout(() => {
        if (window.premiumMap) window.premiumMap.remove();

        const map = L.map('premium-map', { center: [51.9194, 19.1451], zoom: 6, zoomControl: false });
        window.premiumMap = map;
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // KROK 1: MAP PANES (Precyzyjne zarządzanie kolejnością Z-Index)
        map.createPane('basePane');
        map.getPane('basePane').style.zIndex = 200;
        
        map.createPane('satellitePane');
        map.getPane('satellitePane').style.zIndex = 260;
        
        map.createPane('weatherPane');
        map.getPane('weatherPane').style.zIndex = 290;
        
        map.createPane('radarPane');
        map.getPane('radarPane').style.zIndex = 320;
        
        map.createPane('lightningPane');
        map.getPane('lightningPane').style.zIndex = 350;
        
        map.createPane('drawingsPane');
        map.getPane('drawingsPane').style.zIndex = 380;
        
        map.createPane('stationsPane');
        map.getPane('stationsPane').style.zIndex = 410;
        
        map.createPane('labelsPane');
        map.getPane('labelsPane').style.zIndex = 650;
        map.getPane('labelsPane').style.pointerEvents = 'none';

        // Geoman Setup (Kreator)
        if(map.pm) {
            map.pm.addControls({
                position: 'topleft',
                drawCircleMarker: false,
                drawPolyline: false,
                drawRectangle: false,
                drawCircle: false,
                editMode: true,
                dragMode: true,
                cutPolygon: false,
                removalMode: true,
            });
            
            map.pm.setGlobalOptions({
                pathOptions: { color: '#ef4444', weight: 3, fillOpacity: 0.4 }
            });

            window.currentDrawingMode = 'polygon';

            map.on('pm:create', e => {
                const layer = e.layer;
                
                if (window.currentDrawingMode === 'front_chlodny') {
                    const decorator = L.polylineDecorator(layer, {
                        patterns: [
                            { offset: 15, repeat: 32, symbol: L.Symbol.marker({
                                rotate: true,
                                markerOptions: {
                                    icon: L.divIcon({
                                        className: 'front-chlodny-icon',
                                        html: '<svg viewBox="0 0 16 10" style="width:16px;height:10px;display:block;"><polygon points="0,10 8,0 16,10" fill="#2563eb"/></svg>',
                                        iconSize: [16, 10],
                                        iconAnchor: [8, 10]
                                    })
                                }
                            })}
                        ]
                    }).addTo(map);
                    layer._myDecorator = decorator;
                } else if (window.currentDrawingMode === 'front_chlodny_2') {
                    const decorator = L.polylineDecorator(layer, {
                        patterns: [
                            { offset: 15, repeat: 32, symbol: L.Symbol.marker({
                                rotate: true,
                                markerOptions: {
                                    icon: L.divIcon({
                                        className: 'front-chlodny-icon',
                                        html: '<svg viewBox="0 0 16 10" style="width:16px;height:10px;display:block;"><polygon points="0,10 8,0 16,10" fill="#2563eb"/></svg>',
                                        iconSize: [16, 10],
                                        iconAnchor: [8, 10]
                                    })
                                }
                            })}
                        ]
                    }).addTo(map);
                    layer._myDecorator = decorator;
                } else if (window.currentDrawingMode === 'front_cieply') {
                    const decorator = L.polylineDecorator(layer, {
                        patterns: [
                            { offset: 15, repeat: 32, symbol: L.Symbol.marker({
                                rotate: true,
                                markerOptions: {
                                    icon: L.divIcon({
                                        className: 'front-cieply-icon',
                                        html: '<svg viewBox="0 0 16 10" style="width:16px;height:10px;display:block;"><path d="M 0 10 A 8 8 0 0 1 16 10 Z" fill="#dc2626"/></svg>',
                                        iconSize: [16, 10],
                                        iconAnchor: [8, 10]
                                    })
                                }
                            })}
                        ]
                    }).addTo(map);
                    layer._myDecorator = decorator;
                } else if (window.currentDrawingMode === 'front_zokludowany') {
                    const decorator = L.polylineDecorator(layer, {
                        patterns: [
                            { offset: 12, repeat: 48, symbol: L.Symbol.marker({
                                rotate: true,
                                markerOptions: {
                                    icon: L.divIcon({
                                        className: 'front-zokl-icon',
                                        html: '<svg viewBox="0 0 16 10" style="width:16px;height:10px;display:block;"><polygon points="0,10 8,0 16,10" fill="#9333ea"/></svg>',
                                        iconSize: [16, 10],
                                        iconAnchor: [8, 10]
                                    })
                                }
                            })},
                            { offset: 36, repeat: 48, symbol: L.Symbol.marker({
                                rotate: true,
                                markerOptions: {
                                    icon: L.divIcon({
                                        className: 'front-zokl-icon',
                                        html: '<svg viewBox="0 0 16 10" style="width:16px;height:10px;display:block;"><path d="M 0 10 A 8 8 0 0 1 16 10 Z" fill="#9333ea"/></svg>',
                                        iconSize: [16, 10],
                                        iconAnchor: [8, 10]
                                    })
                                }
                            })}
                        ]
                    }).addTo(map);
                    layer._myDecorator = decorator;
                } else if (window.currentDrawingMode === 'zbieznosc') {
                    const decorator = L.polylineDecorator(layer, {
                        patterns: [
                            { offset: 10, repeat: 20, symbol: L.Symbol.marker({
                                rotate: true,
                                markerOptions: {
                                    icon: L.divIcon({
                                        className: 'zbieznosc-icon',
                                        html: '<svg viewBox="0 0 8 8" style="width:8px;height:8px;display:block;"><line x1="8" y1="8" x2="0" y2="0" stroke="#f97316" stroke-width="2"/></svg>',
                                        iconSize: [8, 8],
                                        iconAnchor: [4, 4]
                                    })
                                }
                            })}
                        ]
                    }).addTo(map);
                    layer._myDecorator = decorator;
                } else if (window.currentDrawingMode === 'strzalka') {
                    const decorator = L.polylineDecorator(layer, {
                        patterns: [
                            { offset: '100%', repeat: 0, symbol: L.Symbol.arrowHead({pixelSize: 14, polygon: true, pathOptions: {stroke: false, fillColor: '#cbd5e1', fillOpacity: 1}}) }
                        ]
                    }).addTo(map);
                    layer._myDecorator = decorator;
                } else if (window.currentDrawingMode === 'wyz') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-wyz',
                        html: '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(30,58,138,0.92);border:2px solid #60a5fa;border-radius:50%;color:#ffffff;font-weight:800;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.5);transform:translate(-50%,-50%);font-family:sans-serif;">W</div>',
                        iconSize: [0, 0]
                    }));
                } else if (window.currentDrawingMode === 'niz') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-niz',
                        html: '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(185,28,28,0.92);border:2px solid #f87171;border-radius:50%;color:#ffffff;font-weight:800;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.5);transform:translate(-50%,-50%);font-family:sans-serif;">N</div>',
                        iconSize: [0, 0]
                    }));
                } else if (window.currentDrawingMode === 'burza') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-burza',
                        html: '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(15,23,42,0.85);border:1.5px solid #ef4444;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);transform:translate(-50%,-50%);"><svg viewBox="0 0 24 24" width="16" height="16" fill="#ef4444" stroke="#ef4444" stroke-width="1"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>',
                        iconSize: [0, 0]
                    }));
                } else if (window.currentDrawingMode === 'deszcz') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-deszcz',
                        html: '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(15,23,42,0.85);border:1.5px solid #22c55e;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);transform:translate(-50%,-50%);"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg></div>',
                        iconSize: [0, 0]
                    }));
                } else if (window.currentDrawingMode === 'snieg') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-snieg',
                        html: '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(15,23,42,0.85);border:1.5px solid #38bdf8;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);transform:translate(-50%,-50%);"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg></div>',
                        iconSize: [0, 0]
                    }));
                } else if (window.currentDrawingMode === 'mgla') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-mgla',
                        html: '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(15,23,42,0.85);border:1.5px solid #eab308;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);transform:translate(-50%,-50%);"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#eab308" stroke-width="2.5" stroke-linecap="round"><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="16" x2="20" y2="16"/></svg></div>',
                        iconSize: [0, 0]
                    }));
                }
                
                layer.on('click', () => {
                    if (map.pm.globalRemovalModeEnabled()) {
                        map.removeLayer(layer);
                        if(layer._myDecorator) map.removeLayer(layer._myDecorator);
                    }
                });
                
                layer.on('pm:remove', () => {
                    if(layer._myDecorator) map.removeLayer(layer._myDecorator);
                });
            });
        }
        
        window.setDrawingColor = function(color) {
            if(map.pm) {
                window.currentDrawingMode = 'polygon';
                map.pm.setGlobalOptions({ pathOptions: { color: color, weight: 2, fillOpacity: 0.22, dashArray: '' } });
                map.pm.enableDraw('Polygon');
            }
        };

        window.setDrawingMode = function(mode) {
            if(!map.pm) return;
            window.currentDrawingMode = mode;
            if(mode === 'zbieznosc') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#f97316', weight: 2, fillOpacity: 0, dashArray: '6, 6' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'front_chlodny') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#2563eb', weight: 2.5, fillOpacity: 0, dashArray: '' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'front_chlodny_2') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#2563eb', weight: 2.5, fillOpacity: 0, dashArray: '8, 6' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'front_cieply') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#dc2626', weight: 2.5, fillOpacity: 0, dashArray: '' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'front_zokludowany') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#9333ea', weight: 2.5, fillOpacity: 0, dashArray: '' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'strzalka') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#cbd5e1', weight: 3, fillOpacity: 0, dashArray: '' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'kolko') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#22c55e', weight: 2, fillOpacity: 0.22, dashArray: '' } });
                map.pm.enableDraw('Circle');
            } else if(['wyz', 'niz', 'burza', 'deszcz', 'snieg', 'mgla'].includes(mode)) {
                map.pm.enableDraw('Marker');
            }
        };
        
        window.clearMap = function() {
            if(!map) return;
            map.eachLayer(layer => {
                if ((layer instanceof L.Polygon || layer instanceof L.Polyline || layer instanceof L.Circle || layer instanceof L.Marker) && !layer._url && layer.options.icon?.options?.className !== 'leaflet-div-icon leaflet-editing-icon') {
                    map.removeLayer(layer);
                    if(layer._myDecorator) map.removeLayer(layer._myDecorator);
                }
            });
        };
        
        window.exportMap = function() {
            alert('Funkcja eksportu wymaga html2canvas i odpowiedniego skonfigurowania proxy dla kafelków mapy. (Do zaimplementowania w kolejnym kroku)');
        };

        // ----------------------------------------------------
        // PODKŁADY MAPOWE (Otwarte, darmowe, bez kluczy API)
        // ----------------------------------------------------
        // Warstwy bazowe Esri Canvas (Czyste tło bez napisów, otwarte i bez limitów)
        const darkBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', { 
            maxZoom: 16, pane: 'basePane', attribution: 'Esri' 
        });
        
        const lightBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { 
            maxZoom: 16, pane: 'basePane', attribution: 'Esri' 
        });

        // Plastyczne cieniowanie rzeźby terenu (DEM / Hillshade)
        const hillshadeBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 18, pane: 'basePane', attribution: 'Esri, USGS, Copernicus DEM'
        });

        // Klasyczna mapa topograficzna z poziomicami i rzeźbą terenu
        const openTopoBase = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            maxZoom: 17, pane: 'basePane', attribution: 'OpenTopoMap (CC-BY-SA)'
        });

        // Fizyczna mapa ze zrównoważoną hipsometrią
        const esriTopoBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19, pane: 'basePane', attribution: 'Esri World Topo'
        });

        // Własna warstwa z głównymi miastami
        const majorCities = [
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

        const cityLabelsGroup = L.layerGroup();

        function updateCityLabels(isLight) {
            cityLabelsGroup.clearLayers();
            majorCities.forEach(city => {
                const textCol = isLight ? '#0f172a' : '#ffffff';
                const shadowCol = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.95)';
                const icon = L.divIcon({
                    className: 'custom-city-label',
                    html: `<div style="font-weight: bold; font-size: 0.85rem; color: ${textCol}; text-shadow: 0 0 3px ${shadowCol}, 0 0 4px ${shadowCol}, 0 0 5px ${shadowCol}; white-space: nowrap; pointer-events: none;">${city.name}</div>`,
                    iconSize: [80, 20],
                    iconAnchor: [40, 10]
                });
                L.marker([city.lat, city.lon], {icon: icon, interactive: false}).addTo(cityLabelsGroup);
            });
        }

        updateCityLabels(false);

        const basemaps = {
            "Ciemny (Dark)": darkBase,
            "Jasny (Light)": lightBase,
            "Rzeźba terenu (Hillshade)": hillshadeBase,
            "Topograficzna (OpenTopo)": openTopoBase,
            "Fizyczna (World Topo)": esriTopoBase
        };
        basemaps["Ciemny (Dark)"].addTo(map);
        cityLabelsGroup.addTo(map);

        map.on('baselayerchange', function(e) {
            const nameLower = (e.name || '').toLowerCase();
            const isLight = nameLower.includes('jasny') || nameLower.includes('topo') || nameLower.includes('rzeźba');
            if (typeof updateBoundariesStyle === 'function') updateBoundariesStyle(isLight);
            updateCityLabels(isLight);
        });

        // ----------------------------------------------------
        // OFICJALNA SKALA ODBICIOWOŚCI RADAROWEJ IMGW (dBZ)
        // ----------------------------------------------------
        window.IMGW_RADAR_SCALE = [
            [0, [0, 0, 0, 0]],
            [3, [4, 5, 147, 20]],
            [8, [4, 5, 147, 100]],
            [10, [31, 72, 216, 180]],
            [12, [58, 126, 231, 230]],
            [14, [86, 181, 247, 255]],
            [16, [109, 201, 252, 255]],
            [17, [121, 211, 248, 255]],
            [20, [174, 233, 251, 255]],
            [23, [231, 248, 255, 255]],
            [25, [253, 252, 224, 255]],
            [27, [253, 246, 158, 255]],
            [28, [254, 241, 136, 255]],
            [30, [249, 232, 90, 255]],
            [32, [245, 206, 77, 255]],
            [34, [239, 151, 54, 255]],
            [36, [233, 98, 43, 255]],
            [37, [236, 73, 38, 255]],
            [40, [184, 37, 29, 255]],
            [43, [159, 30, 34, 255]],
            [44, [149, 29, 39, 255]],
            [46, [142, 28, 51, 255]],
            [47, [159, 31, 79, 255]],
            [50, [187, 42, 135, 255]],
            [53, [210, 55, 172, 255]],
            [55, [219, 72, 189, 255]],
            [56, [221, 79, 197, 255]],
            [59, [203, 144, 198, 255]],
            [65, [180, 100, 180, 255]],
            [100, [0, 0, 0, 255]],
            [101, [0, 0, 0, 0]],
            [255, [0, 0, 0, 0]]
        ];

        window.getIMGWRadarColor = function(dbz) {
            if (dbz <= 0) return [0, 0, 0, 0];
            const lut = window.IMGW_RADAR_SCALE;
            for (let i = 0; i < lut.length - 1; i++) {
                if (dbz >= lut[i][0] && dbz <= lut[i+1][0]) {
                    return lut[i][1];
                }
            }
            return lut[lut.length - 1][1];
        };

        // ----------------------------------------------------
        // RADAR OPADÓW (IMGW CMAX POLCOMP 4h / RainViewer)
        // ----------------------------------------------------
        let activeRadarSource = 'rv'; // Domyślnie radar RainViewer
        let radarTileLayer = null, radarHost = '', radarFrames = [], currentFrame = 0, animationTimer = null;
        let imgwRadarOverlay = null, imgwFrames = [];
        // Precyzyjnie skalibrowany Bounding Box z metadanych HDF5 POLRAD POLCOMP (+proj=aeqd)
        const IMGW_RADAR_BOUNDS = [[48.2985, 12.4411], [56.3277, 25.6641]];

        function generateImgwRadarFrames() {
            const now = new Date();
            const frames = [];
            // Ostatnie 4 godziny (48 skanów co 5 minut)
            // IMGW publikuje skany z opóźnieniem ok. 2-3 minut
            for (let i = 47; i >= 0; i--) {
                const d = new Date(now.getTime() - (i * 5 + 3) * 60000);
                const utcYear = d.getUTCFullYear();
                const utcMonth = String(d.getUTCMonth() + 1).padStart(2, '0');
                const utcDay = String(d.getUTCDate()).padStart(2, '0');
                const utcHours = String(d.getUTCHours()).padStart(2, '0');
                const min5 = String(Math.floor(d.getUTCMinutes() / 5) * 5).padStart(2, '0');
                
                const ts = `${utcYear}${utcMonth}${utcDay}${utcHours}${min5}`;
                const localLabel = d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
                const url = `https://danepubliczne.imgw.pl/pl/datastore/getfiledown/Oper/Polrad/Produkty/POLCOMP/COMPO_CMAX_250.comp.cmax/${ts}0000dBZ.cmax_echoOnly.png`;
                
                if (!frames.some(f => f.ts === ts)) {
                    frames.push({ ts, url, time: Math.floor(d.getTime() / 1000), label: localLabel });
                }
            }
            return frames;
        }

        // Inicjalizacja klatek IMGW
        imgwFrames = generateImgwRadarFrames();

        // Źródło RainViewer
        fetch('https://api.rainviewer.com/public/weather-maps.json')
            .then(res => res.json())
            .then(data => {
                radarHost = data.host;
                radarFrames = data.radar.past.concat(data.radar.nowcast);
                if (activeRadarSource === 'rv') {
                    initRadarSlider();
                    showFrame(currentFrame);
                }
            })
            .catch(err => console.error("Błąd pobierania danych RainViewer:", err));

        function initRadarSlider() {
            const count = activeRadarSource === 'imgw' ? imgwFrames.length : radarFrames.length;
            const slider = document.getElementById('rv-slider');
            if (slider && count > 0) {
                slider.max = count - 1;
                slider.value = count - 1;
                currentFrame = count - 1;
            }
        }

        window.setRadarSource = function(src) {
            activeRadarSource = src;
            const btnImgw = document.getElementById('radar-src-imgw');
            const btnRv = document.getElementById('radar-src-rv');
            
            if (src === 'imgw') {
                if (btnImgw) { btnImgw.className = 'btn btn-primary'; }
                if (btnRv) { btnRv.className = 'btn btn-ghost'; btnRv.style.border = '1px solid var(--border-subtle)'; }
                if (radarTileLayer && map.hasLayer(radarTileLayer)) map.removeLayer(radarTileLayer);
                imgwFrames = generateImgwRadarFrames();
            } else {
                if (btnRv) { btnRv.className = 'btn btn-primary'; }
                if (btnImgw) { btnImgw.className = 'btn btn-ghost'; btnImgw.style.border = '1px solid var(--border-subtle)'; }
                if (imgwRadarOverlay && map.hasLayer(imgwRadarOverlay)) map.removeLayer(imgwRadarOverlay);
            }
            
            initRadarSlider();
            showFrame(currentFrame);
        };

        // ----------------------------------------------------
        // SATELITA (Dzienny HRV HD + Nocny IR Podczerwień)
        // ----------------------------------------------------
        map.createPane('satelliteNightPane');
        map.getPane('satelliteNightPane').style.zIndex = 250;

        // Dzienny: European High-Resolution Visible (RGB Eview)
        const satelliteDayLayer = L.tileLayer.wms('https://view.eumetsat.int/geoserver/ows', {
            layers: 'msg_fes:rgb_eview',
            format: 'image/png',
            transparent: true,
            opacity: 0.68,
            pane: 'satellitePane',
            maxNativeZoom: 7,
            maxZoom: 18,
            attribution: '© EUMETSAT HRV'
        });

        // Nocny / IR: Meteosat Third Generation FCI High-Rate IR 10.5 µm
        const satelliteNightLayer = L.tileLayer.wms('https://view.eumetsat.int/geoserver/ows', {
            layers: 'mtg_fd:ir105_hrfi',
            format: 'image/png',
            transparent: true,
            opacity: 0.52,
            pane: 'satelliteNightPane',
            maxNativeZoom: 7,
            maxZoom: 18,
            attribution: '© EUMETSAT MTG-IR'
        });

        // Synchronizacja czasu satelity (kwantyzacja do najbliższego skanu 15-minutowego)
        let lastSatSyncTime = null;
        function syncSatelliteTime(timeUnixSec) {
            if (!timeUnixSec) return;
            const isSatDay = window.MAP_LAYERS && window.MAP_LAYERS['sat_day'] && window.MAP_LAYERS['sat_day'].visible;
            const isSatNight = window.MAP_LAYERS && window.MAP_LAYERS['sat_night'] && window.MAP_LAYERS['sat_night'].visible;
            if (!isSatDay && !isSatNight) return;

            const d = new Date(timeUnixSec * 1000);
            const min15 = Math.floor(d.getUTCMinutes() / 15) * 15;
            d.setUTCMinutes(min15, 0, 0);
            const timeStr = d.toISOString().replace('.000Z', 'Z');

            if (lastSatSyncTime === timeStr) return;
            lastSatSyncTime = timeStr;

            if (isSatDay && satelliteDayLayer) satelliteDayLayer.setParams({ time: timeStr });
            if (isSatNight && satelliteNightLayer) satelliteNightLayer.setParams({ time: timeStr });
        }

        function showFrame(index) {
            currentFrame = parseInt(index);
            const timeEl = document.getElementById('rv-time');
            const currentRadarOpacity = (window.MAP_LAYERS && window.MAP_LAYERS['radar'] && window.MAP_LAYERS['radar'].opacity !== undefined) ? (window.MAP_LAYERS['radar'].opacity / 100.0) : 0.87;

            if (activeRadarSource === 'imgw') {
                if (!imgwFrames[currentFrame]) return;
                const frame = imgwFrames[currentFrame];
                
                if (!imgwRadarOverlay) {
                    imgwRadarOverlay = L.imageOverlay(frame.url, IMGW_RADAR_BOUNDS, {
                        opacity: currentRadarOpacity,
                        pane: 'radarPane'
                    });
                } else {
                    imgwRadarOverlay.setUrl(frame.url);
                    imgwRadarOverlay.setOpacity(currentRadarOpacity);
                }

                if (window.MAP_LAYERS && window.MAP_LAYERS['radar'].visible) {
                    if (!map.hasLayer(imgwRadarOverlay)) imgwRadarOverlay.addTo(map);
                }
                if (timeEl) timeEl.textContent = frame.label;
                syncSatelliteTime(frame.time);
            } else {
                if (!radarFrames[currentFrame]) return;
                const frame = radarFrames[currentFrame];
                
                if (!radarTileLayer) {
                    radarTileLayer = L.tileLayer(`${radarHost}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`, {
                        opacity: currentRadarOpacity, 
                        pane: 'radarPane',
                        maxZoom: 18,
                        maxNativeZoom: 8
                    });
                } else {
                    radarTileLayer.setUrl(`${radarHost}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`);
                    radarTileLayer.setOpacity(currentRadarOpacity);
                }

                if (window.MAP_LAYERS && window.MAP_LAYERS['radar'].visible) {
                    if (!map.hasLayer(radarTileLayer)) radarTileLayer.addTo(map);
                }
                if (timeEl) timeEl.textContent = new Date(frame.time * 1000).toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'});
                syncSatelliteTime(frame.time);
            }
        }

        // Start domyślnego radaru IMGW
        initRadarSlider();
        showFrame(currentFrame);

        const rvSlider = document.getElementById('rv-slider');
        if (rvSlider) rvSlider.addEventListener('input', e => showFrame(parseInt(e.target.value)));
        
        const rvPlayBtn = document.getElementById('rv-play-btn');
        if (rvPlayBtn) {
            rvPlayBtn.addEventListener('click', e => {
                const btn = e.currentTarget;
                if (animationTimer) {
                    clearInterval(animationTimer); animationTimer = null;
                    btn.innerHTML = '<i data-lucide="play"></i>';
                } else {
                    btn.innerHTML = '<i data-lucide="pause"></i>';
                    const maxFrames = activeRadarSource === 'imgw' ? imgwFrames.length : radarFrames.length;
                    if(currentFrame >= maxFrames - 1) currentFrame = 0;
                    animationTimer = setInterval(() => {
                        const count = activeRadarSource === 'imgw' ? imgwFrames.length : radarFrames.length;
                        currentFrame = currentFrame >= count - 1 ? 0 : currentFrame + 1;
                        if (document.getElementById('rv-slider')) document.getElementById('rv-slider').value = currentFrame;
                        showFrame(currentFrame);
                    }, 500);
                }
                if (typeof lucide !== 'undefined') lucide.createIcons();
            });
        }

        // ----------------------------------------------------
        // GRANICE PAŃSTW I WOJEWÓDZTW (Subtelny obrys wektorowy nad chmurami/radarem)
        // ----------------------------------------------------
        map.createPane('boundariesPane');
        map.getPane('boundariesPane').style.zIndex = 500;
        map.getPane('boundariesPane').style.pointerEvents = 'none';

        const boundariesLayerGroup = L.layerGroup([], { pane: 'boundariesPane' });
        let countriesGeoLayer = null;
        let provincesGeoLayer = null;
        let isCurrentThemeLight = false;

        window.updateBoundariesStyle = function(isLight) {
            isCurrentThemeLight = isLight;
            if (countriesGeoLayer) {
                countriesGeoLayer.setStyle({
                    color: isLight ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.75)',
                    weight: 1.5,
                    dashArray: '4, 4',
                    fill: false
                });
            }
            if (provincesGeoLayer) {
                provincesGeoLayer.setStyle({
                    color: isLight ? 'rgba(51, 65, 85, 0.65)' : 'rgba(255, 255, 255, 0.45)',
                    weight: 1.1,
                    dashArray: '2, 3',
                    fill: false
                });
            }
        };

        // Granice państw Europy
        fetch('assets/geo/europe_countries.json')
            .then(res => res.json())
            .then(data => {
                countriesGeoLayer = L.geoJSON(data, {
                    pane: 'boundariesPane',
                    style: {
                        color: isCurrentThemeLight ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.75)',
                        weight: 1.5,
                        dashArray: '4, 4',
                        fill: false,
                        interactive: false
                    }
                }).addTo(boundariesLayerGroup);
            })
            .catch(err => console.error("Błąd ładowania granic państw:", err));

        // Granice województw Polski
        fetch('assets/geo/wojewodztwa.geojson')
            .then(res => res.json())
            .then(data => {
                provincesGeoLayer = L.geoJSON(data, {
                    pane: 'boundariesPane',
                    style: {
                        color: isCurrentThemeLight ? 'rgba(51, 65, 85, 0.65)' : 'rgba(255, 255, 255, 0.45)',
                        weight: 1.1,
                        dashArray: '2, 3',
                        fill: false,
                        interactive: false
                    }
                }).addTo(boundariesLayerGroup);
            })
            .catch(err => console.error("Błąd ładowania granic województw:", err));

        // ----------------------------------------------------
        // WYŁADOWANIA LIVE (Blitzortung WebSocket + Vector Points)
        // ----------------------------------------------------
        const lightningLayerGroup = L.layerGroup([], { pane: 'lightningPane' });
        let activeStrikes = [];
        let boSocket = null;
        let boReconnectTimer = null;
        let boRefreshInterval = null;

        function decodeBlitzortung(b) {
            let e = {};
            let d = b.split('');
            let c = d[0];
            let f = c;
            let g = [c];
            let h = 256;
            let o = h;
            for (let i = 1; i < d.length; i++) {
                let a = d[i].charCodeAt(0);
                a = h > a ? d[i] : (e[a] ? e[a] : f + c);
                g.push(a);
                c = a.charAt(0);
                e[o] = f + c;
                o++;
                f = a;
            }
            return g.join('');
        }

        function getStrikeStyle(ageMinutes) {
            if (ageMinutes < 5) {
                return { radius: 5.5, color: '#ffffff', fillColor: '#ffffff', fillOpacity: 0.95, weight: 2 };
            } else if (ageMinutes < 15) {
                return { radius: 4.5, color: '#eab308', fillColor: '#fde047', fillOpacity: 0.9, weight: 1.5 };
            } else if (ageMinutes < 30) {
                return { radius: 4, color: '#f97316', fillColor: '#fb923c', fillOpacity: 0.85, weight: 1 };
            } else if (ageMinutes < 60) {
                return { radius: 3.5, color: '#ef4444', fillColor: '#f87171', fillOpacity: 0.75, weight: 1 };
            } else {
                return { radius: 3, color: '#7f1d1d', fillColor: '#991b1b', fillOpacity: 0.6, weight: 0.8 };
            }
        }

        function refreshStrikeStyles() {
            const now = Date.now();
            activeStrikes = activeStrikes.filter(s => {
                const ageMin = (now - s.time) / 60000;
                if (ageMin >= 120) {
                    if (s.marker) lightningLayerGroup.removeLayer(s.marker);
                    return false;
                }
                if (s.marker) {
                    const st = getStrikeStyle(ageMin);
                    s.marker.setStyle(st);
                    s.marker.setRadius(st.radius);
                }
                return true;
            });
            updateStrikeCounterUI();
        }

        function updateStrikeCounterUI() {
            const countEl = document.getElementById('bo-strike-count');
            if (countEl) {
                if (activeStrikes.length > 0) {
                    countEl.textContent = `(${activeStrikes.length})`;
                } else {
                    countEl.textContent = '';
                }
            }
        }

        function initBlitzortungWS() {
            if (boSocket) {
                try { boSocket.close(); } catch(e) {}
                boSocket = null;
            }
            if (boReconnectTimer) clearTimeout(boReconnectTimer);

            const hosts = ['wss://ws1.blitzortung.org/', 'wss://ws7.blitzortung.org/', 'wss://ws8.blitzortung.org/'];
            const host = hosts[Math.floor(Math.random() * hosts.length)];
            
            try {
                boSocket = new WebSocket(host);
                boSocket.onopen = () => {
                    boSocket.send(JSON.stringify({ a: 111 }));
                };
                boSocket.onmessage = (event) => {
                    try {
                        const decoded = decodeBlitzortung(event.data);
                        const strike = JSON.parse(decoded);
                        if (strike && strike.lat && strike.lon) {
                            if (strike.lat >= 35 && strike.lat <= 65 && strike.lon >= -15 && strike.lon <= 35) {
                                addStrikePoint(strike);
                            }
                        }
                    } catch(err) {}
                };
                boSocket.onerror = () => {
                    if (window.MAP_LAYERS && window.MAP_LAYERS['lightning'].visible) {
                        boReconnectTimer = setTimeout(initBlitzortungWS, 4000);
                    }
                };
                boSocket.onclose = () => {
                    if (window.MAP_LAYERS && window.MAP_LAYERS['lightning'].visible) {
                        boReconnectTimer = setTimeout(initBlitzortungWS, 3000);
                    }
                };
            } catch(err) {
                console.error("Blitzortung connect err:", err);
            }
        }

        function addStrikePoint(strike) {
            const now = Date.now();
            const strikeTime = strike.time ? (strike.time > 1e15 ? Math.floor(strike.time / 1000000) : strike.time) : now;
            const ageMin = Math.max(0, (now - strikeTime) / 60000);
            
            const st = getStrikeStyle(ageMin);
            const marker = L.circleMarker([strike.lat, strike.lon], {
                ...st,
                pane: 'lightningPane'
            });

            const timeStr = new Date(strikeTime).toLocaleTimeString('pl-PL');
            marker.bindTooltip(` Wyładowanie: ${timeStr}<br>Pozycja: ${strike.lat.toFixed(3)}°N, ${strike.lon.toFixed(3)}°E`, { sticky: true });
            
            marker.addTo(lightningLayerGroup);
            activeStrikes.push({ lat: strike.lat, lon: strike.lon, time: strikeTime, marker });
            
            if (activeStrikes.length > 1500) {
                const oldest = activeStrikes.shift();
                if (oldest.marker) lightningLayerGroup.removeLayer(oldest.marker);
            }
            updateStrikeCounterUI();
        }

        boRefreshInterval = setInterval(refreshStrikeStyles, 10000);

        // ----------------------------------------------------
        // MENEDŻER WARSTW (Domyślna kolejność, widoczność i krycie wg preferencji)
        // ----------------------------------------------------
        window.MAP_LAYERS = {
            'boundaries': { id: 'boundaries', name: 'Granice',          visible: true,  opacity: 100, pane: 'boundariesPane' },
            'drawings':   { id: 'drawings',   name: 'Rysowanie',        visible: false, opacity: 100, pane: 'drawingsPane' },
            'stations':   { id: 'stations',   name: 'Stacje',           visible: true,  opacity: 100, pane: 'stationsPane' },
            'lightning':  { id: 'lightning',  name: 'Wyładowania',      visible: true,  opacity: 95,  pane: 'lightningPane' },
            'radar':      { id: 'radar',      name: 'Radar',            visible: false, opacity: 68,  pane: 'radarPane' },
            'inter':      { id: 'inter',      name: 'Interpolacja',     visible: true,  opacity: 88,  pane: 'weatherPane' },
            'sat_day':    { id: 'sat_day',    name: 'Satelita (dzień)', visible: true,  opacity: 68,  pane: 'satellitePane' },
            'sat_night':  { id: 'sat_night',  name: 'Satelita (noc)',   visible: false, opacity: 52,  pane: 'satelliteNightPane' }
        };

        // Domyślna kolejność od góry (wierzch) do dołu
        window.layerOrder = ['boundaries', 'drawings', 'stations', 'lightning', 'radar', 'inter', 'sat_day', 'sat_night'];

        // Wczytaj zapisany stan z localStorage jeśli istnieje
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
        } catch(e) {}

        function saveLayerState() {
            try {
                localStorage.setItem('meteo_map_layers_v5', JSON.stringify(window.MAP_LAYERS));
                localStorage.setItem('meteo_map_order_v5', JSON.stringify(window.layerOrder));
            } catch(e) {}
        }

        window.applyLayerOrder = function() {
            const total = window.layerOrder.length;
            window.layerOrder.forEach((key, idx) => {
                const item = window.MAP_LAYERS[key];
                if (item && item.pane && map.getPane(item.pane)) {
                    // idx 0 to wierzch (najwyższy z-index)
                    const z = 240 + (total - idx) * 30;
                    map.getPane(item.pane).style.zIndex = z;
                }
            });
            saveLayerState();
        };

        window.moveLayer = function(key, dir) {
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

        window.toggleLayer = function(key, isChecked) {
            if (!window.MAP_LAYERS[key]) return;
            window.MAP_LAYERS[key].visible = isChecked;
            saveLayerState();
            
            if (key === 'drawings') {
                const secDraw = document.getElementById('section-rysowanie');
                if (secDraw) {
                    secDraw.style.display = isChecked ? 'block' : 'none';
                }
            } else if (key === 'sat_day') {
                if (isChecked) {
                    if (!map.hasLayer(satelliteDayLayer)) map.addLayer(satelliteDayLayer);
                    const activeTime = activeRadarSource === 'imgw' ? (imgwFrames[currentFrame]?.time) : (radarFrames[currentFrame]?.time);
                    if (activeTime) syncSatelliteTime(activeTime);
                } else {
                    if (map.hasLayer(satelliteDayLayer)) map.removeLayer(satelliteDayLayer);
                }
            } else if (key === 'sat_night') {
                if (isChecked) {
                    if (!map.hasLayer(satelliteNightLayer)) map.addLayer(satelliteNightLayer);
                    const activeTime = activeRadarSource === 'imgw' ? (imgwFrames[currentFrame]?.time) : (radarFrames[currentFrame]?.time);
                    if (activeTime) syncSatelliteTime(activeTime);
                } else {
                    if (map.hasLayer(satelliteNightLayer)) map.removeLayer(satelliteNightLayer);
                }
            } else if (key === 'boundaries') {
                if (isChecked) { if (!map.hasLayer(boundariesLayerGroup)) map.addLayer(boundariesLayerGroup); }
                else { if (map.hasLayer(boundariesLayerGroup)) map.removeLayer(boundariesLayerGroup); }
            } else if (key === 'lightning') {
                if (isChecked) {
                    if (!map.hasLayer(lightningLayerGroup)) map.addLayer(lightningLayerGroup);
                    if (!boSocket || boSocket.readyState !== WebSocket.OPEN) initBlitzortungWS();
                } else {
                    if (map.hasLayer(lightningLayerGroup)) map.removeLayer(lightningLayerGroup);
                }
            } else if (key === 'radar') {
                if (isChecked) {
                    if (activeRadarSource === 'imgw') {
                        if (imgwRadarOverlay) {
                            if (!map.hasLayer(imgwRadarOverlay)) map.addLayer(imgwRadarOverlay);
                        } else {
                            showFrame(currentFrame);
                        }
                    } else {
                        if (radarTileLayer) {
                            if (!map.hasLayer(radarTileLayer)) map.addLayer(radarTileLayer);
                        } else {
                            showFrame(currentFrame);
                        }
                    }
                } else {
                    if (imgwRadarOverlay && map.hasLayer(imgwRadarOverlay)) map.removeLayer(imgwRadarOverlay);
                    if (radarTileLayer && map.hasLayer(radarTileLayer)) map.removeLayer(radarTileLayer);
                }
            } else if (key === 'inter' || key === 'stations') {
                window.renderIMGW();
            }
        };

        window.setLayerOpacity = function(key, val) {
            const op = parseInt(val) / 100.0;
            if (window.MAP_LAYERS[key]) window.MAP_LAYERS[key].opacity = parseInt(val);
            saveLayerState();
            
            if (key === 'sat_day' && satelliteDayLayer) satelliteDayLayer.setOpacity(op);
            else if (key === 'sat_night' && satelliteNightLayer) satelliteNightLayer.setOpacity(op);
            else if (key === 'boundaries') {
                boundariesLayerGroup.eachLayer(l => {
                    if (l.setStyle) l.setStyle({ opacity: op });
                });
            }
            else if (key === 'lightning') {
                activeStrikes.forEach(s => {
                    if (s.marker) s.marker.setStyle({ fillOpacity: op, opacity: op });
                });
            }
            else if (key === 'radar') {
                if (radarTileLayer) radarTileLayer.setOpacity(op);
                if (imgwRadarOverlay) imgwRadarOverlay.setOpacity(op);
            }
            else if (key === 'inter' && idwOverlay) idwOverlay.setOpacity(op);
        };

        window.renderLayerManagerUI = function() {
            const container = document.getElementById('layer-manager-list');
            if (!container) return;
            
            container.innerHTML = window.layerOrder.map((key, idx) => {
                const item = window.MAP_LAYERS[key];
                if (!item) return '';
                const isTop = idx === 0;
                const isBottom = idx === window.layerOrder.length - 1;
                const extraInfo = key === 'lightning' ? ` <span id="bo-strike-count" style="font-size: 0.65rem; color: #eab308; font-weight: normal;"></span>` : '';
                return `
                    <div class="layer-item-card" style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 7px 10px; display: flex; flex-direction: column; gap: 5px;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; margin: 0; color: var(--text-primary);">
                                <input type="checkbox" ${item.visible ? 'checked' : ''} onchange="window.toggleLayer('${key}', this.checked)">
                                <span>${item.name}${extraInfo}</span>
                            </label>
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
                    </div>
                `;
            }).join('');
        };

        // Automatyczny start warstw jeśli są włączone
        if (window.MAP_LAYERS['boundaries'] && window.MAP_LAYERS['boundaries'].visible) {
            boundariesLayerGroup.addTo(map);
        }
        if (window.MAP_LAYERS['sat_day'] && window.MAP_LAYERS['sat_day'].visible) {
            satelliteDayLayer.addTo(map);
        }
        if (window.MAP_LAYERS['sat_night'] && window.MAP_LAYERS['sat_night'].visible) {
            satelliteNightLayer.addTo(map);
        }
        if (window.MAP_LAYERS['lightning'].visible) {
            lightningLayerGroup.addTo(map);
            initBlitzortungWS();
        }

        window.applyLayerOrder();
        window.renderLayerManagerUI();

        // Stan początkowy sekcji rysowania w panelu bocznym
        const initialDrawSec = document.getElementById('section-rysowanie');
        if (initialDrawSec) {
            initialDrawSec.style.display = (window.MAP_LAYERS['drawings'] && window.MAP_LAYERS['drawings'].visible) ? 'block' : 'none';
        }

        // ----------------------------------------------------
        // PEŁNY EKRAN I ZWIJANIE PANELU BOCZNEGO
        // ----------------------------------------------------
        window.toggleMapFullscreen = function() {
            const container = document.querySelector('.map-dashboard-container');
            const fsBtn = document.getElementById('map-fs-btn');
            if (!container) return;

            const isFs = container.classList.toggle('map-fullscreen');

            if (isFs) {
                if (fsBtn) fsBtn.innerHTML = '<i data-lucide="minimize" id="map-fs-icon" style="width: 16px; height: 16px;"></i>';
                if (container.requestFullscreen && !document.fullscreenElement) {
                    container.requestFullscreen().catch(() => {});
                }
            } else {
                if (fsBtn) fsBtn.innerHTML = '<i data-lucide="maximize" id="map-fs-icon" style="width: 16px; height: 16px;"></i>';
                if (document.fullscreenElement && document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                }
            }

            if (typeof lucide !== 'undefined') lucide.createIcons();
            
            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 150);
        };

        window.toggleMapSidebar = function() {
            const sidebar = document.getElementById('map-sidebar');
            const icon = document.getElementById('sidebar-toggle-icon');
            if (!sidebar) return;

            const isHidden = sidebar.classList.toggle('sidebar-collapsed');
            if (icon) {
                icon.setAttribute('data-lucide', isHidden ? 'panel-left-open' : 'panel-left-close');
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();

            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 100);
        };

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const container = document.querySelector('.map-dashboard-container');
                if (container && container.classList.contains('map-fullscreen')) {
                    window.toggleMapFullscreen();
                }
            }
        });

        document.addEventListener('fullscreenchange', () => {
            const container = document.querySelector('.map-dashboard-container');
            const fsBtn = document.getElementById('map-fs-btn');
            if (container && !document.fullscreenElement && container.classList.contains('map-fullscreen')) {
                container.classList.remove('map-fullscreen');
                if (fsBtn) fsBtn.innerHTML = '<i data-lucide="maximize" id="map-fs-icon" style="width: 16px; height: 16px;"></i>';
                if (typeof lucide !== 'undefined') lucide.createIcons();
                setTimeout(() => { if (map) map.invalidateSize(); }, 150);
            }
        });

        // ----------------------------------------------------
        // IMGW DATA (Firebase + IDW Interpolation)
        // ----------------------------------------------------
        let imgwData = null;
        let idwOverlay = null;
        const imgwLayerGroup = L.layerGroup().addTo(map);

        // ----------------------------------------------------
        // OFICJALNE SKALE KOLORYSTYCZNE IMGW
        // ----------------------------------------------------
        const DEFAULT_TEMP_COLORSCALE = [
            [0.0, "#f4c2f4"], [0.055, "#e020e0"], [0.111, "#8a2be2"], [0.166, "#4b0082"],
            [0.222, "#000080"], [0.277, "#0000ff"], [0.333, "#1e90ff"], [0.388, "#00bfff"],
            [0.444, "#00ffff"], [0.5, "#00fa9a"], [0.555, "#32cd32"], [0.611, "#adff2f"],
            [0.666, "#ffd700"], [0.722, "#ffa500"], [0.777, "#ff4500"], [0.833, "#ff0000"],
            [0.888, "#8b0000"], [0.944, "#5c4033"], [1.0, "#808080"]
        ];

        function _calcWndNorm(kmh, mx=259) { return +(kmh/mx).toFixed(4); }
        const DEFAULT_WIND_COLORSCALE = [
            [0.0, "#FFFFFF"], [_calcWndNorm(9), "#C8FFFF"], [_calcWndNorm(19), "#00FFFF"], [_calcWndNorm(28), "#0088FF"],
            [_calcWndNorm(37), "#0000CD"], [_calcWndNorm(46), "#00C800"], [_calcWndNorm(56), "#80FF00"],
            [_calcWndNorm(65), "#FFFF00"], [_calcWndNorm(74), "#FFD700"], [_calcWndNorm(83), "#FFA500"],
            [_calcWndNorm(93), "#FF4500"], [_calcWndNorm(102), "#FF0000"], [_calcWndNorm(111), "#CC0000"],
            [_calcWndNorm(120), "#800000"], [_calcWndNorm(130), "#800080"], [_calcWndNorm(139), "#4B0082"],
            [_calcWndNorm(148), "#FF00FF"], [_calcWndNorm(157), "#FF69B4"], [_calcWndNorm(167), "#808080"],
            [_calcWndNorm(176), "#606060"], [_calcWndNorm(185), "#404040"], [_calcWndNorm(194), "#303030"],
            [_calcWndNorm(204), "#202020"], [1.0, "#000000"]
        ];

        const DEFAULT_HUMIDITY_COLORSCALE = [
            [0.0, "#FFD700"], [0.25, "#FF8C00"], [0.5, "#32CD32"], [0.75, "#1E90FF"], [1.0, "#00008B"]
        ];

        const DEFAULT_DEWPOINT_COLORSCALE = [
            [0.0, "#0000FF"], [0.26, "#00BFFF"], [0.39, "#00FF7F"], [0.53, "#ADFF2F"],
            [0.66, "#FFD700"], [0.79, "#FF4500"], [0.92, "#FF0000"], [1.0, "#8B0000"]
        ];

                // Baza współrzędnych stacji synoptycznych IMGW-PIB (WGS84)
        // Źródło: IMGW-PIB Dane Publiczne API Synop (https://danepubliczne.imgw.pl/api/data/synop)
        const SYNOP_STATIONS_COORDS = {
            '12001': { lat: 55.40, lon: 18.15, name: 'Platforma' },
            '12100': { lat: 54.18, lon: 16.18, name: 'Kołobrzeg' },
            '12105': { lat: 54.20, lon: 16.18, name: 'Koszalin' },
            '12115': { lat: 54.58, lon: 16.85, name: 'Ustka' },
            '12120': { lat: 54.75, lon: 17.53, name: 'Łeba' },
            '12125': { lat: 54.60, lon: 18.80, name: 'Hel' },
            '12135': { lat: 54.38, lon: 18.47, name: 'Gdańsk-Rębiechowo' },
            '12145': { lat: 54.17, lon: 19.43, name: 'Elbląg-Milejewo' },
            '12155': { lat: 53.78, lon: 20.48, name: 'Olsztyn' },
            '12160': { lat: 53.78, lon: 21.57, name: 'Mikołajki' },
            '12185': { lat: 54.10, lon: 22.93, name: 'Suwałki' },
            '12195': { lat: 54.13, lon: 22.95, name: 'Suwałki' },
            '12200': { lat: 53.92, lon: 14.23, name: 'Świnoujście' },
            '12205': { lat: 53.40, lon: 14.62, name: 'Szczecin-Dąbie' },
            '12210': { lat: 53.77, lon: 15.40, name: 'Resko' },
            '12215': { lat: 53.18, lon: 15.53, name: 'Resko' },
            '12230': { lat: 53.13, lon: 16.75, name: 'Piła' },
            '12235': { lat: 53.10, lon: 18.00, name: 'Bydgoszcz-Szwederowo' },
            '12250': { lat: 53.03, lon: 18.60, name: 'Toruń' },
            '12270': { lat: 53.12, lon: 20.37, name: 'Mława' },
            '12272': { lat: 52.63, lon: 20.38, name: 'Płońsk' },
            '12280': { lat: 53.18, lon: 22.05, name: 'Łomża' },
            '12285': { lat: 53.13, lon: 22.50, name: 'Białystok' },
            '12295': { lat: 53.10, lon: 23.17, name: 'Białystok-Krywlany' },
            '12300': { lat: 52.73, lon: 15.23, name: 'Gorzów Wielkopolski' },
            '12310': { lat: 52.35, lon: 14.60, name: 'Słubice' },
            '12330': { lat: 52.42, lon: 16.83, name: 'Poznań-Ławica' },
            '12345': { lat: 52.20, lon: 18.67, name: 'Koło' },
            '12358': { lat: 52.55, lon: 19.68, name: 'Płock' },
            '12360': { lat: 52.55, lon: 19.68, name: 'Płock' },
            '12375': { lat: 52.17, lon: 20.97, name: 'Warszawa-Okęcie' },
            '12385': { lat: 52.17, lon: 22.25, name: 'Siedlce' },
            '12399': { lat: 52.03, lon: 23.13, name: 'Biała Podlaska' },
            '12400': { lat: 51.93, lon: 15.53, name: 'Zielona Góra' },
            '12415': { lat: 51.20, lon: 16.17, name: 'Legnica' },
            '12418': { lat: 51.83, lon: 16.53, name: 'Leszno' },
            '12424': { lat: 51.10, lon: 16.88, name: 'Wrocław-Strachowice' },
            '12425': { lat: 51.13, lon: 17.03, name: 'Wrocław' },
            '12435': { lat: 51.78, lon: 18.08, name: 'Kalisz' },
            '12455': { lat: 51.22, lon: 18.57, name: 'Wieluń' },
            '12465': { lat: 51.73, lon: 19.40, name: 'Łódź-Lublinek' },
            '12469': { lat: 51.97, lon: 20.15, name: 'Skierniewice' },
            '12472': { lat: 51.55, lon: 21.57, name: 'Kozienice' },
            '12485': { lat: 51.42, lon: 21.20, name: 'Radom-Sadków' },
            '12488': { lat: 51.55, lon: 21.87, name: 'Dęblin' },
            '12495': { lat: 51.22, lon: 22.40, name: 'Lublin-Radawiec' },
            '12497': { lat: 51.55, lon: 23.53, name: 'Włodawa' },
            '12500': { lat: 50.90, lon: 15.80, name: 'Jelenia Góra' },
            '12510': { lat: 50.73, lon: 15.73, name: 'Śnieżka' },
            '12520': { lat: 50.43, lon: 16.65, name: 'Kłodzko' },
            '12530': { lat: 50.67, lon: 17.95, name: 'Opole' },
            '12540': { lat: 50.08, lon: 18.20, name: 'Racibórz' },
            '12550': { lat: 50.82, lon: 19.10, name: 'Częstochowa' },
            '12560': { lat: 50.23, lon: 19.03, name: 'Katowice-Muchowiec' },
            '12566': { lat: 50.08, lon: 19.80, name: 'Kraków-Balice' },
            '12570': { lat: 50.80, lon: 20.70, name: 'Kielce-Suków' },
            '12575': { lat: 50.03, lon: 20.98, name: 'Tarnów' },
            '12580': { lat: 50.12, lon: 22.05, name: 'Rzeszów-Jasionka' },
            '12585': { lat: 50.70, lon: 23.25, name: 'Zamość' },
            '12595': { lat: 49.80, lon: 22.77, name: 'Przemyśl' },
            '12600': { lat: 49.80, lon: 19.00, name: 'Bielsko-Biała' },
            '12605': { lat: 49.68, lon: 19.20, name: 'Żywiec' },
            '12625': { lat: 49.30, lon: 19.97, name: 'Zakopane' },
            '12650': { lat: 49.23, lon: 19.98, name: 'Kasprowy Wierch' },
            '12660': { lat: 49.62, lon: 20.70, name: 'Nowy Sącz' },
            '12670': { lat: 49.68, lon: 21.77, name: 'Krosno' },
            '12680': { lat: 49.47, lon: 22.33, name: 'Lesko' },
            '12690': { lat: 49.43, lon: 22.58, name: 'Ustrzyki Dolne' },
            '12695': { lat: 49.15, lon: 22.65, name: 'Ustrzyki Górne' }
        };

        const DEFAULT_PRESSURE_COLORSCALE = [
            [0.0,  "#3b0764"], // 980 hPa - bardzo głęboki niż (ciemny fiolet)
            [0.17, "#991b1b"], // 990 hPa - głęboki niż (czerwień)
            [0.33, "#ea580c"], // 1000 hPa - niż (pomarańcz)
            [0.47, "#eab308"], // 1008 hPa - umiarkowany niż (żółć)
            [0.55, "#22c55e"], // 1013 hPa - normalne ciśnienie (zieleń)
            [0.67, "#06b6d4"], // 1020 hPa - umiarkowany wyż (cyan)
            [0.80, "#2563eb"], // 1028 hPa - wyż (błękit)
            [0.92, "#1e1b4b"], // 1035 hPa - silny wyż (granat)
            [1.0,  "#4338ca"]  // 1040 hPa - bardzo silny wyż (indygo)
        ];

        const DEFAULT_LCL_COLORSCALE = [
            [0.0, "#312e81"], [0.15, "#2563eb"], [0.30, "#06b6d4"], [0.45, "#10b981"],
            [0.60, "#eab308"], [0.75, "#f97316"], [0.90, "#ef4444"], [1.0, "#831843"]
        ];

        const DEFAULT_TREND_TEMP_COLORSCALE = [
            [0.0, "#1e3a8a"], [0.2, "#3b82f6"], [0.4, "#93c5fd"],
            [0.5, "#f3f4f6"],
            [0.6, "#fca5a5"], [0.8, "#ef4444"], [1.0, "#991b1b"]
        ];

        const DEFAULT_TREND_HUMIDITY_COLORSCALE = [
            [0.0, "#854d0e"], [0.25, "#d97706"],
            [0.5, "#f3f4f6"],
            [0.75, "#0284c7"], [1.0, "#1e3a8a"]
        ];

        const DEFAULT_SNOW_COLORSCALE = [
            [0.0,  "#fdf2f8"], // 0 cm: bardzo blady pastelowy róż
            [0.08, "#fbcfe8"], // ~5 cm: lekki róż
            [0.20, "#f472b6"], // ~15 cm: nasycony róż
            [0.35, "#ec4899"], // ~30 cm: jaskrawy róż / magenta
            [0.55, "#a855f7"], // ~50 cm: żywy fiolet
            [0.75, "#7e22ce"], // ~75 cm: ciemny fiolet
            [0.90, "#581c87"], // ~90 cm: głęboki fiolet
            [1.0,  "#2e0854"]  // 100+ cm: bardzo ciemny fiolet / oberżyna
        ];

        const DEFAULT_SNOW_SAFETY_COLORSCALE = [
            [0.0,  "#22c55e"], // 0%: bezpiecznie (zielony)
            [0.4,  "#84cc16"], // 40%: limonkowy
            [0.6,  "#eab308"], // 60%: uwaga (żółty)
            [0.8,  "#f97316"], // 80%: podwyższone ryzyko (pomarańczowy)
            [1.0,  "#ef4444"], // 100%: przekroczenie normy (czerwony)
            [1.3,  "#a855f7"]  // 130%+: ekstremalne przekroczenie normy (fiolet)
        ];

        const DEFAULT_COLORS = {
            "TEMP_COLORSCALE": DEFAULT_TEMP_COLORSCALE,
            "WIND_COLORSCALE": DEFAULT_WIND_COLORSCALE,
            "HUMIDITY_COLORSCALE": DEFAULT_HUMIDITY_COLORSCALE,
            "DEWPOINT_COLORSCALE": DEFAULT_DEWPOINT_COLORSCALE,
            "LCL_COLORSCALE": DEFAULT_LCL_COLORSCALE,
            "TREND_TEMP_COLORSCALE": DEFAULT_TREND_TEMP_COLORSCALE,
            "TREND_HUMIDITY_COLORSCALE": DEFAULT_TREND_HUMIDITY_COLORSCALE,
            "SNOW_COLORSCALE": DEFAULT_SNOW_COLORSCALE
        };

        const DEFAULT_ZMIENNE = {
            "temp":             { "nazwa": "Temperatura", "cscale": DEFAULT_TEMP_COLORSCALE, "cmin": -40, "cmax": 50, "unit": "°C", "step": 2.0 },
            "grunt":            { "nazwa": "Temperatura Gruntu", "cscale": DEFAULT_TEMP_COLORSCALE, "cmin": -40, "cmax": 50, "unit": "°C", "step": 2.0 },
            "rosy":             { "nazwa": "Punkt Rosy", "cscale": DEFAULT_DEWPOINT_COLORSCALE, "cmin": -10, "cmax": 28, "unit": "°C", "step": 2.0 },
            "wilg":             { "nazwa": "Wilgotność", "cscale": DEFAULT_HUMIDITY_COLORSCALE, "cmin": 0, "cmax": 100, "unit": "%", "step": 10.0 },
            "lcl":              { "nazwa": "LCL", "cscale": DEFAULT_LCL_COLORSCALE, "cmin": 0, "cmax": 3000, "unit": "m", "step": 250.0 },
            "wiatr_sr":         { "nazwa": "Prędkość Wiatru", "cscale": DEFAULT_WIND_COLORSCALE, "cmin": 0, "cmax": 259, "unit": "km/h", "step": 10.0 },
            "wiatr":            { "nazwa": "Porywy Wiatru", "cscale": DEFAULT_WIND_COLORSCALE, "cmin": 0, "cmax": 259, "unit": "km/h", "step": 10.0 },
            "cisnienie":        { "nazwa": "Ciśnienie QFF", "cscale": DEFAULT_PRESSURE_COLORSCALE, "cmin": 980, "cmax": 1040, "unit": "hPa", "step": 2.0 },
            "snieg":            { "nazwa": "Pokrywa Śnieżna", "cscale": DEFAULT_SNOW_COLORSCALE, "cmin": 0, "cmax": 100, "unit": "cm", "step": 5.0 },
            "snieg_swiezy":     { "nazwa": "Świeży Śnieg", "cscale": DEFAULT_SNOW_COLORSCALE, "cmin": 0, "cmax": 50, "unit": "cm", "step": 2.0 }
        };
        
        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0,0,0];
        }

        function getColorRGBA(val, scale, cmin, cmax, alpha = 160) {
            if(val === null || isNaN(val)) return [0,0,0,0];
            let norm = (val - cmin) / (cmax - cmin);
            if (norm < 0) norm = 0;
            if (norm > 1) norm = 1;
            
            // Płynna interpolacja liniowa pomiędzy progami skali
            for(let i = 0; i < scale.length - 1; i++) {
                const stop1 = scale[i];
                const stop2 = scale[i+1];
                if(norm >= stop1[0] && norm <= stop2[0]) {
                    const span = stop2[0] - stop1[0];
                    const t = span > 0 ? (norm - stop1[0]) / span : 0;
                    const rgb1 = hexToRgb(stop1[1]);
                    const rgb2 = hexToRgb(stop2[1]);
                    const r = Math.round(rgb1[0] + t * (rgb2[0] - rgb1[0]));
                    const g = Math.round(rgb1[1] + t * (rgb2[1] - rgb1[1]));
                    const b = Math.round(rgb1[2] + t * (rgb2[2] - rgb1[2]));
                    return [r, g, b, alpha];
                }
            }
            const rgb = hexToRgb(scale[scale.length-1][1]);
            return [rgb[0], rgb[1], rgb[2], alpha];
        }

        // Precyzyjny obrys granic Polski (189 punktów z poland_hires.geojson)
        const POLAND_POLY_COORDS = [
            [18.8332, 49.5103], [18.7884, 49.6686], [18.6177, 49.7139], [18.5592, 49.9072], [18.2925, 49.9078], [18.0024, 50.0468], [18.0324, 50.0028],
            [17.8394, 49.9736], [17.732, 50.0949], [17.6328, 50.1063], [17.5894, 50.1632], [17.7476, 50.2175], [17.708, 50.311], [17.6295, 50.2621],
            [17.4242, 50.2406], [17.1876, 50.3785], [16.893, 50.4329], [16.8659, 50.4084], [17.0148, 50.2185], [16.8177, 50.1868], [16.6606, 50.093],
            [16.3437, 50.3699], [16.2625, 50.3644], [16.1996, 50.4063], [16.2112, 50.4513], [16.3526, 50.4928], [16.4259, 50.5676], [16.3316, 50.644],
            [16.0865, 50.6468], [15.982, 50.6036], [15.9715, 50.6786], [15.8482, 50.6752], [15.7922, 50.7427], [15.6843, 50.7314], [15.4418, 50.8002],
            [15.3561, 50.7755], [15.2561, 50.8999], [15.2698, 50.9527], [15.1444, 51.0116], [15.1079, 50.981], [15.004, 51.0207], [14.961, 50.9927],
            [14.9966, 50.9592], [14.9821, 50.8591], [14.8104, 50.8584], [14.9553, 51.064], [15.0195, 51.2717], [14.9638, 51.3284], [14.9451, 51.4492],
            [14.71, 51.5302], [14.7325, 51.6583], [14.5858, 51.8039], [14.6871, 51.9119], [14.7614, 52.0767], [14.6864, 52.121], [14.7124, 52.2359],
            [14.5842, 52.2912], [14.5454, 52.3822], [14.5398, 52.4219], [14.6323, 52.4967], [14.6091, 52.5178], [14.6448, 52.5769], [14.1239, 52.8507],
            [14.165, 52.8957], [14.1445, 52.9599], [14.3433, 53.0486], [14.3807, 53.1899], [14.4416, 53.2518], [14.3042, 53.5085], [14.2639, 53.7],
            [14.3049, 53.7126], [14.2942, 53.7491], [14.531, 53.6578], [14.5906, 53.5984], [14.6238, 53.6528], [14.5449, 53.704], [14.5759, 53.7695],
            [14.6238, 53.7695], [14.6306, 53.8515], [14.5871, 53.8126], [14.5759, 53.8548], [14.4412, 53.8696], [14.4319, 53.9062], [14.363, 53.8794],
            [14.4053, 53.8442], [14.3189, 53.8182], [14.1753, 53.9065], [14.2101, 53.9385], [14.4067, 53.9218], [14.7819, 54.0346], [15.8597, 54.25],
            [16.1792, 54.263], [16.2152, 54.2996], [16.1377, 54.2903], [16.3239, 54.3499], [16.2816, 54.3586], [16.5696, 54.5572], [16.94, 54.606],
            [17.3374, 54.749], [18.1524, 54.8383], [18.3395, 54.8335], [18.7517, 54.6901], [18.8353, 54.6031], [18.7078, 54.7012], [18.4563, 54.7877],
            [18.4131, 54.7465], [18.4759, 54.6401], [18.523, 54.6466], [18.5881, 54.4337], [18.8859, 54.3502], [19.3772, 54.3776], [19.6095, 54.4567],
            [22.6984, 54.3429], [22.8376, 54.4009], [22.9627, 54.3817], [23.0416, 54.341], [23.0501, 54.2948], [23.316, 54.2363], [23.449, 54.1549],
            [23.4962, 54.0446], [23.4587, 53.9816], [23.5909, 53.6113], [23.8006, 53.2425], [23.8937, 53.152], [23.8593, 53.068], [23.9113, 53.0051],
            [23.9225, 52.7426], [23.869, 52.67], [23.3923, 52.5096], [23.1656, 52.2894], [23.1897, 52.2405], [23.4877, 52.1816], [23.5125, 52.1244],
            [23.6375, 52.0845], [23.6764, 51.9941], [23.5946, 51.8433], [23.6175, 51.7865], [23.5523, 51.7366], [23.5434, 51.5927], [23.6976, 51.4044],
            [23.6352, 51.3047], [23.8636, 51.1483], [23.9117, 51.0068], [23.9793, 50.9375], [24.1432, 50.8564], [23.9576, 50.808], [24.081, 50.713],
            [24.1077, 50.5408], [24.0107, 50.4928], [23.9813, 50.4048], [23.6822, 50.3682], [23.1015, 49.9571], [22.6658, 49.5674], [22.6409, 49.5288],
            [22.7378, 49.2754], [22.6817, 49.1612], [22.8534, 49.0848], [22.8553, 48.994], [22.0408, 49.1975], [21.9284, 49.3308], [21.8196, 49.3772],
            [21.7576, 49.3489], [21.6012, 49.4265], [21.4279, 49.4098], [21.2605, 49.4494], [21.1941, 49.4006], [21.0688, 49.4192], [21.0333, 49.3997],
            [21.0725, 49.3572], [20.919, 49.2903], [20.6895, 49.4005], [20.544, 49.3708], [20.3177, 49.3916], [20.2844, 49.3386], [20.1359, 49.3089],
            [20.0505, 49.1732], [19.9379, 49.2251], [19.7607, 49.1942], [19.8086, 49.2709], [19.7693, 49.3931], [19.627, 49.4019], [19.6348, 49.4413],
            [19.5568, 49.4539], [19.4573, 49.5981], [19.2341, 49.5072], [19.1417, 49.3942], [18.9623, 49.3892], [18.9611, 49.4928], [18.8332, 49.5103]
        ];

        // Transformacja szerokości geograficznej do Web Mercator Y (eliminuje przesunięcie na północ)
        function latToMercY(lat) {
            const rad = lat * Math.PI / 180.0;
            return Math.log(Math.tan(Math.PI / 4.0 + rad / 2.0));
        }

        function generateIDWImage(lats, lons, vals, scale, cmin, cmax, drawIso, stepVal = null, unit = '', geoBounds = null, clipToPoland = false) {
            const minLat = geoBounds ? geoBounds.minLat : 48.5;
            const maxLat = geoBounds ? geoBounds.maxLat : 55.5;
            const minLon = geoBounds ? geoBounds.minLon : 13.5;
            const maxLon = geoBounds ? geoBounds.maxLon : 24.5;
            const minMercY = latToMercY(minLat);
            const maxMercY = latToMercY(maxLat);

            // Siatka obliczeniowa (lekka i szybka dla IDW, adaptacyjna dla szerszego obszaru)
            const gw = geoBounds ? 220 : 180;
            const gh = geoBounds ? 140 : 135;
            // Docelowe płótno wysokiej rozdzielczości (dla ostrych wektorów)
            const w = 1200, h = 900;

            const pts = [];
            for (let i = 0; i < lats.length; i++) {
                const px = ((lons[i] - minLon) / (maxLon - minLon)) * gw;
                const py = (1 - (latToMercY(lats[i]) - minMercY) / (maxMercY - minMercY)) * gh;
                pts.push({ x: px, y: py, v: vals[i] });
            }

            const valGrid = new Float32Array(gw * gh);
            const heatCanvas = document.createElement('canvas');
            heatCanvas.width = gw;
            heatCanvas.height = gh;
            const heatCtx = heatCanvas.getContext('2d');
            const heatImgData = heatCtx.createImageData(gw, gh);

            for (let y = 0; y < gh; y++) {
                for (let x = 0; x < gw; x++) {
                    let num = 0, den = 0;
                    for (let i = 0; i < pts.length; i++) {
                        const dx = x - pts[i].x;
                        const dy = y - pts[i].y;
                        let d2 = dx * dx + dy * dy;
                        if (d2 < 1.0) d2 = 1.0;
                        const weight = 1.0 / (d2 * Math.sqrt(d2)); // waga d^2.5
                        num += weight * pts[i].v;
                        den += weight;
                    }
                    const val = num / den;
                    const idx = y * gw + x;
                    valGrid[idx] = val;

                    const rgba = getColorRGBA(val, scale, cmin, cmax);
                    const pIdx = idx * 4;
                    heatImgData.data[pIdx] = rgba[0];
                    heatImgData.data[pIdx + 1] = rgba[1];
                    heatImgData.data[pIdx + 2] = rgba[2];
                    heatImgData.data[pIdx + 3] = rgba[3];
                }
            }
            heatCtx.putImageData(heatImgData, 0, 0);

            // Wygładzanie tła na płótnie o wysokiej rozdzielczości (GPU bicubic filter)
            const offCanvas = document.createElement('canvas');
            offCanvas.width = w;
            offCanvas.height = h;
            const offCtx = offCanvas.getContext('2d');
            offCtx.imageSmoothingEnabled = true;
            offCtx.imageSmoothingQuality = 'high';
            offCtx.drawImage(heatCanvas, 0, 0, w, h);

            // Wygładzona siatka pod wektorowe izolinie (eliminacja szumu mikroskali)
            const smoothGrid = new Float32Array(gw * gh);
            for (let y = 0; y < gh; y++) {
                for (let x = 0; x < gw; x++) {
                    if (x === 0 || x === gw - 1 || y === 0 || y === gh - 1) {
                        smoothGrid[y * gw + x] = valGrid[y * gw + x];
                    } else {
                        smoothGrid[y * gw + x] = (
                            valGrid[(y - 1) * gw + x - 1] + 2 * valGrid[(y - 1) * gw + x] + valGrid[(y - 1) * gw + x + 1] +
                            2 * valGrid[y * gw + x - 1] + 4 * valGrid[y * gw + x] + 2 * valGrid[y * gw + x + 1] +
                            valGrid[(y + 1) * gw + x - 1] + 2 * valGrid[(y + 1) * gw + x] + valGrid[(y + 1) * gw + x + 1]
                        ) / 16.0;
                    }
                }
            }

            // Kreślenie wektorowych izolinii algorytmem Marching Squares z podpikselową interpolacją liniową
            if (drawIso) {
                const step = (stepVal && !isNaN(stepVal) && stepVal > 0) ? stepVal : ((cmax - cmin) / 15);
                const startVal = Math.ceil(cmin / step) * step;
                const scaleX = w / (gw - 1);
                const scaleY = h / (gh - 1);

                offCtx.lineWidth = 1.5;
                offCtx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
                offCtx.lineCap = 'round';
                offCtx.lineJoin = 'round';

                const isoLabels = [];

                for (let T = startVal; T <= cmax; T += step) {
                    const segs = [];
                    for (let j = 0; j < gh - 1; j++) {
                        for (let i = 0; i < gw - 1; i++) {
                            const idx = j * gw + i;
                            const v0 = smoothGrid[idx];
                            const v1 = smoothGrid[idx + 1];
                            const v2 = smoothGrid[idx + gw + 1];
                            const v3 = smoothGrid[idx + gw];

                            let mask = 0;
                            if (v0 >= T) mask |= 1;
                            if (v1 >= T) mask |= 2;
                            if (v2 >= T) mask |= 4;
                            if (v3 >= T) mask |= 8;

                            if (mask === 0 || mask === 15) continue;

                            const pt = (gx, gy) => ({ x: gx * scaleX, y: gy * scaleY });
                            const itop = () => pt(i + (T - v0) / (v1 - v0), j);
                            const iright = () => pt(i + 1, j + (T - v1) / (v2 - v1));
                            const ibot = () => pt(i + (T - v3) / (v2 - v3), j + 1);
                            const ileft = () => pt(i, j + (T - v0) / (v3 - v0));

                            const center = (v0 + v1 + v2 + v3) * 0.25;
                            if (mask === 1) segs.push([ileft(), itop()]);
                            else if (mask === 2) segs.push([itop(), iright()]);
                            else if (mask === 3) segs.push([ileft(), iright()]);
                            else if (mask === 4) segs.push([iright(), ibot()]);
                            else if (mask === 5) {
                                if (center >= T) { segs.push([ileft(), itop()]); segs.push([iright(), ibot()]); }
                                else { segs.push([ileft(), ibot()]); segs.push([itop(), iright()]); }
                            } else if (mask === 6) segs.push([itop(), ibot()]);
                            else if (mask === 7) segs.push([ileft(), ibot()]);
                            else if (mask === 8) segs.push([ibot(), ileft()]);
                            else if (mask === 9) segs.push([itop(), ibot()]);
                            else if (mask === 10) {
                                if (center >= T) { segs.push([itop(), iright()]); segs.push([ibot(), ileft()]); }
                                else { segs.push([itop(), ileft()]); segs.push([ibot(), iright()]); }
                            } else if (mask === 11) segs.push([iright(), ibot()]);
                            else if (mask === 12) segs.push([ileft(), iright()]);
                            else if (mask === 13) segs.push([itop(), iright()]);
                            else if (mask === 14) segs.push([ileft(), itop()]);
                        }
                    }

                    if (segs.length > 0) {
                        offCtx.beginPath();
                        for (let s = 0; s < segs.length; s++) {
                            offCtx.moveTo(segs[s][0].x, segs[s][0].y);
                            offCtx.lineTo(segs[s][1].x, segs[s][1].y);
                        }
                        offCtx.stroke();

                        // Dobór pozycji etykiet – odrzucenie punktów skrajnych
                        const candidates = segs.filter(s => {
                            const mx = (s[0].x + s[1].x) * 0.5;
                            const my = (s[0].y + s[1].y) * 0.5;
                            return mx > w * 0.18 && mx < w * 0.82 && my > h * 0.18 && my < h * 0.82;
                        });

                        if (candidates.length > 0) {
                            const midIdx = Math.floor(candidates.length / 2);
                            const p = candidates[midIdx];
                            const lx = (p[0].x + p[1].x) * 0.5;
                            const ly = (p[0].y + p[1].y) * 0.5;
                            const labelTxt = Number(T).toFixed(step < 1 ? 1 : 0) + (unit ? unit : '');
                            isoLabels.push({ x: lx, y: ly, text: labelTxt });

                            if (candidates.length > 40) {
                                const p2 = candidates[Math.floor(candidates.length * 0.2)];
                                const lx2 = (p2[0].x + p2[1].x) * 0.5;
                                const ly2 = (p2[0].y + p2[1].y) * 0.5;
                                if (Math.hypot(lx - lx2, ly - ly2) > 220) {
                                    isoLabels.push({ x: lx2, y: ly2, text: labelTxt });
                                }
                            }
                        }
                    }
                }

                // Eleganckie kapsułki etykiet (Pill badges)
                if (isoLabels.length > 0) {
                    offCtx.save();
                    offCtx.font = 'bold 11px system-ui, -apple-system, sans-serif';
                    offCtx.textAlign = 'center';
                    offCtx.textBaseline = 'middle';

                    for (let lbl of isoLabels) {
                        const tw = offCtx.measureText(lbl.text).width;
                        const bw = tw + 10;
                        const bh = 17;
                        const bx = lbl.x - bw / 2;
                        const by = lbl.y - bh / 2;

                        offCtx.fillStyle = 'rgba(15, 23, 42, 0.90)';
                        offCtx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                        offCtx.lineWidth = 1;

                        offCtx.beginPath();
                        if (offCtx.roundRect) {
                            offCtx.roundRect(bx, by, bw, bh, 4);
                        } else {
                            offCtx.rect(bx, by, bw, bh);
                        }
                        offCtx.fill();
                        offCtx.stroke();

                        offCtx.fillStyle = '#ffffff';
                        offCtx.fillText(lbl.text, lbl.x, lbl.y + 0.5);
                    }
                    offCtx.restore();
                }
            }

            if (!clipToPoland) {
                return offCanvas.toDataURL();
            }

            // Główny canvas z precyzyjnym przycięciem (clip) ściśle do konturów Polski w projekcji Mercator
            const mainCanvas = document.createElement('canvas');
            mainCanvas.width = w;
            mainCanvas.height = h;
            const mainCtx = mainCanvas.getContext('2d');

            mainCtx.beginPath();
            for (let i = 0; i < POLAND_POLY_COORDS.length; i++) {
                const [pLon, pLat] = POLAND_POLY_COORDS[i];
                const px = ((pLon - minLon) / (maxLon - minLon)) * w;
                const py = (1 - (latToMercY(pLat) - minMercY) / (maxMercY - minMercY)) * h;
                if (i === 0) mainCtx.moveTo(px, py);
                else mainCtx.lineTo(px, py);
            }
            mainCtx.closePath();
            mainCtx.clip();

            mainCtx.drawImage(offCanvas, 0, 0);
            return mainCanvas.toDataURL();
        }

        // Zarządzanie kolejnością warstw (Z-Index Panes)
        window.setLayerPriority = function(layerName, position) {
            const zValues = {
                'inter': position === 'top' ? 420 : 300,
                'radar': position === 'top' ? 430 : 350,
                'drawings': position === 'top' ? 480 : 380
            };
            if (layerName === 'radar' && map.getPane('radarPane')) {
                map.getPane('radarPane').style.zIndex = zValues['radar'];
            } else if (layerName === 'inter' && map.getPane('weatherPane')) {
                map.getPane('weatherPane').style.zIndex = zValues['inter'];
            }
        };

        function calculateDewPoint(temp_c, rh_pct) {
            if(temp_c == null || rh_pct == null || rh_pct <= 0) return null;
            const a = 17.27, b = 237.7;
            const alpha = (a * temp_c) / (b + temp_c) + Math.log(rh_pct / 100.0);
            return (b * alpha) / (a - alpha);
        }

        // 215 stacji przygranicznych (do 250 km od granicy Polski) zasilających ciągłość synoptyczną
        const FOREIGN_STATIONS = [
    // Niemcy (DE) - 40 stacji
    {"name": "Stralsund", "cc": "DE", "lat": 54.31, "lon": 13.09},
    {"name": "Greifswald", "cc": "DE", "lat": 54.09, "lon": 13.38},
    {"name": "Wolgast", "cc": "DE", "lat": 54.05, "lon": 13.77},
    {"name": "Anklam", "cc": "DE", "lat": 53.86, "lon": 13.69},
    {"name": "Ueckermünde", "cc": "DE", "lat": 53.74, "lon": 14.05},
    {"name": "Pasewalk", "cc": "DE", "lat": 53.51, "lon": 13.99},
    {"name": "Neubrandenburg", "cc": "DE", "lat": 53.56, "lon": 13.26},
    {"name": "Prenzlau", "cc": "DE", "lat": 53.32, "lon": 13.86},
    {"name": "Schwedt (Oder)", "cc": "DE", "lat": 53.06, "lon": 14.28},
    {"name": "Angermünde", "cc": "DE", "lat": 53.02, "lon": 14.00},
    {"name": "Eberswalde", "cc": "DE", "lat": 52.83, "lon": 13.82},
    {"name": "Bad Freienwalde", "cc": "DE", "lat": 52.79, "lon": 14.03},
    {"name": "Wriezen", "cc": "DE", "lat": 52.72, "lon": 14.13},
    {"name": "Seelow", "cc": "DE", "lat": 52.53, "lon": 14.38},
    {"name": "Berlin-Mitte", "cc": "DE", "lat": 52.52, "lon": 13.40},
    {"name": "Berlin-Schönefeld", "cc": "DE", "lat": 52.38, "lon": 13.52},
    {"name": "Potsdam", "cc": "DE", "lat": 52.39, "lon": 13.06},
    {"name": "Fürstenwalde", "cc": "DE", "lat": 52.36, "lon": 14.06},
    {"name": "Frankfurt (Oder)", "cc": "DE", "lat": 52.34, "lon": 14.55},
    {"name": "Eisenhüttenstadt", "cc": "DE", "lat": 52.14, "lon": 14.67},
    {"name": "Beeskow", "cc": "DE", "lat": 52.17, "lon": 14.25},
    {"name": "Lübben (Spreewald)", "cc": "DE", "lat": 51.94, "lon": 13.90},
    {"name": "Guben", "cc": "DE", "lat": 51.95, "lon": 14.72},
    {"name": "Forst (Lausitz)", "cc": "DE", "lat": 51.74, "lon": 14.65},
    {"name": "Cottbus", "cc": "DE", "lat": 51.76, "lon": 14.33},
    {"name": "Spremberg", "cc": "DE", "lat": 51.57, "lon": 14.38},
    {"name": "Weißwasser", "cc": "DE", "lat": 51.50, "lon": 14.64},
    {"name": "Hoyerswerda", "cc": "DE", "lat": 51.44, "lon": 14.25},
    {"name": "Niesky", "cc": "DE", "lat": 51.29, "lon": 14.82},
    {"name": "Görlitz", "cc": "DE", "lat": 51.15, "lon": 14.99},
    {"name": "Bautzen", "cc": "DE", "lat": 51.18, "lon": 14.43},
    {"name": "Löbau", "cc": "DE", "lat": 51.10, "lon": 14.67},
    {"name": "Zittau", "cc": "DE", "lat": 50.90, "lon": 14.80},
    {"name": "Drezno", "cc": "DE", "lat": 51.05, "lon": 13.74},
    {"name": "Pirna", "cc": "DE", "lat": 50.96, "lon": 13.94},
    {"name": "Meissen", "cc": "DE", "lat": 51.16, "lon": 13.48},
    {"name": "Riesa", "cc": "DE", "lat": 51.30, "lon": 13.30},
    {"name": "Lipsk", "cc": "DE", "lat": 51.34, "lon": 12.37},
    {"name": "Chemnitz", "cc": "DE", "lat": 50.83, "lon": 12.92},
    {"name": "Freiberg", "cc": "DE", "lat": 50.92, "lon": 13.34},

    // Czechy (CZ) - 45 stacji
    {"name": "Frydlant", "cc": "CZ", "lat": 50.92, "lon": 15.08},
    {"name": "Liberec", "cc": "CZ", "lat": 50.77, "lon": 15.06},
    {"name": "Jablonec nad Nisou", "cc": "CZ", "lat": 50.72, "lon": 15.17},
    {"name": "Semily", "cc": "CZ", "lat": 50.60, "lon": 15.34},
    {"name": "Turnov", "cc": "CZ", "lat": 50.59, "lon": 15.16},
    {"name": "Mlada Boleslav", "cc": "CZ", "lat": 50.41, "lon": 14.91},
    {"name": "Jicin", "cc": "CZ", "lat": 50.44, "lon": 15.35},
    {"name": "Vrchlabi", "cc": "CZ", "lat": 50.63, "lon": 15.61},
    {"name": "Trutnov", "cc": "CZ", "lat": 50.56, "lon": 15.91},
    {"name": "Dvur Kralove", "cc": "CZ", "lat": 50.43, "lon": 15.81},
    {"name": "Nachod", "cc": "CZ", "lat": 50.42, "lon": 16.16},
    {"name": "Broumov", "cc": "CZ", "lat": 50.59, "lon": 16.33},
    {"name": "Rychnov nad Kneznou", "cc": "CZ", "lat": 50.16, "lon": 16.28},
    {"name": "Hradec Kralove", "cc": "CZ", "lat": 50.21, "lon": 15.83},
    {"name": "Pardubice", "cc": "CZ", "lat": 50.04, "lon": 15.78},
    {"name": "Chrudim", "cc": "CZ", "lat": 49.95, "lon": 15.79},
    {"name": "Usti nad Orlici", "cc": "CZ", "lat": 49.97, "lon": 16.39},
    {"name": "Ceska Trebova", "cc": "CZ", "lat": 49.90, "lon": 16.45},
    {"name": "Svitavy", "cc": "CZ", "lat": 49.76, "lon": 16.47},
    {"name": "Zamberk", "cc": "CZ", "lat": 50.09, "lon": 16.46},
    {"name": "Kraliky", "cc": "CZ", "lat": 50.08, "lon": 16.76},
    {"name": "Jesenik", "cc": "CZ", "lat": 50.23, "lon": 17.20},
    {"name": "Zlate Hory", "cc": "CZ", "lat": 50.26, "lon": 17.40},
    {"name": "Javornik", "cc": "CZ", "lat": 50.39, "lon": 17.00},
    {"name": "Sumperk", "cc": "CZ", "lat": 49.96, "lon": 16.97},
    {"name": "Zabreh", "cc": "CZ", "lat": 49.88, "lon": 16.87},
    {"name": "Mohelnice", "cc": "CZ", "lat": 49.78, "lon": 16.92},
    {"name": "Rymarov", "cc": "CZ", "lat": 49.93, "lon": 17.27},
    {"name": "Bruntal", "cc": "CZ", "lat": 49.99, "lon": 17.46},
    {"name": "Krnov", "cc": "CZ", "lat": 50.09, "lon": 17.70},
    {"name": "Opawa", "cc": "CZ", "lat": 49.94, "lon": 17.90},
    {"name": "Hlucin", "cc": "CZ", "lat": 49.90, "lon": 18.19},
    {"name": "Ostrawa", "cc": "CZ", "lat": 49.83, "lon": 18.29},
    {"name": "Bohumin", "cc": "CZ", "lat": 49.90, "lon": 18.36},
    {"name": "Karwina", "cc": "CZ", "lat": 49.85, "lon": 18.54},
    {"name": "Hawierzow", "cc": "CZ", "lat": 49.78, "lon": 18.43},
    {"name": "Czeski Cieszyn", "cc": "CZ", "lat": 49.75, "lon": 18.63},
    {"name": "Frydek-Mistek", "cc": "CZ", "lat": 49.68, "lon": 18.35},
    {"name": "Trzyniec", "cc": "CZ", "lat": 49.68, "lon": 18.67},
    {"name": "Jablunkov", "cc": "CZ", "lat": 49.58, "lon": 18.76},
    {"name": "Nowy Jiczyn", "cc": "CZ", "lat": 49.59, "lon": 18.01},
    {"name": "Olomuniec", "cc": "CZ", "lat": 49.59, "lon": 17.25},
    {"name": "Przerow", "cc": "CZ", "lat": 49.46, "lon": 17.45},
    {"name": "Zlin", "cc": "CZ", "lat": 49.23, "lon": 17.67},
    {"name": "Brno", "cc": "CZ", "lat": 49.19, "lon": 16.61},
    {"name": "Harrachov", "cc": "CZ", "lat": 50.77, "lon": 15.43},
    {"name": "Ceska Lipa", "cc": "CZ", "lat": 50.69, "lon": 14.54},
    {"name": "Decin", "cc": "CZ", "lat": 50.78, "lon": 14.21},
    {"name": "Usti nad Labem", "cc": "CZ", "lat": 50.66, "lon": 14.03},
    {"name": "Novy Bor", "cc": "CZ", "lat": 50.76, "lon": 14.56},
    {"name": "Jaromer", "cc": "CZ", "lat": 50.36, "lon": 15.92},
    {"name": "Rokytnice v Orlickych horach", "cc": "CZ", "lat": 50.16, "lon": 16.46},
    {"name": "Koprivnice", "cc": "CZ", "lat": 49.60, "lon": 18.14},
    {"name": "Valasske Mezirici", "cc": "CZ", "lat": 49.47, "lon": 17.97},
    {"name": "Vsetin", "cc": "CZ", "lat": 49.34, "lon": 17.99},

    // Słowacja (SK) - 50 stacji
    {"name": "Czadca", "cc": "SK", "lat": 49.44, "lon": 18.79},
    {"name": "Turzovka", "cc": "SK", "lat": 49.40, "lon": 18.62},
    {"name": "Kysucke Nove Mesto", "cc": "SK", "lat": 49.30, "lon": 18.78},
    {"name": "Żylina", "cc": "SK", "lat": 49.22, "lon": 18.74},
    {"name": "Bytca", "cc": "SK", "lat": 49.22, "lon": 18.56},
    {"name": "Powaska Bystrzyca", "cc": "SK", "lat": 49.12, "lon": 18.45},
    {"name": "Puchov", "cc": "SK", "lat": 49.12, "lon": 18.33},
    {"name": "Ilava", "cc": "SK", "lat": 48.99, "lon": 18.23},
    {"name": "Trenczyn", "cc": "SK", "lat": 48.89, "lon": 18.04},
    {"name": "Martin", "cc": "SK", "lat": 49.07, "lon": 18.92},
    {"name": "Namiestow", "cc": "SK", "lat": 49.40, "lon": 19.48},
    {"name": "Trstena", "cc": "SK", "lat": 49.36, "lon": 19.61},
    {"name": "Tvrdosin", "cc": "SK", "lat": 49.33, "lon": 19.56},
    {"name": "Dolny Kubin", "cc": "SK", "lat": 49.21, "lon": 19.30},
    {"name": "Ruzomberk", "cc": "SK", "lat": 49.08, "lon": 19.31},
    {"name": "Liptowski Mikulasz", "cc": "SK", "lat": 49.08, "lon": 19.61},
    {"name": "Liptovsky Hradok", "cc": "SK", "lat": 49.04, "lon": 19.72},
    {"name": "Strbske Pleso", "cc": "SK", "lat": 49.12, "lon": 20.06},
    {"name": "Poprad", "cc": "SK", "lat": 49.06, "lon": 20.30},
    {"name": "Kiezmark", "cc": "SK", "lat": 49.14, "lon": 20.43},
    {"name": "Spiska Bela", "cc": "SK", "lat": 49.19, "lon": 20.46},
    {"name": "Stara Lubowla", "cc": "SK", "lat": 49.30, "lon": 20.69},
    {"name": "Podolinec", "cc": "SK", "lat": 49.26, "lon": 20.52},
    {"name": "Bardejow", "cc": "SK", "lat": 49.29, "lon": 21.27},
    {"name": "Swidnik", "cc": "SK", "lat": 49.30, "lon": 21.57},
    {"name": "Stropkov", "cc": "SK", "lat": 49.20, "lon": 21.65},
    {"name": "Medzilaborce", "cc": "SK", "lat": 49.27, "lon": 21.90},
    {"name": "Snina", "cc": "SK", "lat": 48.99, "lon": 22.15},
    {"name": "Humenne", "cc": "SK", "lat": 48.94, "lon": 21.91},
    {"name": "Michalovce", "cc": "SK", "lat": 48.75, "lon": 21.92},
    {"name": "Vranov nad Toplou", "cc": "SK", "lat": 48.89, "lon": 21.68},
    {"name": "Preszow", "cc": "SK", "lat": 49.00, "lon": 21.24},
    {"name": "Sabinov", "cc": "SK", "lat": 49.10, "lon": 21.10},
    {"name": "Lipany", "cc": "SK", "lat": 49.15, "lon": 20.96},
    {"name": "Lewocza", "cc": "SK", "lat": 49.03, "lon": 20.59},
    {"name": "Spiska Nowa Wies", "cc": "SK", "lat": 48.94, "lon": 20.57},
    {"name": "Koszyce", "cc": "SK", "lat": 48.72, "lon": 21.26},
    {"name": "Trebisov", "cc": "SK", "lat": 48.63, "lon": 21.72},
    {"name": "Banska Bystrzyca", "cc": "SK", "lat": 48.74, "lon": 19.15},
    {"name": "Bratyslawa", "cc": "SK", "lat": 48.15, "lon": 17.11},
    {"name": "Oravska Lesna", "cc": "SK", "lat": 49.37, "lon": 19.18},
    {"name": "Spiska Stara Wies", "cc": "SK", "lat": 49.38, "lon": 20.36},
    {"name": "Zdiar", "cc": "SK", "lat": 49.27, "lon": 20.27},
    {"name": "Tatranska Lomnica", "cc": "SK", "lat": 49.17, "lon": 20.28},
    {"name": "Stary Smokovec", "cc": "SK", "lat": 49.14, "lon": 20.22},
    {"name": "Zubrohlava", "cc": "SK", "lat": 49.41, "lon": 19.51},
    {"name": "Giraltovce", "cc": "SK", "lat": 49.11, "lon": 21.52},
    {"name": "Ubla", "cc": "SK", "lat": 48.90, "lon": 22.39},
    {"name": "Sobrance", "cc": "SK", "lat": 48.74, "lon": 22.18},
    {"name": "Roznava", "cc": "SK", "lat": 48.66, "lon": 20.53},

    // Ukraina (UA) - 35 stacji
    {"name": "Lwow", "cc": "UA", "lat": 49.84, "lon": 24.03},
    {"name": "Rawa Ruska", "cc": "UA", "lat": 50.25, "lon": 23.63},
    {"name": "Zolkiew", "cc": "UA", "lat": 50.06, "lon": 23.97},
    {"name": "Jaworow", "cc": "UA", "lat": 49.94, "lon": 23.39},
    {"name": "Nowojaworowsk", "cc": "UA", "lat": 49.93, "lon": 23.57},
    {"name": "Mosciska", "cc": "UA", "lat": 49.80, "lon": 23.15},
    {"name": "Sadowa Wisznia", "cc": "UA", "lat": 49.79, "lon": 23.37},
    {"name": "Grodek", "cc": "UA", "lat": 49.78, "lon": 23.65},
    {"name": "Sambor", "cc": "UA", "lat": 49.52, "lon": 23.20},
    {"name": "Stary Sambor", "cc": "UA", "lat": 49.44, "lon": 23.00},
    {"name": "Turka", "cc": "UA", "lat": 49.15, "lon": 23.03},
    {"name": "Drohobycz", "cc": "UA", "lat": 49.35, "lon": 23.51},
    {"name": "Boryslaw", "cc": "UA", "lat": 49.29, "lon": 23.42},
    {"name": "Truskawiec", "cc": "UA", "lat": 49.28, "lon": 23.51},
    {"name": "Stryj", "cc": "UA", "lat": 49.26, "lon": 23.86},
    {"name": "Morszyn", "cc": "UA", "lat": 49.15, "lon": 23.87},
    {"name": "Skole", "cc": "UA", "lat": 49.03, "lon": 23.51},
    {"name": "Slawsko", "cc": "UA", "lat": 48.85, "lon": 23.45},
    {"name": "Mikolajow", "cc": "UA", "lat": 49.52, "lon": 23.98},
    {"name": "Zydaczow", "cc": "UA", "lat": 49.39, "lon": 24.14},
    {"name": "Chodorow", "cc": "UA", "lat": 49.41, "lon": 24.31},
    {"name": "Kamionka Strumilowa", "cc": "UA", "lat": 50.11, "lon": 24.34},
    {"name": "Czerwonogrod", "cc": "UA", "lat": 50.42, "lon": 24.23},
    {"name": "Sokal", "cc": "UA", "lat": 50.48, "lon": 24.28},
    {"name": "Nowowolynsk", "cc": "UA", "lat": 50.73, "lon": 24.16},
    {"name": "Wlodzimierz", "cc": "UA", "lat": 50.75, "lon": 24.32},
    {"name": "Kowel", "cc": "UA", "lat": 51.22, "lon": 24.71},
    {"name": "Kamien Koszyrski", "cc": "UA", "lat": 51.62, "lon": 24.96},
    {"name": "Luboml", "cc": "UA", "lat": 51.23, "lon": 24.04},
    {"name": "Szack", "cc": "UA", "lat": 51.49, "lon": 23.93},
    {"name": "Luck", "cc": "UA", "lat": 50.74, "lon": 25.34},
    {"name": "Rozyszcze", "cc": "UA", "lat": 50.91, "lon": 25.27},
    {"name": "Rowne", "cc": "UA", "lat": 50.62, "lon": 26.25},
    {"name": "Dubno", "cc": "UA", "lat": 50.42, "lon": 25.74},
    {"name": "Iwano-Frankiwsk", "cc": "UA", "lat": 48.92, "lon": 24.71},
    {"name": "Uzhorod", "cc": "UA", "lat": 48.62, "lon": 22.30},
    {"name": "Mukaczewo", "cc": "UA", "lat": 48.44, "lon": 22.72},
    {"name": "Wielki Berezny", "cc": "UA", "lat": 48.89, "lon": 22.46},
    {"name": "Pereczyn", "cc": "UA", "lat": 48.74, "lon": 22.47},
    {"name": "Ratno", "cc": "UA", "lat": 51.67, "lon": 24.53},
    {"name": "Maniewicze", "cc": "UA", "lat": 51.29, "lon": 25.55},
    {"name": "Sarny", "cc": "UA", "lat": 51.33, "lon": 26.60},
    {"name": "Kostopol", "cc": "UA", "lat": 50.88, "lon": 26.44},
    {"name": "Brody", "cc": "UA", "lat": 50.08, "lon": 25.15},
    {"name": "Tarnopol", "cc": "UA", "lat": 49.55, "lon": 25.59},

    // Białoruś (BY) - 30 stacji
    {"name": "Brzesc", "cc": "BY", "lat": 52.10, "lon": 23.69},
    {"name": "Zabinka", "cc": "BY", "lat": 52.20, "lon": 24.02},
    {"name": "Kobryn", "cc": "BY", "lat": 52.21, "lon": 24.36},
    {"name": "Maloryta", "cc": "BY", "lat": 51.79, "lon": 24.08},
    {"name": "Wysokie", "cc": "BY", "lat": 52.37, "lon": 23.38},
    {"name": "Kamieniec", "cc": "BY", "lat": 52.40, "lon": 23.82},
    {"name": "Pruzana", "cc": "BY", "lat": 52.56, "lon": 24.47},
    {"name": "Bereza", "cc": "BY", "lat": 52.53, "lon": 24.98},
    {"name": "Bielooziorsk", "cc": "BY", "lat": 52.47, "lon": 25.18},
    {"name": "Iwanowo", "cc": "BY", "lat": 52.14, "lon": 25.54},
    {"name": "Pinsk", "cc": "BY", "lat": 52.12, "lon": 26.10},
    {"name": "Swislocz", "cc": "BY", "lat": 53.03, "lon": 24.10},
    {"name": "Wolkowysk", "cc": "BY", "lat": 53.16, "lon": 24.45},
    {"name": "Zelwa", "cc": "BY", "lat": 53.15, "lon": 24.81},
    {"name": "Slonim", "cc": "BY", "lat": 53.09, "lon": 25.32},
    {"name": "Mosty", "cc": "BY", "lat": 53.41, "lon": 24.54},
    {"name": "Grodno", "cc": "BY", "lat": 53.68, "lon": 23.83},
    {"name": "Skidel", "cc": "BY", "lat": 53.59, "lon": 24.25},
    {"name": "Szczuczyn", "cc": "BY", "lat": 53.60, "lon": 24.74},
    {"name": "Lida", "cc": "BY", "lat": 53.89, "lon": 25.30},
    {"name": "Sopockinie", "cc": "BY", "lat": 53.83, "lon": 23.65},
    {"name": "Indura", "cc": "BY", "lat": 53.46, "lon": 23.88},
    {"name": "Porozowo", "cc": "BY", "lat": 52.93, "lon": 24.36},
    {"name": "Szereszewo", "cc": "BY", "lat": 52.56, "lon": 24.21},
    {"name": "Drohiczyn Poleski", "cc": "BY", "lat": 52.19, "lon": 25.16},
    {"name": "Iwacewicze", "cc": "BY", "lat": 52.71, "lon": 25.34},
    {"name": "Baranowicze", "cc": "BY", "lat": 53.13, "lon": 26.02},
    {"name": "Radun", "cc": "BY", "lat": 54.05, "lon": 24.99},
    {"name": "Woranawa", "cc": "BY", "lat": 54.15, "lon": 25.32},
    {"name": "Iwje", "cc": "BY", "lat": 53.93, "lon": 25.77},

    // Litwa (LT) - 20 stacji
    {"name": "Druskieniki", "cc": "LT", "lat": 54.01, "lon": 23.97},
    {"name": "Wiejsieje", "cc": "LT", "lat": 54.10, "lon": 23.70},
    {"name": "Lozdzieje", "cc": "LT", "lat": 54.23, "lon": 23.51},
    {"name": "Simnas", "cc": "LT", "lat": 54.38, "lon": 23.64},
    {"name": "Olita (Alytus)", "cc": "LT", "lat": 54.40, "lon": 24.04},
    {"name": "Orany (Varena)", "cc": "LT", "lat": 54.21, "lon": 24.57},
    {"name": "Soleczniki", "cc": "LT", "lat": 54.31, "lon": 25.38},
    {"name": "Wilno", "cc": "LT", "lat": 54.69, "lon": 25.28},
    {"name": "Troki", "cc": "LT", "lat": 54.64, "lon": 24.93},
    {"name": "Elektreny", "cc": "LT", "lat": 54.79, "lon": 24.66},
    {"name": "Koszedary", "cc": "LT", "lat": 54.86, "lon": 24.45},
    {"name": "Kowno", "cc": "LT", "lat": 54.90, "lon": 23.90},
    {"name": "Preny (Prienai)", "cc": "LT", "lat": 54.63, "lon": 23.94},
    {"name": "Mariampol", "cc": "LT", "lat": 54.56, "lon": 23.35},
    {"name": "Wylkowyszki", "cc": "LT", "lat": 54.65, "lon": 23.03},
    {"name": "Kibarty", "cc": "LT", "lat": 54.64, "lon": 22.76},
    {"name": "Szaki (Sakiai)", "cc": "LT", "lat": 54.95, "lon": 23.05},
    {"name": "Jurbork (Jurbarkas)", "cc": "LT", "lat": 55.08, "lon": 22.77},
    {"name": "Taurogi (Taurage)", "cc": "LT", "lat": 55.25, "lon": 22.29},
    {"name": "Klajpeda", "cc": "LT", "lat": 55.71, "lon": 21.14},

    // Obwód Królewiecki (RU) - 15 stacji
    {"name": "Krolewiec", "cc": "RU", "lat": 54.71, "lon": 20.51},
    {"name": "Baltijsk", "cc": "RU", "lat": 54.65, "lon": 19.89},
    {"name": "Swietlyj", "cc": "RU", "lat": 54.67, "lon": 20.13},
    {"name": "Jantarnyj", "cc": "RU", "lat": 54.87, "lon": 19.94},
    {"name": "Pionierski", "cc": "RU", "lat": 54.95, "lon": 20.23},
    {"name": "Zielenogradsk", "cc": "RU", "lat": 54.96, "lon": 20.47},
    {"name": "Gurjewsk", "cc": "RU", "lat": 54.77, "lon": 20.61},
    {"name": "Mamonowo", "cc": "RU", "lat": 54.46, "lon": 19.95},
    {"name": "Bagrationowsk", "cc": "RU", "lat": 54.38, "lon": 20.63},
    {"name": "Prawdinsk", "cc": "RU", "lat": 54.45, "lon": 21.01},
    {"name": "Gwardiejsk", "cc": "RU", "lat": 54.65, "lon": 21.07},
    {"name": "Polessk", "cc": "RU", "lat": 54.86, "lon": 21.10},
    {"name": "Czerniachowsk", "cc": "RU", "lat": 54.64, "lon": 21.81},
    {"name": "Gusiew", "cc": "RU", "lat": 54.60, "lon": 22.20},
    {"name": "Sowieck", "cc": "RU", "lat": 55.08, "lon": 21.88}
];

        // Punkty uzupełniające siatkę w Polsce modelem numerycznym DWD ICON
        const PL_ICON_FILL_COORDS = [
            {"name": "Czersk (Bory Tucholskie)", "lat": 53.79, "lon": 17.97},
            {"name": "Tuchola", "lat": 53.59, "lon": 17.86},
            {"name": "Czarna Woda", "lat": 53.84, "lon": 18.25},
            {"name": "Sepolno Krajenskie", "lat": 53.45, "lon": 17.53},
            {"name": "Rypin", "lat": 53.07, "lon": 19.41},
            {"name": "Radziejow", "lat": 52.62, "lon": 18.52},
            {"name": "Drawsko Pomorskie", "lat": 53.53, "lon": 15.81},
            {"name": "Czaplinek", "lat": 53.55, "lon": 16.32},
            {"name": "Bialogard", "lat": 54.01, "lon": 15.99},
            {"name": "Swidwin", "lat": 53.77, "lon": 15.77},
            {"name": "Sulecin", "lat": 52.44, "lon": 15.12},
            {"name": "Krosno Odrzanskie", "lat": 52.05, "lon": 15.10},
            {"name": "Zary", "lat": 51.64, "lon": 15.14},
            {"name": "Szprotawa", "lat": 51.56, "lon": 15.54},
            {"name": "Miedzychod (Puszcza Notecka)", "lat": 52.61, "lon": 15.89},
            {"name": "Wronki", "lat": 52.71, "lon": 16.38},
            {"name": "Trzcianka", "lat": 53.04, "lon": 16.46},
            {"name": "Gostyn", "lat": 51.88, "lon": 17.01},
            {"name": "Wrzesnia", "lat": 52.33, "lon": 17.57},
            {"name": "Turek", "lat": 52.02, "lon": 18.50},
            {"name": "Poddebice", "lat": 51.90, "lon": 18.96},
            {"name": "Lask", "lat": 51.59, "lon": 19.13},
            {"name": "Pajeczno", "lat": 51.15, "lon": 18.99},
            {"name": "Rawa Mazowiecka", "lat": 51.76, "lon": 20.25},
            {"name": "Lowicz", "lat": 52.11, "lon": 19.94},
            {"name": "Szczytno", "lat": 53.56, "lon": 20.99},
            {"name": "Gizycko", "lat": 54.04, "lon": 21.76},
            {"name": "Monki", "lat": 53.40, "lon": 22.80},
            {"name": "Sokolka", "lat": 53.41, "lon": 23.50},
            {"name": "Bielsk Podlaski", "lat": 52.77, "lon": 23.19},
            {"name": "Wysokie Mazowieckie", "lat": 52.92, "lon": 22.51},
            {"name": "Ostrow Mazowiecka", "lat": 52.80, "lon": 21.90},
            {"name": "Wegrow", "lat": 52.40, "lon": 22.02},
            {"name": "Sokolow Podlaski", "lat": 52.41, "lon": 22.25},
            {"name": "Radzyn Podlaski", "lat": 51.78, "lon": 22.62},
            {"name": "Parczew (Polesie)", "lat": 51.64, "lon": 22.90},
            {"name": "Leczna", "lat": 51.30, "lon": 22.88},
            {"name": "Krasnystaw", "lat": 50.99, "lon": 23.17},
            {"name": "Hrubieszow", "lat": 50.80, "lon": 23.89},
            {"name": "Janow Lubelski", "lat": 50.71, "lon": 22.41},
            {"name": "Zwolen", "lat": 51.36, "lon": 21.59},
            {"name": "Lipsko", "lat": 51.16, "lon": 21.65},
            {"name": "Ilza", "lat": 51.16, "lon": 21.24},
            {"name": "Przysucha", "lat": 51.36, "lon": 20.63},
            {"name": "Garwolin", "lat": 51.90, "lon": 21.61},
            {"name": "Ryki", "lat": 51.63, "lon": 21.93},
            {"name": "Jedrzejow", "lat": 50.64, "lon": 20.30},
            {"name": "Ostrowiec Swietokrzyski", "lat": 50.93, "lon": 21.39},
            {"name": "Stalowa Wola", "lat": 50.58, "lon": 22.05},
            {"name": "Przeworsk", "lat": 50.06, "lon": 22.49},
            {"name": "Brzozow", "lat": 49.69, "lon": 22.02},
            {"name": "Dabrowa Tarnowska", "lat": 50.17, "lon": 20.99},
            {"name": "Chrzanow", "lat": 50.14, "lon": 19.40}
        ];

        let foreignAsosCache = null;
        let foreignAsosCacheTime = 0;

        // Pobieranie danych bieżących ze stacji METAR/ASOS (Iowa Environmental Mesonet)
        // Docs: https://mesonet.agron.iastate.edu/api/1/docs#/default/service_currents__fmt__get
        async function fetchForeignASOSData() {
            const now = Date.now();
            if (foreignAsosCache && (now - foreignAsosCacheTime < 120000)) {
                return foreignAsosCache;
            }
            const networks = ['CZ__ASOS', 'SK__ASOS', 'DE__ASOS', 'LT__ASOS', 'UA__ASOS', 'BY__ASOS'];
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4500);

            try {
                const fetchPromises = networks.map(net =>
                    fetch(`https://mesonet.agron.iastate.edu/api/1/currents.json?network=${net}`, {
                        signal: controller.signal
                    }).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] }))
                );
                const results = await Promise.all(fetchPromises);
                clearTimeout(timeoutId);

                const stations = [];
                for (const res of results) {
                    if (!res || !Array.isArray(res.data)) continue;
                    for (const d of res.data) {
                        const lat = parseFloat(d.lat);
                        const lon = parseFloat(d.lon);
                        const sid = d.station || '';
                        // Bbox wokół Polski (promień ~200 km) z pominięciem polskich stacji EPxx
                        if (!isNaN(lat) && !isNaN(lon) && lat >= 48.0 && lat <= 56.5 && lon >= 11.5 && lon <= 26.5 && !sid.startsWith('EP')) {
                            stations.push(d);
                        }
                    }
                }
                foreignAsosCache = stations;
                foreignAsosCacheTime = now;
                return stations;
            } catch (e) {
                clearTimeout(timeoutId);
                console.warn("Błąd pobierania stacji ASOS IEM:", e);
                return foreignAsosCache || [];
            }
        }

        let iconModelCache = null;
        let iconModelCacheTime = 0;

        // Pobieranie danych modelu numerycznego DWD ICON (Open-Meteo multi-location API)
        // Docs: https://open-meteo.com/en/docs
        async function fetchIconModelData() {
            const now = Date.now();
            if (iconModelCache && (now - iconModelCacheTime < 180000)) {
                return iconModelCache;
            }

            try {
                // Podział na 2 zapytania równoległe (Polska + granice) dla stabilności i uniknięcia błędu 503
                const plLats = PL_ICON_FILL_COORDS.map(s => s.lat.toFixed(2)).join(',');
                const plLons = PL_ICON_FILL_COORDS.map(s => s.lon.toFixed(2)).join(',');
                const plUrl = `https://api.open-meteo.com/v1/forecast?latitude=${plLats}&longitude=${plLons}&current=temperature_2m,relative_humidity_2m,dew_point_2m,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,snow_depth,snowfall,soil_temperature_6cm&models=icon_seamless`;

                const fLats = FOREIGN_STATIONS.map(s => s.lat.toFixed(2)).join(',');
                const fLons = FOREIGN_STATIONS.map(s => s.lon.toFixed(2)).join(',');
                const fUrl = `https://api.open-meteo.com/v1/forecast?latitude=${fLats}&longitude=${fLons}&current=temperature_2m,relative_humidity_2m,dew_point_2m,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,snow_depth,snowfall,soil_temperature_6cm&models=icon_seamless`;

                const [resPL, resForeign] = await Promise.all([
                    fetch(plUrl).then(r => r.ok ? r.json() : []).catch(() => []),
                    fetch(fUrl).then(r => r.ok ? r.json() : []).catch(() => [])
                ]);

                const arrPL = Array.isArray(resPL) ? resPL : (resPL ? [resPL] : []);
                const arrForeign = Array.isArray(resForeign) ? resForeign : (resForeign ? [resForeign] : []);

                const combined = { pl: arrPL, foreign: arrForeign };
                iconModelCache = combined;
                iconModelCacheTime = now;
                return combined;
            } catch (e) {
                console.warn("Błąd pobierania modelu ICON z Open-Meteo:", e);
                return iconModelCache || { pl: [], foreign: [] };
            }
        }

        // Pomocnicza funkcja wyliczania odległości (w km) do najbliższej stacji pomiarowej
        function getMinDistKm(lat, lon, stationLats, stationLons) {
            if (!stationLats || !stationLats.length) return 99999;
            let minDist = 99999;
            const radLat = lat * Math.PI / 180;
            const cosLat = Math.cos(radLat);
            for (let i = 0; i < stationLats.length; i++) {
                const dLat = (lat - stationLats[i]) * 111.0;
                const dLon = (lon - stationLons[i]) * 111.0 * cosLat;
                const d = Math.sqrt(dLat * dLat + dLon * dLon);
                if (d < minDist) {
                    minDist = d;
                    if (d < 18) return d;
                }
            }
            return minDist;
        }

        const imgwLiveCacheByMode = {};

        async function getIMGWLiveData(targetParam = null) {
            const chkModel = document.getElementById('chk-source-model');
            let dataMode = 'stations';
            if (chkModel) {
                dataMode = chkModel.checked ? 'hybrid' : 'stations';
            } else {
                const modeSelect = document.getElementById('imgw-data-mode');
                dataMode = modeSelect ? modeSelect.value : 'stations';
            }
            const now = Date.now();
            
            // Jeśli żądany parametr to śnieg, a w pamięci brak punktów śniegu, wymuś pobranie
            const cached = imgwLiveCacheByMode[dataMode];
            const isSnowParam = targetParam === 'snieg' || targetParam === 'snieg_swiezy';
            const snowMissingInCache = isSnowParam && cached && cached.data && (!cached.data[targetParam] || !cached.data[targetParam].pt_lats.length);

            if (cached && (now - cached.time < 60000) && !snowMissingInCache) {
                return cached.data;
            }
            
            const loadingEl = document.getElementById('imgw-loading');
            if (loadingEl) {
                loadingEl.style.display = 'flex';
                loadingEl.innerHTML = '<i data-lucide="loader" class="spin"></i> Pobieranie danych meteorologicznych...';
            }
            
            try {
                // Równoległe pobieranie wymaganych źródeł w zależności od trybu
                let reqMeteo = Promise.resolve([]);
                let reqSynop = Promise.resolve([]);
                let reqAsos = Promise.resolve([]);
                let reqSnow = Promise.resolve(null);
                let reqModel = Promise.resolve({ pl: [], foreign: [] });

                if (dataMode === 'stations' || dataMode === 'hybrid') {
                    reqMeteo = fetch('https://danepubliczne.imgw.pl/api/data/meteo/').then(r => r.ok ? r.json() : []).catch(() => []);
                    reqSynop = fetch('https://danepubliczne.imgw.pl/api/data/synop').then(r => r.ok ? r.json() : []).catch(() => []);
                    reqAsos = fetchForeignASOSData();
                    if (window.getSnowData) {
                        reqSnow = window.getSnowData().catch(() => null);
                    }
                }
                if (dataMode === 'model' || dataMode === 'hybrid') {
                    reqModel = fetchIconModelData();
                }

                const [rawData, synopData, asosData, snowData, modelData] = await Promise.all([
                    reqMeteo,
                    reqSynop,
                    reqAsos,
                    reqSnow,
                    reqModel
                ]);
                
                const dataObj = {
                    'temp': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [] },
                    'cisnienie': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [] },
                    'wiatr': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [] },
                    'wiatr_sr': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [] },
                    'rosy': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [] },
                    'lcl': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [] },
                    'wilg': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [] },
                    'grunt': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [] },
                    'snieg': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [] },
                    'snieg_swiezy': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [] }
                };

                // Śledzenie koordynatów stacji fizycznych do deduplikacji w trybie hybrydowym
                const realCoords = {
                    'temp': { lats: [], lons: [] },
                    'cisnienie': { lats: [], lons: [] },
                    'wiatr': { lats: [], lons: [] },
                    'wiatr_sr': { lats: [], lons: [] },
                    'rosy': { lats: [], lons: [] },
                    'lcl': { lats: [], lons: [] },
                    'wilg': { lats: [], lons: [] },
                    'grunt': { lats: [], lons: [] },
                    'snieg': { lats: [], lons: [] },
                    'snieg_swiezy': { lats: [], lons: [] }
                };

                // 1. STACJE SYNOP IMGW (Ciśnienie QNH oraz podstawowe parametry)
                if (Array.isArray(synopData) && dataMode !== 'model') {
                    for (const st of synopData) {
                        const sid = st.id_stacji;
                        const pVal = parseFloat(st.cisnienie);
                        if (isNaN(pVal) || !pVal) continue;
                        
                        const coord = SYNOP_STATIONS_COORDS[sid];
                        if (!coord) continue;
                        
                        const sName = coord.name || st.stacja;
                        const sHour = st.godzina_pomiaru;
                        const sTemp = st.temperatura;
                        const sWind = st.predkosc_wiatru;
                        const sRh = st.wilgotnosc_wzgledna;
                        const timeLabel = sHour ? ` (${sHour}:00 UTC)` : '';
                        
                        window._stationMetaMap = window._stationMetaMap || {};
                        window._stationMetaMap[String(sid)] = { lat: coord.lat, lon: coord.lon, nazwa: sName };
                        
                        dataObj['cisnienie'].pt_lats.push(coord.lat);
                        dataObj['cisnienie'].pt_lons.push(coord.lon);
                        dataObj['cisnienie'].pt_vals.push(pVal);
                        dataObj['cisnienie'].pt_dirs.push(null);
                        dataObj['cisnienie'].pt_txts.push(pVal.toFixed(1));
                        dataObj['cisnienie'].pt_hov.push(
                            `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;">` +
                            `<b style="font-size:0.85rem;">${sName}</b>` +
                            `<span class="badge-odczyt">ODCZYT</span>` +
                            `</div>` +
                            `QFF: <b>${pVal.toFixed(1)} hPa</b>${timeLabel}`
                        );
                        dataObj['cisnienie'].pt_foreign.push(false);
                        dataObj['cisnienie'].pt_types.push('ODCZYT');

                        realCoords['cisnienie'].lats.push(coord.lat);
                        realCoords['cisnienie'].lons.push(coord.lon);
                    }
                }

                // 2. STACJE METEO IMGW (Polska - automatyczne stacje telemetryczne)
                if (Array.isArray(rawData) && dataMode !== 'model') {
                    for (const st of rawData) {
                        const lat = parseFloat(st.lat);
                        const lon = parseFloat(st.lon);
                        if (isNaN(lat) || isNaN(lon)) continue;
                        const nazwa = st.nazwa_stacji;
                        const kod = String(st.kod_stacji || st.id_stacji || '');
                        if (kod) {
                            window._stationMetaMap = window._stationMetaMap || {};
                            window._stationMetaMap[kod] = { lat, lon, nazwa };
                        }
                        
                        const isDataValid = (dateStr) => {
                            if (!dateStr) return false;
                            const parts = dateStr.split(/[- :]/);
                            if (parts.length < 6) return false;
                            const dataDate = new Date(Date.UTC(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]));
                            const diffHours = (Date.now() - dataDate.getTime()) / (1000 * 60 * 60);
                            return diffHours <= 3.5 && diffHours >= -1;
                        };

                        const temp = parseFloat(st.temperatura_powietrza);
                        const temp_t = st.temperatura_powietrza_data;
                        const temp_grunt = parseFloat(st.temperatura_gruntu);
                        const grunt_t = st.temperatura_gruntu_data;
                        const wilg = parseFloat(st.wilgotnosc_wzgledna);
                        const wilg_t = st.wilgotnosc_wzgledna_data;
                        const wiatr_sr = parseFloat(st.wiatr_srednia_predkosc);
                        const wiatr_sr_t = st.wiatr_srednia_predkosc_data;
                        const wiatr_poryw = parseFloat(st.wiatr_poryw_10min);
                        const wiatr_max = parseFloat(st.wiatr_predkosc_maksymalna);
                        const wiatr_kier = parseFloat(st.wiatr_kierunek);
                        const wiatr_por_t = st.wiatr_poryw_10min_data || st.wiatr_predkosc_maksymalna_data;
                        
                        const formatTime = (dateStr) => {
                            if (!dateStr) return '';
                            const parts = dateStr.split(/[- :]/);
                            if (parts.length >= 6) {
                                const utcDate = new Date(Date.UTC(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]));
                                const localTime = utcDate.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'});
                                return ` <span style="font-size:0.75rem; color:#a1a1aa;">(${localTime})</span>`;
                            }
                            return '';
                        };
                        
                        const dewPoint = calculateDewPoint(temp, wilg);
                        let lcl_m = NaN;
                        if (!isNaN(temp) && dewPoint !== null && !isNaN(dewPoint)) {
                            lcl_m = Math.round(125 * Math.max(0, temp - dewPoint));
                        }
                        
                        const porywy = [wiatr_poryw, wiatr_max].filter(v => !isNaN(v)).map(v => v * 3.6);
                        const wiatr_poryw_kmh = porywy.length ? Math.max(...porywy) : NaN;
                        const wiatr_sr_kmh = !isNaN(wiatr_sr) ? wiatr_sr * 3.6 : NaN;

                        const addData = (zmienna, val, txt, hov, dir, t_str, extra) => {
                            if (isNaN(val) || !isDataValid(t_str)) return;
                            dataObj[zmienna].pt_lats.push(lat);
                            dataObj[zmienna].pt_lons.push(lon);
                            dataObj[zmienna].pt_vals.push(val);
                            dataObj[zmienna].pt_dirs.push(dir !== undefined ? dir : null);
                            dataObj[zmienna].pt_txts.push(txt);
                            dataObj[zmienna].pt_hov.push(
                                `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;">` +
                                `<b style="font-size:0.85rem;">${nazwa}</b>` +
                                `<span class="badge-odczyt">ODCZYT</span>` +
                                `</div>` +
                                `${hov}`
                            );
                            dataObj[zmienna].pt_foreign.push(false);
                            dataObj[zmienna].pt_types.push('ODCZYT');
                            
                            realCoords[zmienna].lats.push(lat);
                            realCoords[zmienna].lons.push(lon);

                            if (extra) {
                                if (!dataObj[zmienna].pt_extras) dataObj[zmienna].pt_extras = [];
                                dataObj[zmienna].pt_extras.push(extra);
                            }
                        };

                        addData('temp', temp, temp?.toFixed(1) + '°', `T2m: <b>${temp?.toFixed(1)}°C</b>${formatTime(temp_t)}`, undefined, temp_t);
                        addData('grunt', temp_grunt, temp_grunt?.toFixed(1) + '°', `T5cm: <b>${temp_grunt?.toFixed(1)}°C</b>${formatTime(grunt_t)}`, undefined, grunt_t);
                        addData('wilg', wilg, wilg?.toFixed(0) + '%', `RH: <b>${wilg?.toFixed(0)}%</b>${formatTime(wilg_t)}`, undefined, wilg_t);
                        addData('rosy', dewPoint, dewPoint?.toFixed(1) + '°', `Td: <b>${dewPoint?.toFixed(1)}°C</b>${formatTime(temp_t)}`, undefined, temp_t);
                        addData('lcl', lcl_m, !isNaN(lcl_m) ? (lcl_m + 'm') : '', `LCL: <b>${lcl_m} m n.p.g.</b>${formatTime(temp_t)}<br>T2m: ${temp?.toFixed(1)}°C, Td: ${dewPoint?.toFixed(1)}°C`, undefined, temp_t);
                        addData('wiatr', wiatr_poryw_kmh, wiatr_poryw_kmh?.toFixed(0), `Maks. Wiatr: <b>${wiatr_poryw_kmh?.toFixed(0)} km/h</b>${formatTime(wiatr_por_t)}`, wiatr_kier, wiatr_por_t);
                        addData('wiatr_sr', wiatr_sr_kmh, wiatr_sr_kmh?.toFixed(0), `Śr. Wiatr: <b>${wiatr_sr_kmh?.toFixed(0)} km/h</b>${formatTime(wiatr_sr_t)}`, wiatr_kier, wiatr_sr_t);
                        

                    }
                }

                // 3. STACJE ZAGRANICZNE METAR/ASOS (Prawdziwe dane pomiarowe z Iowa Mesonet)
                if (Array.isArray(asosData) && asosData.length > 0 && dataMode !== 'model') {
                    for (const st of asosData) {
                        const lat = parseFloat(st.lat);
                        const lon = parseFloat(st.lon);
                        if (isNaN(lat) || isNaN(lon)) continue;

                        const cc = (st.network || '').slice(0, 2);
                        const sName = `${st.name || st.station} [${cc}]`;
                        const timeStr = st.local_valid ? st.local_valid.slice(11, 16) : (st.valid ? st.valid.slice(11, 16) : '');
                        const timeLabel = timeStr ? ` (${timeStr})` : '';

                        const temp = st.tmpf != null ? Math.round(((st.tmpf - 32) * 5 / 9) * 10) / 10 : NaN;
                        const dp = st.dwpf != null ? Math.round(((st.dwpf - 32) * 5 / 9) * 10) / 10 : NaN;
                        const rh = st.relh != null ? Math.round(st.relh) : NaN;
                        const pMsl = st.alti != null ? Math.round(st.alti * 33.8639 * 10) / 10 : NaN;
                        const wSpd = st.sknt != null ? Math.round(st.sknt * 1.852) : NaN;
                        const wGust = st.gust != null ? Math.round(st.gust * 1.852) : (!isNaN(wSpd) ? wSpd : NaN);
                        const wDir = st.drct != null ? st.drct : null;

                        let lcl_m = NaN;
                        if (!isNaN(temp) && !isNaN(dp)) {
                            lcl_m = Math.round(125 * Math.max(0, temp - dp));
                        }

                        const addAsosPoint = (zmienna, val, txt, hov, dir, extra) => {
                            if (isNaN(val) || val === null) return;
                            dataObj[zmienna].pt_lats.push(lat);
                            dataObj[zmienna].pt_lons.push(lon);
                            dataObj[zmienna].pt_vals.push(val);
                            dataObj[zmienna].pt_dirs.push(dir !== undefined ? dir : null);
                            dataObj[zmienna].pt_txts.push(txt);
                            dataObj[zmienna].pt_hov.push(
                                `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;">` +
                                `<b style="font-size:0.85rem;">${sName}</b>` +
                                `<span class="badge-odczyt">ODCZYT ASOS</span>` +
                                `</div>` +
                                `${hov}`
                            );
                            dataObj[zmienna].pt_foreign.push(true);
                            dataObj[zmienna].pt_types.push('ODCZYT');

                            realCoords[zmienna].lats.push(lat);
                            realCoords[zmienna].lons.push(lon);

                            if (extra) {
                                if (!dataObj[zmienna].pt_extras) dataObj[zmienna].pt_extras = [];
                                dataObj[zmienna].pt_extras.push(extra);
                            }
                        };

                        if (!isNaN(temp)) addAsosPoint('temp', temp, temp.toFixed(1) + '°', `T2m: <b>${temp.toFixed(1)}°C</b>${timeLabel}`);
                        if (!isNaN(pMsl)) addAsosPoint('cisnienie', pMsl, pMsl.toFixed(1), `QFF: <b>${pMsl.toFixed(1)} hPa</b>${timeLabel}`);
                        if (!isNaN(rh)) addAsosPoint('wilg', rh, rh.toFixed(0) + '%', `RH: <b>${rh.toFixed(0)}%</b>${timeLabel}`);
                        if (!isNaN(dp)) addAsosPoint('rosy', dp, dp.toFixed(1) + '°', `Td: <b>${dp.toFixed(1)}°C</b>${timeLabel}`);
                        if (!isNaN(lcl_m)) addAsosPoint('lcl', lcl_m, lcl_m + 'm', `LCL: <b>${lcl_m} m n.p.g.</b>${timeLabel}<br>T2m: ${temp.toFixed(1)}°C, Td: ${dp.toFixed(1)}°C`);
                        if (!isNaN(wGust)) addAsosPoint('wiatr', wGust, wGust.toFixed(0), `Maks. Wiatr: <b>${wGust.toFixed(0)} km/h</b>${timeLabel}`, wDir);
                        if (!isNaN(wSpd)) addAsosPoint('wiatr_sr', wSpd, wSpd.toFixed(0), `Śr. Wiatr: <b>${wSpd.toFixed(0)} km/h</b>${timeLabel}`, wDir);


                    }
                }

                // 3b. STACJE ŚNIEGOWE IMGW (Pokrywa śnieżna z biuletynu monitoringu hydrologiczno-meteorologicznego)
                if (snowData && dataMode !== 'model') {
                    if (snowData['snieg'] && Array.isArray(snowData['snieg'].pt_lats)) {
                        for (let i = 0; i < snowData['snieg'].pt_lats.length; i++) {
                            dataObj['snieg'].pt_lats.push(snowData['snieg'].pt_lats[i]);
                            dataObj['snieg'].pt_lons.push(snowData['snieg'].pt_lons[i]);
                            dataObj['snieg'].pt_vals.push(snowData['snieg'].pt_vals[i]);
                            dataObj['snieg'].pt_dirs.push(null);
                            dataObj['snieg'].pt_txts.push(snowData['snieg'].pt_txts[i]);
                            dataObj['snieg'].pt_hov.push(snowData['snieg'].pt_hov[i]);
                            dataObj['snieg'].pt_foreign.push(false);
                            dataObj['snieg'].pt_types.push('ODCZYT');

                            realCoords['snieg'].lats.push(snowData['snieg'].pt_lats[i]);
                            realCoords['snieg'].lons.push(snowData['snieg'].pt_lons[i]);
                        }
                    }
                    if (snowData['snieg_swiezy'] && Array.isArray(snowData['snieg_swiezy'].pt_lats)) {
                        for (let i = 0; i < snowData['snieg_swiezy'].pt_lats.length; i++) {
                            dataObj['snieg_swiezy'].pt_lats.push(snowData['snieg_swiezy'].pt_lats[i]);
                            dataObj['snieg_swiezy'].pt_lons.push(snowData['snieg_swiezy'].pt_lons[i]);
                            dataObj['snieg_swiezy'].pt_vals.push(snowData['snieg_swiezy'].pt_vals[i]);
                            dataObj['snieg_swiezy'].pt_dirs.push(null);
                            dataObj['snieg_swiezy'].pt_txts.push(snowData['snieg_swiezy'].pt_txts[i]);
                            dataObj['snieg_swiezy'].pt_hov.push(snowData['snieg_swiezy'].pt_hov[i]);
                            dataObj['snieg_swiezy'].pt_foreign.push(false);
                            dataObj['snieg_swiezy'].pt_types.push('ODCZYT');

                            realCoords['snieg_swiezy'].lats.push(snowData['snieg_swiezy'].pt_lats[i]);
                            realCoords['snieg_swiezy'].lons.push(snowData['snieg_swiezy'].pt_lons[i]);
                        }
                    }
                }

                // 4. MODEL DWD ICON (Open-Meteo) — wypełnianie luk (hybryda) lub pełna siatka modelu
                if (dataMode === 'hybrid' || dataMode === 'model') {
                    const isHybrid = (dataMode === 'hybrid');
                    
                    const processModelList = (metaList, itemsList, isForeignList) => {
                        if (!Array.isArray(metaList) || !Array.isArray(itemsList)) return;
                        for (let i = 0; i < metaList.length; i++) {
                            const meta = metaList[i];
                            const item = itemsList[i];
                            if (!meta || !item || !item.current) continue;
                            const cur = item.current;

                            const lat = meta.lat;
                            const lon = meta.lon;
                            const sName = isForeignList ? `${meta.name} [${meta.cc}]` : meta.name;
                            const timeStr = cur.time ? cur.time.replace('T', ' ') : '';
                            const timeLabel = timeStr ? ` (${timeStr})` : '';

                            const temp = typeof cur.temperature_2m === 'number' ? cur.temperature_2m : NaN;
                            const rh = typeof cur.relative_humidity_2m === 'number' ? cur.relative_humidity_2m : NaN;
                            const dp = typeof cur.dew_point_2m === 'number' ? cur.dew_point_2m : (calculateDewPoint(temp, rh) ?? NaN);
                            const pMsl = typeof cur.pressure_msl === 'number' ? cur.pressure_msl : NaN;
                            const wSpd = typeof cur.wind_speed_10m === 'number' ? cur.wind_speed_10m : NaN;
                            const wDir = typeof cur.wind_direction_10m === 'number' ? cur.wind_direction_10m : null;
                            const wGust = typeof cur.wind_gusts_10m === 'number' ? cur.wind_gusts_10m : NaN;

                            let lcl_m = NaN;
                            if (!isNaN(temp) && !isNaN(dp)) {
                                lcl_m = Math.round(125 * Math.max(0, temp - dp));
                            }

                            const addModelPoint = (zmienna, val, txt, hov, dir, extra) => {
                                if (isNaN(val) || val === null) return;
                                // W trybie hybrydowym: jeśli w promieniu 22 km istnieje stacja fizyczna z tym parametrem, pomiń prognozę modelu
                                if (isHybrid && realCoords[zmienna].lats.length > 0) {
                                    const d = getMinDistKm(lat, lon, realCoords[zmienna].lats, realCoords[zmienna].lons);
                                    if (d < 22.0) return;
                                }

                                dataObj[zmienna].pt_lats.push(lat);
                                dataObj[zmienna].pt_lons.push(lon);
                                dataObj[zmienna].pt_vals.push(val);
                                dataObj[zmienna].pt_dirs.push(dir !== undefined ? dir : null);
                                dataObj[zmienna].pt_txts.push(txt);
                                dataObj[zmienna].pt_hov.push(
                                    `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;">` +
                                    `<b style="font-size:0.85rem;">${sName}</b>` +
                                    `<span class="badge-prognoza">PROGNOZA ICON</span>` +
                                    `</div>` +
                                    `${hov}`
                                );
                                dataObj[zmienna].pt_foreign.push(isForeignList);
                                dataObj[zmienna].pt_types.push('PROGNOZA');

                                if (extra) {
                                    if (!dataObj[zmienna].pt_extras) dataObj[zmienna].pt_extras = [];
                                    dataObj[zmienna].pt_extras.push(extra);
                                }
                            };

                            if (!isNaN(temp)) addModelPoint('temp', temp, temp.toFixed(1) + '°', `T2m: <b>${temp.toFixed(1)}°C</b>${timeLabel}`);
                            if (!isNaN(pMsl)) addModelPoint('cisnienie', pMsl, pMsl.toFixed(1), `QFF: <b>${pMsl.toFixed(1)} hPa</b>${timeLabel}`);
                            if (!isNaN(rh)) addModelPoint('wilg', rh, rh.toFixed(0) + '%', `RH: <b>${rh.toFixed(0)}%</b>${timeLabel}`);
                            if (!isNaN(dp)) addModelPoint('rosy', dp, dp.toFixed(1) + '°', `Td: <b>${dp.toFixed(1)}°C</b>${timeLabel}`);
                            if (!isNaN(lcl_m)) addModelPoint('lcl', lcl_m, lcl_m + 'm', `LCL: <b>${lcl_m} m n.p.g.</b>${timeLabel}<br>T2m: ${temp.toFixed(1)}°C, Td: ${dp.toFixed(1)}°C`);
                            if (!isNaN(wGust)) addModelPoint('wiatr', wGust, wGust.toFixed(0), `Maks. Wiatr: <b>${wGust.toFixed(0)} km/h</b>${timeLabel}`, wDir);
                            if (!isNaN(wSpd)) addModelPoint('wiatr_sr', wSpd, wSpd.toFixed(0), `Śr. Wiatr: <b>${wSpd.toFixed(0)} km/h</b>${timeLabel}`, wDir);

                            // Temperatura gruntu (-6 cm)
                            const tSoil = typeof cur.soil_temperature_6cm === 'number' ? cur.soil_temperature_6cm : NaN;
                            if (!isNaN(tSoil)) addModelPoint('grunt', tSoil, tSoil.toFixed(1) + '°', `T5cm: <b>${tSoil.toFixed(1)}°C</b>${timeLabel}`);

                            // Pokrywa śnieżna i świeży śnieg z modelu numerycznego
                            const snowVal = typeof cur.snow_depth === 'number' ? Math.round(cur.snow_depth * 100 * 10) / 10 : NaN;
                            const freshVal = typeof cur.snowfall === 'number' ? Math.round(cur.snowfall * 10) / 10 : NaN;
                            const modelSnowHov = `Pokrywa śnieżna: <b>${!isNaN(snowVal) ? snowVal.toFixed(1) + ' cm' : '-'}</b>${timeLabel}<br>Świeży śnieg: <b>${!isNaN(freshVal) ? freshVal.toFixed(1) + ' cm' : '-'}</b>`;

                            if (!isNaN(snowVal)) addModelPoint('snieg', snowVal, `${Math.round(snowVal)}cm`, modelSnowHov);
                            if (!isNaN(freshVal)) addModelPoint('snieg_swiezy', freshVal, `${Math.round(freshVal)}cm`, modelSnowHov);
                        }
                    };

                    // Punkty w Polsce (wypełnianie luk)
                    if (modelData && modelData.pl) {
                        processModelList(PL_ICON_FILL_COORDS, modelData.pl, false);
                    }
                    // Punkty zagraniczne
                    if (modelData && modelData.foreign) {
                        processModelList(FOREIGN_STATIONS, modelData.foreign, true);
                    }
                }
                
                imgwLiveCacheByMode[dataMode] = {
                    data: dataObj,
                    time: now
                };
                if (loadingEl) loadingEl.style.display = 'none';
                return dataObj;
            } catch (err) {
                console.error("Błąd pobierania danych meteorologicznych:", err);
                const loadingEl = document.getElementById('imgw-loading');
                if (loadingEl) loadingEl.innerHTML = "Błąd pobierania danych meteorologicznych.";
                return null;
            }
        }

        const ISO_STEPS = ['auto', 1, 2, 5, 10, 20, 30, 40, 50, 100, 200, 500, 1000];

        window.updateIsoStepLabel = function(sliderVal) {
            const idx = parseInt(sliderVal, 10);
            const step = ISO_STEPS[idx] ?? 'auto';
            const labelEl = document.getElementById('iso-step-val');
            if (labelEl) {
                if (step === 'auto') {
                    const zEl = document.getElementById('imgw-zmienna');
                    const curZ = zEl ? zEl.value : 'temp';
                    const defStep = (DEFAULT_ZMIENNE[curZ] && DEFAULT_ZMIENNE[curZ].step) ? DEFAULT_ZMIENNE[curZ].step : 2;
                    labelEl.textContent = `Auto (${defStep})`;
                } else {
                    labelEl.textContent = `${step}`;
                }
            }
        };

        window.renderIMGW = async function() {
            const okres = 'now';
            const zmienna = document.getElementById('imgw-zmienna').value;
            const loadingEl = document.getElementById('imgw-loading');
            
            const isoSlider = document.getElementById('iso-step');
            if (isoSlider && parseInt(isoSlider.value, 10) === 0) {
                window.updateIsoStepLabel(0);
            }
            
            let data = null;
            const liveDataObj = await getIMGWLiveData(zmienna);
            if (liveDataObj) {
                data = liveDataObj[zmienna];
            }

            imgwLayerGroup.clearLayers();
            if(idwOverlay) {
                map.removeLayer(idwOverlay);
                idwOverlay = null;
            }

            if (!data || !data.pt_lats || !data.pt_lats.length) {
                if (loadingEl) loadingEl.style.display = 'none';
                return;
            }
            
            // ZInfo setup - pełna zgodność z oficjalnymi skalami IMGW
            const defaultZi = DEFAULT_ZMIENNE[zmienna] || DEFAULT_ZMIENNE['temp'];
            const zInfo = (imgwData && imgwData.ZMIENNE && imgwData.ZMIENNE[zmienna]) ? imgwData.ZMIENNE[zmienna] : defaultZi;
            
            let scale = defaultZi.cscale;
            if (zInfo && zInfo.cscale) {
                if (Array.isArray(zInfo.cscale)) {
                    scale = zInfo.cscale;
                } else if (typeof zInfo.cscale === 'string') {
                    if (imgwData && imgwData.COLORS && imgwData.COLORS[zInfo.cscale]) {
                        scale = imgwData.COLORS[zInfo.cscale];
                    } else if (DEFAULT_COLORS[zInfo.cscale]) {
                        scale = DEFAULT_COLORS[zInfo.cscale];
                    }
                }
            }
            
            let cmin = (zInfo && zInfo.cmin !== undefined) ? zInfo.cmin : defaultZi.cmin;
            let cmax = (zInfo && zInfo.cmax !== undefined) ? zInfo.cmax : defaultZi.cmax;
            
            // Konfiguracja skali i zakresu dla trendów czasowych
            if (okres && okres.startsWith('trend')) {
                if (zmienna === 'wilg') {
                    cmin = -20;
                    cmax = 20;
                    scale = (imgwData && imgwData.COLORS && imgwData.COLORS['TREND_HUMIDITY_COLORSCALE']) || DEFAULT_TREND_HUMIDITY_COLORSCALE;
                } else if (zmienna === 'wiatr' || zmienna === 'wiatr_sr') {
                    cmin = -30;
                    cmax = 30;
                    scale = (imgwData && imgwData.COLORS && imgwData.COLORS['TREND_TEMP_COLORSCALE']) || DEFAULT_TREND_TEMP_COLORSCALE;
                } else {
                    cmin = -5;
                    cmax = 5;
                    scale = (imgwData && imgwData.COLORS && imgwData.COLORS['TREND_TEMP_COLORSCALE']) || DEFAULT_TREND_TEMP_COLORSCALE;
                }
            }
            
            const showStations = window.MAP_LAYERS && window.MAP_LAYERS['stations'] ? window.MAP_LAYERS['stations'].visible : true;
            const showInter = window.MAP_LAYERS && window.MAP_LAYERS['inter'] ? window.MAP_LAYERS['inter'].visible : true;
            const showTxt = document.getElementById('chk-txt') ? document.getElementById('chk-txt').checked : true;
            const showPt = document.getElementById('chk-pt') ? document.getElementById('chk-pt').checked : false;
            const showIso = document.getElementById('chk-iso') ? document.getElementById('chk-iso').checked : false;
            const showForeign = document.getElementById('chk-foreign') ? document.getElementById('chk-foreign').checked : true;
            const ptColorMode = document.getElementById('pt-color-mode') ? document.getElementById('pt-color-mode').value : 'scale';
            const opacityBg = window.MAP_LAYERS && window.MAP_LAYERS['inter'] ? (window.MAP_LAYERS['inter'].opacity / 100) : (document.getElementById('opa-bg') ? parseInt(document.getElementById('opa-bg').value) / 100 : 0.7);
            
            if(showStations && data.pt_lats && (showTxt || showPt)) {
                for(let i=0; i<data.pt_lats.length; i++) {
                    const isForeign = !!(data.pt_foreign && data.pt_foreign[i]);
                    if (isForeign && !showForeign) continue;
                    
                    let htmlContent = '';
                    const val = data.pt_vals[i];
                    
                    let ptColor = "white";
                    if (ptColorMode === 'scale') ptColor = "rgb(" + getColorRGBA(val, scale, cmin, cmax).slice(0,3).join(',') + ")";
                    else if (ptColorMode === 'black') ptColor = "black";
                    
                    // Standard marker dla wszystkich parametrów
                    const isForecast = !!(data.pt_types && data.pt_types[i] === 'PROGNOZA');
                    const forecastSuffix = isForecast ? '<span style="font-size:0.65rem; color:#60a5fa; vertical-align:top; font-weight:normal; margin-left:1px;" title="Wartość z modelu ICON">~</span>' : '';
                    if(showTxt) htmlContent += `<div style="color: white; text-shadow: 0 0 3px black, 0 0 3px black; font-weight: bold;">${data.pt_txts[i]}${forecastSuffix}</div>`;
                    
                    const isWind = (zmienna === 'wiatr' || zmienna === 'wiatr_sr');
                    
                    if (isWind && !okres.startsWith('trend') && data.pt_dirs && !isNaN(data.pt_dirs[i]) && data.pt_dirs[i] !== null) {
                        const dir = data.pt_dirs[i] + 180;
                        htmlContent += `<div style="width:18px; height:18px; margin:2px auto; transform: rotate(${dir}deg); color: ${ptColor}; text-shadow: 0 0 2px black;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 0px 1px black);">
                                <line x1="12" y1="21" x2="12" y2="3"></line>
                                <polyline points="5 10 12 3 19 10"></polyline>
                            </svg>
                        </div>`;
                    } else if(showPt) {
                        const borderStyle = isForecast ? '2px dashed #60a5fa' : '1px solid rgba(255,255,255,0.7)';
                        const opacityStyle = isForecast ? 'opacity: 0.9;' : '';
                        htmlContent += `<div style="width:10px;height:10px;background:${ptColor};border-radius:50%;margin:2px auto;box-shadow:0 0 2px black; border:${borderStyle}; ${opacityStyle}"></div>`;
                    }
                    
                    const icon = L.divIcon({
                        className: 'imgw-station-marker',
                        html: htmlContent,
                        iconSize: [30, 25],
                        iconAnchor: [15, 12]
                    });
                    
                    L.marker([data.pt_lats[i], data.pt_lons[i]], {icon: icon, pane: 'stationsPane'})
                     .bindTooltip(data.pt_hov[i])
                     .addTo(imgwLayerGroup);
                }
            }
            
            if(data.pt_lats && data.pt_lats.length > 5 && showInter) {
                const isoSlider = document.getElementById('iso-step');
                let rawStep = 'auto';
                if (isoSlider) {
                    const idx = parseInt(isoSlider.value, 10);
                    rawStep = ISO_STEPS[idx] ?? 'auto';
                }
                let stepVal = (rawStep !== 'auto' && !isNaN(rawStep)) ? parseFloat(rawStep) : (zInfo.step || 2.0);
                if (okres && okres.startsWith('trend') && rawStep === 'auto') {
                    stepVal = (zmienna === 'wilg') ? 5.0 : 1.0;
                }
                const unitStr = (okres && okres.startsWith('trend')) ? `${zInfo.unit || ''}/h` : zInfo.unit;

                let idwLats = data.pt_lats;
                let idwLons = data.pt_lons;
                let idwVals = data.pt_vals;

                if (!showForeign && data.pt_foreign) {
                    idwLats = [];
                    idwLons = [];
                    idwVals = [];
                    for (let i = 0; i < data.pt_lats.length; i++) {
                        if (!data.pt_foreign[i]) {
                            idwLats.push(data.pt_lats[i]);
                            idwLons.push(data.pt_lons[i]);
                            idwVals.push(data.pt_vals[i]);
                        }
                    }
                }

                const hasForeignActive = showForeign && data.pt_foreign && data.pt_foreign.some(f => f);
                const geoBounds = hasForeignActive 
                    ? { minLat: 47.0, maxLat: 56.5, minLon: 11.0, maxLon: 27.5 }
                    : { minLat: 48.5, maxLat: 55.5, minLon: 13.5, maxLon: 24.5 };
                const bounds = hasForeignActive
                    ? [[47.0, 11.0], [56.5, 27.5]]
                    : [[48.5, 13.5], [55.5, 24.5]];
                const clipToPoland = !hasForeignActive;

                const dataUrl = generateIDWImage(idwLats, idwLons, idwVals, scale, cmin, cmax, showIso, stepVal, unitStr, geoBounds, clipToPoland);
                idwOverlay = L.imageOverlay(dataUrl, bounds, { opacity: opacityBg, pane: 'weatherPane' }).addTo(map);
            }
        }

        // Initial render dla aktualnych danych ('now' korzysta z lekkiego API 25 KB)
        window.renderIMGW();

        L.control.layers(
            basemaps,
            {"Stacje IMGW": imgwLayerGroup},
            {position: 'topright'}
        ).addTo(map);

        lucide.createIcons();
        setTimeout(() => map.invalidateSize(), 500);
    }, 200);
};

// Auto-start map on standalone page
document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // Na telefonach domyślnie zwijamy panel boczny, aby od razu pokazać pełną mapę
    if (window.innerWidth < 768) {
        const sb = document.getElementById('map-sidebar');
        const icon = document.getElementById('sidebar-toggle-icon');
        if (sb) sb.classList.add('sidebar-collapsed');
        if (icon) icon.setAttribute('data-lucide', 'panel-left-open');
    }

    setTimeout(() => {
        if (typeof window.initMapa === 'function') {
            window.initMapa();
        }
    }, 150);
});
