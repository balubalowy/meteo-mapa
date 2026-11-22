// js/map/cities.js
// Wielopoziomowa nakladka etykiet miejscowosci (nad interpolacja) + szczegolowa warstwa referencyjna Esri przy duzym przyblizeniu

const CITIES_TIER_1 = [
    { name: 'Warszawa', lat: 52.2297, lon: 21.0122 },
    { name: 'Kraków', lat: 50.0647, lon: 19.9450 },
    { name: 'Łódź', lat: 51.7592, lon: 19.4560 },
    { name: 'Wrocław', lat: 51.1079, lon: 17.0385 },
    { name: 'Poznań', lat: 52.4064, lon: 16.9252 },
    { name: 'Gdańsk', lat: 54.3520, lon: 18.6466 },
    { name: 'Szczecin', lat: 53.4285, lon: 14.5528 },
    { name: 'Bydgoszcz', lat: 53.1235, lon: 18.0084 },
    { name: 'Lublin', lat: 51.2465, lon: 22.5684 },
    { name: 'Białystok', lat: 53.1325, lon: 23.1688 },
    { name: 'Katowice', lat: 50.2649, lon: 19.0238 },
    { name: 'Rzeszów', lat: 50.0412, lon: 21.9991 },
    { name: 'Olsztyn', lat: 53.7799, lon: 20.4942 },
    { name: 'Kielce', lat: 50.8661, lon: 20.6286 },
    { name: 'Opole', lat: 50.6711, lon: 17.9253 },
    { name: 'Zielona Góra', lat: 51.9355, lon: 15.5062 },
    { name: 'Toruń', lat: 53.0137, lon: 18.5984 },
    { name: 'Gorzów Wlkp.', lat: 52.7368, lon: 15.2288 }
];

const CITIES_TIER_2 = [
    { name: 'Gdynia', lat: 54.5189, lon: 18.5305 },
    { name: 'Częstochowa', lat: 50.8118, lon: 19.1203 },
    { name: 'Radom', lat: 51.4027, lon: 21.1471 },
    { name: 'Bielsko-Biała', lat: 49.8224, lon: 19.0584 },
    { name: 'Płock', lat: 52.5463, lon: 19.7065 },
    { name: 'Kalisz', lat: 51.7673, lon: 18.0853 },
    { name: 'Koszalin', lat: 54.1944, lon: 16.1715 },
    { name: 'Słupsk', lat: 54.4641, lon: 17.0285 },
    { name: 'Elbląg', lat: 54.1561, lon: 19.4045 },
    { name: 'Wałbrzych', lat: 50.7714, lon: 16.2843 },
    { name: 'Legnica', lat: 51.2070, lon: 16.1553 },
    { name: 'Jelenia Góra', lat: 50.9044, lon: 15.7194 },
    { name: 'Kłodzko', lat: 50.4349, lon: 16.6526 },
    { name: 'Włocławek', lat: 52.6483, lon: 19.0677 },
    { name: 'Tarnów', lat: 50.0121, lon: 20.9858 },
    { name: 'Nowy Sącz', lat: 49.6250, lon: 20.6970 },
    { name: 'Zakopane', lat: 49.2992, lon: 19.9496 },
    { name: 'Nowy Targ', lat: 49.4778, lon: 20.0323 },
    { name: 'Przemyśl', lat: 49.7839, lon: 22.7678 },
    { name: 'Krosno', lat: 49.6887, lon: 21.7706 },
    { name: 'Sanok', lat: 49.5557, lon: 22.2056 },
    { name: 'Ustrzyki Dolne', lat: 49.4293, lon: 22.5934 },
    { name: 'Zamość', lat: 50.7231, lon: 23.2520 },
    { name: 'Chełm', lat: 51.1431, lon: 23.4712 },
    { name: 'Biała Podlaska', lat: 52.0324, lon: 23.1165 },
    { name: 'Siedlce', lat: 52.1676, lon: 22.2902 },
    { name: 'Ostrołęka', lat: 53.0844, lon: 21.5754 },
    { name: 'Łomża', lat: 53.1781, lon: 22.0590 },
    { name: 'Suwałki', lat: 54.1115, lon: 22.9308 },
    { name: 'Ełk', lat: 53.8281, lon: 22.3647 },
    { name: 'Giżycko', lat: 54.0381, lon: 21.7644 },
    { name: 'Grudziądz', lat: 53.4837, lon: 18.7536 },
    { name: 'Piła', lat: 53.1511, lon: 16.7380 },
    { name: 'Konin', lat: 52.2230, lon: 18.2512 },
    { name: 'Leszno', lat: 51.8419, lon: 16.5749 },
    { name: 'Głogów', lat: 51.6636, lon: 16.0845 },
    { name: 'Rybnik', lat: 50.1022, lon: 18.5463 },
    { name: 'Piotrków Tryb.', lat: 51.4052, lon: 19.7030 },
    { name: 'Sandomierz', lat: 50.6822, lon: 21.7490 },
    { name: 'Stalowa Wola', lat: 50.5826, lon: 22.0536 },
    { name: 'Kołobrzeg', lat: 54.1759, lon: 15.5833 },
    { name: 'Świnoujście', lat: 53.9105, lon: 14.2471 },
    { name: 'Ustka', lat: 54.5805, lon: 16.8619 },
    { name: 'Hel', lat: 54.6081, lon: 18.8013 },
    { name: 'Cieszyn', lat: 49.7489, lon: 18.6332 },
    { name: 'Żywiec', lat: 49.6853, lon: 19.1924 },
    { name: 'Karpacz', lat: 50.7773, lon: 15.7582 },
    { name: 'Ostrawa', lat: 49.8209, lon: 18.2625 },
    { name: 'Praga', lat: 50.0755, lon: 14.4378 },
    { name: 'Berlin', lat: 52.5200, lon: 13.4050 },
    { name: 'Drezno', lat: 51.0504, lon: 13.7373 },
    { name: 'Wilno', lat: 54.6872, lon: 25.2797 },
    { name: 'Lwów', lat: 49.8397, lon: 24.0297 },
    { name: 'Poprad', lat: 49.0614, lon: 20.2979 }
];

function buildCityMarker(city, tier, isLight) {
    const cls = `city-lbl city-lbl-t${tier} ${isLight ? 'city-lbl-light' : 'city-lbl-dark'}`;
    const html = `<span class="${cls}"><span class="city-dot"></span><span class="city-name">${city.name}</span></span>`;
    const icon = L.divIcon({ className: 'custom-city-label', html, iconSize: [0, 0], iconAnchor: [0, 0] });
    return L.marker([city.lat, city.lon], { icon, interactive: false, pane: 'labelsPane' });
}

// Tworzy sterownik etykiet: polskie miasta wektorowe (zoom <= 9) i kafelki referencyjne Esri (zoom >= 10)
export function createCityLabelsGroup(map) {
    const group = L.layerGroup();
    const tier1Group = L.layerGroup();
    const tier2Group = L.layerGroup();
    // Zrodlo kafelkow referencyjnych: Esri ArcGIS Online (World Dark/Light Gray Reference)
    const refDark = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        minZoom: 10, maxNativeZoom: 16, maxZoom: 19, pane: 'labelsPane', className: 'esri-ref-labels-dark', attribution: 'Esri'
    });
    const refLight = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        minZoom: 10, maxNativeZoom: 16, maxZoom: 19, pane: 'labelsPane', className: 'esri-ref-labels-light', attribution: 'Esri'
    });

    let isLightTheme = false;

    function rebuildMarkers() {
        tier1Group.clearLayers();
        tier2Group.clearLayers();
        CITIES_TIER_1.forEach(c => buildCityMarker(c, 1, isLightTheme).addTo(tier1Group));
        CITIES_TIER_2.forEach(c => buildCityMarker(c, 2, isLightTheme).addTo(tier2Group));
    }

    function syncZoomLayers() {
        const z = map.getZoom();
        group.clearLayers();
        if (z < 10) {
            tier1Group.addTo(group);
            if (z >= 7) tier2Group.addTo(group);
        } else {
            (isLightTheme ? refLight : refDark).addTo(group);
        }
    }

    function updateCityLabels(isLight) {
        isLightTheme = Boolean(isLight);
        rebuildMarkers();
        syncZoomLayers();
    }

    map.on('zoomend', syncZoomLayers);
    updateCityLabels(false);
    group.addTo(map);
    return { group, updateCityLabels };
}
