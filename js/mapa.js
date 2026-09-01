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
                            { offset: 15, repeat: 40, symbol: L.Symbol.marker({
                                rotate: true,
                                markerOptions: {
                                    icon: L.divIcon({
                                        className: 'front-chlodny-icon',
                                        html: '<svg viewBox="0 0 20 10" style="width:20px;height:10px;"><path d="M 0 10 L 10 0 L 20 10 Z" fill="#3b82f6"/></svg>',
                                        iconSize: [20, 10],
                                        iconAnchor: [10, 10]
                                    })
                                }
                            })}
                        ]
                    }).addTo(map);
                    layer._myDecorator = decorator;
                } else if (window.currentDrawingMode === 'front_chlodny_2') {
                    const decorator = L.polylineDecorator(layer, {
                        patterns: [
                            { offset: 15, repeat: 40, symbol: L.Symbol.marker({
                                rotate: true,
                                markerOptions: {
                                    icon: L.divIcon({
                                        className: 'front-chlodny-icon',
                                        html: '<svg viewBox="0 0 20 10" style="width:20px;height:10px;"><path d="M 0 10 L 10 0 L 20 10 Z" fill="#3b82f6"/></svg>',
                                        iconSize: [20, 10],
                                        iconAnchor: [10, 10]
                                    })
                                }
                            })}
                        ]
                    }).addTo(map);
                    layer._myDecorator = decorator;
                } else if (window.currentDrawingMode === 'front_cieply') {
                    const decorator = L.polylineDecorator(layer, {
                        patterns: [
                            { offset: 15, repeat: 40, symbol: L.Symbol.marker({
                                rotate: true,
                                markerOptions: {
                                    icon: L.divIcon({
                                        className: 'front-cieply-icon',
                                        html: '<svg viewBox="0 0 20 10" style="width:20px;height:10px;"><path d="M 0 10 A 10 10 0 0 1 20 10 Z" fill="#ef4444"/></svg>',
                                        iconSize: [20, 10],
                                        iconAnchor: [10, 10]
                                    })
                                }
                            })}
                        ]
                    }).addTo(map);
                    layer._myDecorator = decorator;
                } else if (window.currentDrawingMode === 'front_zokludowany') {
                    const decorator = L.polylineDecorator(layer, {
                        patterns: [
                            { offset: 15, repeat: 60, symbol: L.Symbol.marker({
                                rotate: true,
                                markerOptions: {
                                    icon: L.divIcon({
                                        className: 'front-zokl-icon',
                                        html: '<svg viewBox="0 0 20 10" style="width:20px;height:10px;"><path d="M 0 10 L 10 0 L 20 10 Z" fill="#d946ef"/></svg>',
                                        iconSize: [20, 10],
                                        iconAnchor: [10, 10]
                                    })
                                }
                            })},
                            { offset: 45, repeat: 60, symbol: L.Symbol.marker({
                                rotate: true,
                                markerOptions: {
                                    icon: L.divIcon({
                                        className: 'front-zokl-icon',
                                        html: '<svg viewBox="0 0 20 10" style="width:20px;height:10px;"><path d="M 0 10 A 10 10 0 0 1 20 10 Z" fill="#d946ef"/></svg>',
                                        iconSize: [20, 10],
                                        iconAnchor: [10, 10]
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
                                        html: '<svg viewBox="0 0 10 10" style="width:10px;height:10px;"><path d="M 10 10 L 0 0" stroke="#f97316" stroke-width="2" fill="none"/></svg>',
                                        iconSize: [10, 10],
                                        iconAnchor: [10, 10]
                                    })
                                }
                            })}
                        ]
                    }).addTo(map);
                    layer._myDecorator = decorator;
                } else if (window.currentDrawingMode === 'strzalka') {
                    const decorator = L.polylineDecorator(layer, {
                        patterns: [
                            { offset: '100%', repeat: 0, symbol: L.Symbol.arrowHead({pixelSize: 18, polygon: true, pathOptions: {stroke: true, color: '#a8a29e', fillColor: '#a8a29e', fillOpacity: 1}}) }
                        ]
                    }).addTo(map);
                    layer._myDecorator = decorator;
                } else if (window.currentDrawingMode === 'wyz') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-wyz',
                        html: '<div style="color: #3b82f6; font-weight: bold; font-family: sans-serif; font-size: 32px; text-shadow: 0px 0px 4px white, 0px 0px 4px white; transform: translate(-50%, -50%);">W</div>',
                        iconSize: [0, 0]
                    }));
                } else if (window.currentDrawingMode === 'niz') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-niz',
                        html: '<div style="color: #ef4444; font-weight: bold; font-family: sans-serif; font-size: 32px; text-shadow: 0px 0px 4px white, 0px 0px 4px white; transform: translate(-50%, -50%);">N</div>',
                        iconSize: [0, 0]
                    }));
                } else if (window.currentDrawingMode === 'burza') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-burza',
                        html: '<div style="color: #ef4444; font-size: 32px; text-shadow: 0px 0px 4px white; transform: translate(-50%, -50%);"></div>',
                        iconSize: [0, 0]
                    }));
                } else if (window.currentDrawingMode === 'deszcz') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-deszcz',
                        html: '<div style="color: #22c55e; font-size: 32px; font-weight: bold; text-shadow: 0px 0px 4px white; transform: translate(-50%, -50%);"></div>',
                        iconSize: [0, 0]
                    }));
                } else if (window.currentDrawingMode === 'snieg') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-snieg',
                        html: '<div style="color: #3b82f6; font-size: 32px; text-shadow: 0px 0px 4px white; transform: translate(-50%, -50%);"></div>',
                        iconSize: [0, 0]
                    }));
                } else if (window.currentDrawingMode === 'mgla') {
                    layer.setIcon(L.divIcon({
                        className: 'meteo-icon-mgla',
                        html: '<div style="color: #eab308; font-size: 32px; font-weight: bold; text-shadow: 0px 0px 4px white; transform: translate(-50%, -50%);">≡</div>',
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
                map.pm.setGlobalOptions({ pathOptions: { color: color, weight: 3, fillOpacity: 0.4, dashArray: '' } });
                map.pm.enableDraw('Polygon');
            }
        };

        window.setDrawingMode = function(mode) {
            if(!map.pm) return;
            window.currentDrawingMode = mode;
            if(mode === 'zbieznosc') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#f97316', weight: 3, fillOpacity: 0, dashArray: '' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'front_chlodny') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#3b82f6', weight: 3, fillOpacity: 0, dashArray: '' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'front_chlodny_2') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#3b82f6', weight: 3, fillOpacity: 0, dashArray: '8, 8' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'front_cieply') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#ef4444', weight: 3, fillOpacity: 0, dashArray: '' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'front_zokludowany') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#d946ef', weight: 3, fillOpacity: 0, dashArray: '' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'strzalka') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#a8a29e', weight: 4, fillOpacity: 0, dashArray: '' } });
                map.pm.enableDraw('Line');
            } else if(mode === 'kolko') {
                map.pm.setGlobalOptions({ pathOptions: { color: '#22c55e', weight: 3, fillOpacity: 0.3, dashArray: '' } });
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

        window.openEnsembleModal = function() {
            const modal = document.getElementById('ensemble-modal');
            modal.style.display = 'block';
            
            const thresh = document.getElementById('ens-thresh').value;
            const days = document.getElementById('ens-days').value;
            
            // Wgrywamy iframe z prognozą
            const container = document.getElementById('ensemble-iframe-container');
            container.innerHTML = `<iframe src="prognoza/dashboard.html?v=3&thresh=${thresh}&days=${days}" style="width: 100%; height: 100%; border: none;"></iframe>`;
        };

        // ----------------------------------------------------
        // PODKŁADY MAPOWE (CARTO z kluczem API)
        // ----------------------------------------------------
        // Warstwy bazowe (Otwarte, czyste, bez znaku wodnego)
        const darkBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', { 
            maxZoom: 16, pane: 'basePane', attribution: '© Esri' 
        });
        
        const lightBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16, pane: 'basePane', attribution: '© Esri' });

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
            "Jasny (Voyager)": lightBase
        };
        basemaps["Ciemny (Dark)"].addTo(map);
        cityLabelsGroup.addTo(map);

        map.on('baselayerchange', function(e) {
            const isLight = e.name && e.name.toLowerCase().includes('jasny');
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
        let activeRadarSource = 'imgw'; // Domyślnie oficjalny polski radar IMGW CMAX!
        let radarTileLayer = null, radarHost = '', radarFrames = [], currentFrame = 0, animationTimer = null;
        let imgwRadarOverlay = null, imgwFrames = [];
        const IMGW_RADAR_BOUNDS = [[48.0, 13.5], [56.0, 24.5]];

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
            opacity: 0.65,
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
            opacity: 0.60,
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
                const plCount = activeStrikes.filter(s => s.lat >= 48.8 && s.lat <= 55.2 && s.lon >= 13.9 && s.lon <= 24.3).length;
                countEl.textContent = `${activeStrikes.length} (${plCount} w PL)`;
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
            'drawings':   { id: 'drawings',   name: 'Kreator Ostrzeżeń',     visible: false, opacity: 100, pane: 'drawingsPane' },
            'stations':   { id: 'stations',   name: 'Stacje i Pomiary IMGW', visible: true,  opacity: 100, pane: 'stationsPane' },
            'boundaries': { id: 'boundaries', name: 'Granice',               visible: true,  opacity: 100, pane: 'boundariesPane' },
            'lightning':  { id: 'lightning',  name: 'Wyładowania (Live)',    visible: false, opacity: 95,  pane: 'lightningPane' },
            'radar':      { id: 'radar',      name: 'Radar Opadów',          visible: false, opacity: 87,  pane: 'radarPane' },
            'sat_day':    { id: 'sat_day',    name: 'Satelita Dzienny (HRV)', visible: false, opacity: 100, pane: 'satellitePane' },
            'inter':      { id: 'inter',      name: 'Interpolacja IMGW',     visible: true,  opacity: 70,  pane: 'weatherPane' },
            'sat_night':  { id: 'sat_night',  name: 'Satelita Nocny (IR)',   visible: false, opacity: 60,  pane: 'satelliteNightPane' }
        };

        // Domyślna kolejność od góry (wierzch) do dołu
        window.layerOrder = ['drawings', 'stations', 'boundaries', 'lightning', 'radar', 'sat_day', 'inter', 'sat_night'];

        // Wczytaj zapisany stan z localStorage jeśli istnieje
        try {
            const savedLayers = localStorage.getItem('meteo_map_layers');
            const savedOrder = localStorage.getItem('meteo_map_order');
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
                localStorage.setItem('meteo_map_layers', JSON.stringify(window.MAP_LAYERS));
                localStorage.setItem('meteo_map_order', JSON.stringify(window.layerOrder));
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
            
            if (key === 'sat_day') {
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
                const extraInfo = key === 'lightning' ? ` <span id="bo-strike-count" style="font-size: 0.65rem; color: #eab308; font-weight: normal;">(0)</span>` : '';
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

        // ----------------------------------------------------
        // PEŁNY EKRAN I ZWIJANIE PANELU BOCZNEGO
        // ----------------------------------------------------
        window.toggleMapFullscreen = function() {
            const container = document.querySelector('.map-dashboard-container');
            const fsBtn = document.getElementById('map-fs-btn');
            if (!container) return;

            const isFs = container.classList.toggle('map-fullscreen');

            if (isFs) {
                if (fsBtn) fsBtn.innerHTML = '<i data-lucide="minimize" style="width: 15px; height: 15px;"></i> <span id="map-fs-text">Zamknij Pełny Ekran</span>';
                if (container.requestFullscreen && !document.fullscreenElement) {
                    container.requestFullscreen().catch(() => {});
                }
            } else {
                if (fsBtn) fsBtn.innerHTML = '<i data-lucide="maximize" style="width: 15px; height: 15px;"></i> <span id="map-fs-text">Pełny Ekran</span>';
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
                if (fsBtn) fsBtn.innerHTML = '<i data-lucide="maximize" style="width: 15px; height: 15px;"></i> <span id="map-fs-text">Pełny Ekran</span>';
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

        const DEFAULT_COLORS = {
            "TEMP_COLORSCALE": DEFAULT_TEMP_COLORSCALE,
            "WIND_COLORSCALE": DEFAULT_WIND_COLORSCALE,
            "HUMIDITY_COLORSCALE": DEFAULT_HUMIDITY_COLORSCALE,
            "DEWPOINT_COLORSCALE": DEFAULT_DEWPOINT_COLORSCALE,
            "LCL_COLORSCALE": DEFAULT_LCL_COLORSCALE
        };

        const DEFAULT_ZMIENNE = {
            "temp":     { "nazwa": "Temperatura", "cscale": DEFAULT_TEMP_COLORSCALE, "cmin": -40, "cmax": 50, "unit": "°C", "step": 2.0 },
            "grunt":    { "nazwa": "Temp. Gruntu", "cscale": DEFAULT_TEMP_COLORSCALE, "cmin": -40, "cmax": 50, "unit": "°C", "step": 2.0 },
            "wiatr":    { "nazwa": "Poryw Wiatru", "cscale": DEFAULT_WIND_COLORSCALE, "cmin": 0, "cmax": 259, "unit": "km/h", "step": 10.0 },
            "wiatr_sr": { "nazwa": "Śr. Wiatr", "cscale": DEFAULT_WIND_COLORSCALE, "cmin": 0, "cmax": 259, "unit": "km/h", "step": 10.0 },
            "wilg":     { "nazwa": "Wilgotność", "cscale": DEFAULT_HUMIDITY_COLORSCALE, "cmin": 0, "cmax": 100, "unit": "%", "step": 10.0 },
            "rosy":     { "nazwa": "Punkt Rosy", "cscale": DEFAULT_DEWPOINT_COLORSCALE, "cmin": -10, "cmax": 28, "unit": "°C", "step": 2.0 },
            "lcl":      { "nazwa": "Podstawa Chmur (LCL)", "cscale": DEFAULT_LCL_COLORSCALE, "cmin": 0, "cmax": 3000, "unit": "m", "step": 250.0 },
            "synop":    { "nazwa": "Model Synoptyczny", "cscale": DEFAULT_TEMP_COLORSCALE, "cmin": -40, "cmax": 50, "unit": "°C", "step": 2.0 },
            "cisnienie": { "nazwa": "Ciśnienie", "cscale": DEFAULT_PRESSURE_COLORSCALE, "cmin": 980, "cmax": 1040, "unit": "hPa", "step": 2.0 }
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

        function generateIDWImage(lats, lons, vals, scale, cmin, cmax, drawIso, stepVal = null, unit = '') {
            const w = 360, h = 270;
            const offCanvas = document.createElement('canvas');
            offCanvas.width = w; 
            offCanvas.height = h;
            const offCtx = offCanvas.getContext('2d');
            const imgData = offCtx.createImageData(w, h);
            const valGrid = new Float32Array(w * h);
            
            const minLat = 48.5, maxLat = 55.5;
            const minLon = 13.5, maxLon = 24.5;
            const minMercY = latToMercY(minLat);
            const maxMercY = latToMercY(maxLat);
            
            const pts = [];
            for(let i=0; i<lats.length; i++) {
                const px = ((lons[i] - minLon) / (maxLon - minLon)) * w;
                const py = (1 - (latToMercY(lats[i]) - minMercY) / (maxMercY - minMercY)) * h;
                pts.push({x: px, y: py, v: vals[i]});
            }

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    let num = 0, den = 0;
                    for(let i=0; i<pts.length; i++) {
                        const dx = x - pts[i].x;
                        const dy = y - pts[i].y;
                        let d2 = dx*dx + dy*dy;
                        if(d2 < 0.5) d2 = 0.5;
                        const weight = 1.0 / (d2 * d2);
                        num += weight * pts[i].v;
                        den += weight;
                    }
                    const val = num / den;
                    const idx = (y * w + x);
                    valGrid[idx] = val;
                    
                    const rgba = getColorRGBA(val, scale, cmin, cmax);
                    const pIdx = idx * 4;
                    imgData.data[pIdx] = rgba[0];
                    imgData.data[pIdx+1] = rgba[1];
                    imgData.data[pIdx+2] = rgba[2];
                    imgData.data[pIdx+3] = rgba[3]; 
                }
            }
            
            const isoLabels = [];
            if (drawIso) {
                const step = (stepVal && !isNaN(stepVal) && stepVal > 0) ? stepVal : ((cmax - cmin) / 15);
                for (let y = 0; y < h - 1; y++) {
                    for (let x = 0; x < w - 1; x++) {
                        const idx = y * w + x;
                        const v1 = valGrid[idx];
                        const v2 = valGrid[idx + 1];
                        const v3 = valGrid[idx + w];
                        
                        const q1 = Math.floor(v1 / step);
                        const q2 = Math.floor(v2 / step);
                        const q3 = Math.floor(v3 / step);

                        if (q1 !== q2 || q1 !== q3) {
                            const pIdx = idx * 4;
                            imgData.data[pIdx] = 15;
                            imgData.data[pIdx+1] = 23;
                            imgData.data[pIdx+2] = 42;
                            imgData.data[pIdx+3] = 220; // Elegancka, wyraźna linia izobary/izolinii
                            
                            // Próbkowanie etykiet (co ok. 60 px)
                            if (x > 20 && x < w - 20 && y > 20 && y < h - 20 && x % 55 === 0 && y % 45 === 0) {
                                const roundedVal = (Math.round(v1 / step) * step).toFixed(step < 1 ? 1 : 0);
                                isoLabels.push({ x, y, text: roundedVal });
                            }
                        }
                    }
                }
            }
            
            offCtx.putImageData(imgData, 0, 0);

            // Nanoszenie etykiet liczbowych na linie izobar/izolinii
            if (drawIso && isoLabels.length > 0) {
                offCtx.font = 'bold 9px monospace';
                offCtx.textAlign = 'center';
                offCtx.textBaseline = 'middle';
                for (let lbl of isoLabels) {
                    offCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                    offCtx.fillRect(lbl.x - 14, lbl.y - 6, 28, 12);
                    offCtx.fillStyle = '#ffffff';
                    offCtx.fillText(lbl.text, lbl.x, lbl.y);
                }
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

        let imgwLiveCache = null;
        let imgwLiveCacheTime = 0;

        async function getIMGWLiveData() {
            const now = Date.now();
            if(imgwLiveCache && (now - imgwLiveCacheTime < 60000)) return imgwLiveCache; // 1 min cache
            
            document.getElementById('imgw-loading').style.display = 'flex';
            document.getElementById('imgw-loading').innerHTML = '<i data-lucide="loader" class="spin"></i> Pobieranie danych z IMGW (Live)...';
            
            try {
                // Pobieranie danych automatycznych (meteo) oraz synoptycznych (synop) równolegle
                // IMGW API Docs: https://danepubliczne.imgw.pl/api/data/meteo/ | https://danepubliczne.imgw.pl/api/data/synop
                const [resMeteo, resSynop] = await Promise.all([
                    fetch('https://danepubliczne.imgw.pl/api/data/meteo/'),
                    fetch('https://danepubliczne.imgw.pl/api/data/synop')
                ]);
                const rawData = await resMeteo.json();
                const synopData = await resSynop.json();
                
                const dataObj = {
                    'temp': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [] },
                    'cisnienie': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [] },
                    'wiatr': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [] },
                    'wiatr_sr': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [] },
                    'rosy': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [] },
                    'lcl': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [] },
                    'wilg': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [] },
                    'grunt': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [] },
                    'synop': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [] }
                };

                // Przetwarzanie stacji SYNOP dla ciśnienia atmosferycznego (zredukowane do poziomu morza w hPa)
                for (let st of synopData) {
                    const sid = st.id_stacji;
                    const pVal = parseFloat(st.cisnienie);
                    if (isNaN(pVal) || !pVal) continue;
                    
                    const coord = SYNOP_STATIONS_COORDS[sid];
                    if (!coord) continue;
                    
                    const sName = coord.name || st.stacja;
                    const sDate = st.data_pomiaru;
                    const sHour = st.godzina_pomiaru;
                    const sTemp = st.temperatura;
                    const sWind = st.predkosc_wiatru;
                    const sRh = st.wilgotnosc_wzgledna;
                    const timeLabel = sHour ? ` (${sHour}:00 UTC)` : '';
                    
                    dataObj['cisnienie'].pt_lats.push(coord.lat);
                    dataObj['cisnienie'].pt_lons.push(coord.lon);
                    dataObj['cisnienie'].pt_vals.push(pVal);
                    dataObj['cisnienie'].pt_dirs.push(null);
                    dataObj['cisnienie'].pt_txts.push(pVal.toFixed(1));
                    dataObj['cisnienie'].pt_hov.push(
                        `<b>${sName}</b> (Stacja SYNOP)<br>` +
                        `Ciśnienie (QNH): <b>${pVal.toFixed(1)} hPa</b>${timeLabel}<br>` +
                        `Temperatura: ${sTemp || '-'}°C, Wilgotność: ${sRh || '-'}%<br>` +
                        `Wiatr: ${sWind || '-'} m/s (${st.kierunek_wiatru || '-'}°)`
                    );
                }

                for(let st of rawData) {
                    const lat = parseFloat(st.lat);
                    const lon = parseFloat(st.lon);
                    if(isNaN(lat) || isNaN(lon)) continue;
                    const nazwa = st.nazwa_stacji;
                    
                    const isDataValid = (dateStr) => {
                        if(!dateStr) return false;
                        const parts = dateStr.split(/[- :]/);
                        if (parts.length < 6) return false;
                        const dataDate = new Date(Date.UTC(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]));
                        const diffHours = (Date.now() - dataDate.getTime()) / (1000 * 60 * 60);
                        return diffHours <= 3.5 && diffHours >= -1; // tolerancja dla spóźnionych stacji
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
                    
                    // Weź nowszy czas z porywów
                    const wiatr_por_t = st.wiatr_poryw_10min_data || st.wiatr_predkosc_maksymalna_data;
                    
                    const formatTime = (dateStr) => {
                        if(!dateStr) return '';
                        const parts = dateStr.split(/[- :]/);
                        if(parts.length >= 6) {
                            const utcDate = new Date(Date.UTC(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]));
                            const localTime = utcDate.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'});
                            return ` <span style="font-size:0.75rem; color:#a1a1aa;">(${localTime})</span>`;
                        }
                        return '';
                    };
                    
                    const dewPoint = calculateDewPoint(temp, wilg);
                    
                    // Obliczenie wysokości podstawy chmur (LCL) wg wzoru Espy'ego: h_LCL = 125 * (T - Td)
                    let lcl_m = NaN;
                    if (!isNaN(temp) && dewPoint !== null && !isNaN(dewPoint)) {
                        lcl_m = Math.round(125 * Math.max(0, temp - dewPoint));
                    }
                    
                    const porywy = [wiatr_poryw, wiatr_max].filter(v => !isNaN(v)).map(v => v * 3.6);
                    const wiatr_poryw_kmh = porywy.length ? Math.max(...porywy) : NaN;
                    const wiatr_sr_kmh = !isNaN(wiatr_sr) ? wiatr_sr * 3.6 : NaN;

                    const addData = (zmienna, val, txt, hov, dir, t_str, extra) => {
                        if(isNaN(val) || !isDataValid(t_str)) return;
                        dataObj[zmienna].pt_lats.push(lat);
                        dataObj[zmienna].pt_lons.push(lon);
                        dataObj[zmienna].pt_vals.push(val);
                        dataObj[zmienna].pt_dirs.push(dir !== undefined ? dir : null);
                        dataObj[zmienna].pt_txts.push(txt);
                        dataObj[zmienna].pt_hov.push(`<b>${nazwa}</b><br>${hov}`);
                        if(extra) {
                            if(!dataObj[zmienna].pt_extras) dataObj[zmienna].pt_extras = [];
                            dataObj[zmienna].pt_extras.push(extra);
                        }
                    };

                    addData('temp', temp, temp?.toFixed(1) + '°', `Temperatura: ${temp?.toFixed(1)}°C${formatTime(temp_t)}`, undefined, temp_t);
                    addData('grunt', temp_grunt, temp_grunt?.toFixed(1) + '°', `Temp. Gruntu: ${temp_grunt?.toFixed(1)}°C${formatTime(grunt_t)}`, undefined, grunt_t);
                    addData('wilg', wilg, wilg?.toFixed(0) + '%', `Wilgotność: ${wilg?.toFixed(0)}%${formatTime(wilg_t)}`, undefined, wilg_t);
                    addData('rosy', dewPoint, dewPoint?.toFixed(1) + '°', `Punkt Rosy: ${dewPoint?.toFixed(1)}°C${formatTime(temp_t)}`, undefined, temp_t);
                    addData('lcl', lcl_m, !isNaN(lcl_m) ? (lcl_m + 'm') : '', `Podstawa Chmur (LCL): <b>${lcl_m} m n.p.g.</b><br>Temperatura: ${temp?.toFixed(1)}°C, Punkt Rosy: ${dewPoint?.toFixed(1)}°C${formatTime(temp_t)}`, undefined, temp_t);
                    addData('wiatr', wiatr_poryw_kmh, wiatr_poryw_kmh?.toFixed(0), `Poryw Wiatru: ${wiatr_poryw_kmh?.toFixed(0)} km/h${formatTime(wiatr_por_t)}`, wiatr_kier, wiatr_por_t);
                    addData('wiatr_sr', wiatr_sr_kmh, wiatr_sr_kmh?.toFixed(0), `Wiatr (Śr): ${wiatr_sr_kmh?.toFixed(0)} km/h${formatTime(wiatr_sr_t)}`, wiatr_kier, wiatr_sr_t);
                    
                    // synop: display temp as value, but text contains more info
                    if(!isNaN(temp) && isDataValid(temp_t)) {
                        const extra = { temp, dewPoint, wiatr_sr_kmh, wiatr_poryw_kmh, wiatr_kier, wilg };
                        addData('synop', temp, '', `Temp: ${temp?.toFixed(1)}°C${formatTime(temp_t)}<br>Wiatr: ${wiatr_poryw_kmh?.toFixed(0)} km/h${formatTime(wiatr_por_t)}<br>Wilg: ${wilg}%${formatTime(wilg_t)}`, wiatr_kier, temp_t, extra);
                    }
                }
                
                imgwLiveCache = dataObj;
                imgwLiveCacheTime = now;
                document.getElementById('imgw-loading').style.display = 'none';
                return imgwLiveCache;
            } catch (err) {
                console.error("Błąd IMGW Live API:", err);
                document.getElementById('imgw-loading').innerHTML = "Błąd pobierania danych IMGW API.";
                return null;
            }
        }

        window.renderIMGW = async function() {
            const okres = document.getElementById('imgw-okres').value;
            const zmienna = document.getElementById('imgw-zmienna').value;
            
            let data = null;
            
            if (okres === 'now') {
                const liveDataObj = await getIMGWLiveData();
                if(liveDataObj) {
                    data = liveDataObj[zmienna];
                }
            } else {
                // Historia Firebase (Lazy-load na żądanie - oszczędza 11.75 MB przy każdym załadowaniu strony)
                if (!imgwData) {
                    const loadingEl = document.getElementById('imgw-loading');
                    if (loadingEl) {
                        loadingEl.style.display = 'flex';
                        loadingEl.innerHTML = '<i data-lucide="loader" class="spin"></i> Wczytywanie danych historycznych (Firebase)...';
                    }
                    try {
                        let token = window.getFirebaseToken ? await window.getFirebaseToken() : null;
                        let authParam = token ? `?auth=${token}` : '';
                        const res = await fetch(`https://meteo-bbe28-default-rtdb.europe-west1.firebasedatabase.app/imgw_map_data.json${authParam}`);
                        const text = await res.text();
                        if (window.trackFirebaseDownload) window.trackFirebaseDownload(text.length);
                        imgwData = JSON.parse(text);
                    } catch (e) {
                        console.error("Błąd pobierania historii Firebase:", e);
                    } finally {
                        if (loadingEl) loadingEl.style.display = 'none';
                    }
                }
                if(!imgwData || !imgwData.MAP_DATA) return;
                const ds = imgwData.MAP_DATA[zmienna];
                if(ds && ds[okres]) data = ds[okres];
            }

            if(!data) return;

            imgwLayerGroup.clearLayers();
            if(idwOverlay) {
                map.removeLayer(idwOverlay);
                idwOverlay = null;
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
            
            const cmin = (zInfo && zInfo.cmin !== undefined) ? zInfo.cmin : defaultZi.cmin;
            const cmax = (zInfo && zInfo.cmax !== undefined) ? zInfo.cmax : defaultZi.cmax;
            
            const showStations = window.MAP_LAYERS && window.MAP_LAYERS['stations'] ? window.MAP_LAYERS['stations'].visible : true;
            const showInter = window.MAP_LAYERS && window.MAP_LAYERS['inter'] ? window.MAP_LAYERS['inter'].visible : true;
            const showTxt = document.getElementById('chk-txt') ? document.getElementById('chk-txt').checked : true;
            const showPt = document.getElementById('chk-pt') ? document.getElementById('chk-pt').checked : false;
            const showIso = document.getElementById('chk-iso') ? document.getElementById('chk-iso').checked : false;
            const ptColorMode = document.getElementById('pt-color-mode') ? document.getElementById('pt-color-mode').value : 'scale';
            const opacityBg = window.MAP_LAYERS && window.MAP_LAYERS['inter'] ? (window.MAP_LAYERS['inter'].opacity / 100) : (document.getElementById('opa-bg') ? parseInt(document.getElementById('opa-bg').value) / 100 : 0.7);
            
            if(showStations && data.pt_lats && (showTxt || showPt)) {
                for(let i=0; i<data.pt_lats.length; i++) {
                    let htmlContent = '';
                    const val = data.pt_vals[i];
                    
                    let ptColor = "white";
                    if (ptColorMode === 'scale') ptColor = "rgb(" + getColorRGBA(val, scale, cmin, cmax).slice(0,3).join(',') + ")";
                    else if (ptColorMode === 'black') ptColor = "black";
                    
                    if(zmienna === 'synop' && data.pt_extras && data.pt_extras[i]) {
                        // Render full synoptic station model
                        const ex = data.pt_extras[i];
                        htmlContent = `<div style="position: relative; width: 40px; height: 40px; margin: -10px -10px;">`;
                        
                        // Center dot
                        htmlContent += `<div style="position: absolute; top: 15px; left: 15px; width: 10px; height: 10px; background: ${ptColor}; border-radius: 50%; box-shadow: 0 0 2px black; border: 1px solid rgba(255,255,255,0.7); z-index: 10;"></div>`;
                        
                        // Top-left: Temperature (Red)
                        htmlContent += `<div style="position: absolute; top: -2px; left: -10px; width: 25px; text-align: right; color: #f87171; font-weight: bold; font-size: 0.8rem; text-shadow: 0 0 2px black, 0 0 3px black;">${ex.temp?.toFixed(1)}</div>`;
                        
                        // Bottom-left: Dew Point (Green/Blue)
                        if(ex.dewPoint) {
                            htmlContent += `<div style="position: absolute; top: 22px; left: -10px; width: 25px; text-align: right; color: #60a5fa; font-weight: bold; font-size: 0.8rem; text-shadow: 0 0 2px black, 0 0 3px black;">${ex.dewPoint?.toFixed(1)}</div>`;
                        }
                        
                        // Top-right: Gust / Wind
                        if(ex.wiatr_poryw_kmh && ex.wiatr_poryw_kmh > 0) {
                            htmlContent += `<div style="position: absolute; top: -2px; left: 25px; width: 25px; text-align: left; color: #fbbf24; font-weight: bold; font-size: 0.75rem; text-shadow: 0 0 2px black, 0 0 3px black;">${ex.wiatr_poryw_kmh?.toFixed(0)}</div>`;
                        }
                        
                        // Bottom-right: Humidity
                        if(!isNaN(ex.wilg)) {
                            htmlContent += `<div style="position: absolute; top: 22px; left: 25px; width: 25px; text-align: left; color: #9ca3af; font-size: 0.7rem; text-shadow: 0 0 2px black, 0 0 3px black;">${ex.wilg}%</div>`;
                        }
                        
                        // Wind Barb (Feathers)
                        if(!isNaN(ex.wiatr_kier) && ex.wiatr_sr_kmh > 0) {
                            const dir = ex.wiatr_kier + 180;
                            htmlContent += `<div style="position: absolute; top: 11px; left: 11px; width: 18px; height: 18px; transform: rotate(${dir}deg); transform-origin: center;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 0px 2px black);">
                                    <line x1="12" y1="24" x2="12" y2="4"></line>
                                    <line x1="12" y1="4" x2="18" y2="8"></line>
                                </svg>
                            </div>`;
                        }
                        
                        htmlContent += `</div>`;
                        
                    } else {
                        // Standard marker
                        if(showTxt) htmlContent += `<div style="color: white; text-shadow: 0 0 3px black, 0 0 3px black; font-weight: bold;">${data.pt_txts[i]}</div>`;
                        
                        const isWind = (zmienna === 'wiatr' || zmienna === 'wiatr_sr');
                        
                        if (isWind && data.pt_dirs && !isNaN(data.pt_dirs[i]) && data.pt_dirs[i] !== null) {
                            const dir = data.pt_dirs[i] + 180;
                            htmlContent += `<div style="width:18px; height:18px; margin:2px auto; transform: rotate(${dir}deg); color: ${ptColor}; text-shadow: 0 0 2px black;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 0px 1px black);">
                                    <line x1="12" y1="21" x2="12" y2="3"></line>
                                    <polyline points="5 10 12 3 19 10"></polyline>
                                </svg>
                            </div>`;
                        } else if(showPt) {
                            htmlContent += `<div style="width:10px;height:10px;background:${ptColor};border-radius:50%;margin:2px auto;box-shadow:0 0 2px black; border:1px solid rgba(255,255,255,0.7);"></div>`;
                        }
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
                const isoStepInput = document.getElementById('iso-step') ? document.getElementById('iso-step').value : 'auto';
                const stepVal = (isoStepInput !== 'auto') ? parseFloat(isoStepInput) : (zInfo.step || 2.0);
                const dataUrl = generateIDWImage(data.pt_lats, data.pt_lons, data.pt_vals, scale, cmin, cmax, showIso, stepVal, zInfo.unit);
                const bounds = [[48.5, 13.5], [55.5, 24.5]];
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

        window.addEventListener('bmeteo-authenticated', () => {
            setTimeout(() => {
                if (map) map.invalidateSize();
                window.renderIMGW();
            }, 250);
        });
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
