// js/map/cities.js
// Wielopoziomowa nakladka etykiet miejscowosci z detekcja kolizji AABB (omijanie stacji i wartosci pomiarowych)
// Zrodlo bazy miejscowosci: GeoNames (CC BY 4.0, download.geonames.org)

const ZOOM_TIERS = [
    { maxZoom: 5, maxTier: 1, pad: 18, maxLabels: 18 },
    { maxZoom: 6, maxTier: 1, pad: 14, maxLabels: 26 },
    { maxZoom: 7, maxTier: 2, pad: 13, maxLabels: 44 },
    { maxZoom: 8, maxTier: 3, pad: 12, maxLabels: 62 },
    { maxZoom: 9, maxTier: 4, pad: 12, maxLabels: 78 },
    { maxZoom: 10, maxTier: 4, pad: 10, maxLabels: 95 },
    { maxZoom: 99, maxTier: 5, pad: 9, maxLabels: 120 }
];

const TIER_FONTS = {
    1: { font: '600 11.5px Inter, system-ui, sans-serif', h: 15, cls: 't1' },
    2: { font: '500 10.5px Inter, system-ui, sans-serif', h: 14, cls: 't2' },
    3: { font: '400 9.5px Inter, system-ui, sans-serif', h: 13, cls: 't3' }
};

let measureCtx = null;
const widthCache = new Map();

function getTierSpec(tier) {
    return TIER_FONTS[tier <= 1 ? 1 : (tier === 2 ? 2 : 3)];
}

function measureLabelWidth(name, tier) {
    const spec = getTierSpec(tier);
    const key = `${spec.cls}:${name}`;
    if (widthCache.has(key)) return widthCache.get(key);
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    measureCtx.font = spec.font;
    const w = Math.ceil(measureCtx.measureText(name).width) + 6;
    widthCache.set(key, w);
    return w;
}

function boxesOverlap(a, b, pad) {
    return !(a[2] + pad <= b[0] || a[0] >= b[2] + pad || a[3] + pad <= b[1] || a[1] >= b[3] + pad);
}

// Zbiera prostokaty ochronne (px) aktualnie wyswietlanych kropek i wartosci stacji w widocznym oknie mapy
function collectStationBoxes(map) {
    const showTxt = document.getElementById('chk-txt')?.checked ?? true;
    const showPt = document.getElementById('chk-pt')?.checked ?? true;
    const data = window.currentRenderedData;
    if ((!showTxt && !showPt) || !data?.pt_lats?.length) return [];

    const showForeign = document.getElementById('chk-foreign')?.checked ?? false;
    const isPill = window.getValueStyle?.() === 'pill';
    const zm = window.currentRenderedParam || 'temp';
    const isWind = (zm === 'wiatr' || zm === 'wiatr_sr') && showPt;
    const sz = map.getSize(), boxes = [];

    for (let i = 0; i < data.pt_lats.length; i++) {
        if (data.pt_foreign?.[i] && !showForeign) continue;
        const p = map.latLngToContainerPoint([data.pt_lats[i], data.pt_lons[i]]);
        if (p.x < -40 || p.x > sz.x + 40 || p.y < -40 || p.y > sz.y + 40) continue;

        const txtLen = showTxt ? String(data.pt_txts?.[i] ?? '').length : 0;
        const halfW = showTxt ? Math.max(13, Math.ceil(txtLen * 3.4) + (isPill ? 7 : 3)) : 7;
        const top = showTxt ? p.y - (isPill ? 15 : 13) : p.y - (isWind ? 11 : 7);
        const bot = showPt ? p.y + (isWind ? 19 : 13) : p.y + (isPill ? 4 : 1);
        boxes.push([p.x - halfW, top, p.x + halfW, bot]);
    }
    return boxes;
}

function hasNearbyStation(px, py, stationBoxes) {
    for (let i = 0; i < stationBoxes.length; i++) {
        const b = stationBoxes[i];
        const cx = (b[0] + b[2]) * 0.5, cy = (b[1] + b[3]) * 0.5;
        if (Math.abs(px - cx) < 22 && Math.abs(py - cy) < 18) return true;
    }
    return false;
}

function isBoxFree(box, occupied, stationCount, cityPad) {
    for (let i = 0; i < occupied.length; i++) {
        if (boxesOverlap(box, occupied[i], i < stationCount ? 2 : cityPad)) return false;
    }
    return true;
}

// Testuje pozycje kotwiczenia etykiety wokol punktu miasta, aby ominac stacje oraz wazniejsze miasta
function findFreePlacement(px, py, w, h, occupied, stationCount, cityPad, nearStation, allowSpiral) {
    const candidates = nearStation
        ? [
            [px - w * 0.5, py - h - 14], [px - w * 0.5, py + 14],
            [px + 16, py - h * 0.5], [px - w - 16, py - h * 0.5],
            [px + 13, py - h - 11], [px + 13, py + 12],
            [px - w - 13, py - h - 11], [px - w - 13, py + 12]
        ]
        : [
            [px + 6, py - h * 0.5], [px - w * 0.5, py - h - 5],
            [px - w * 0.5, py + 6], [px - w - 6, py - h * 0.5],
            [px + 5, py - h - 4], [px + 5, py + 5]
        ];

    for (const [x, y] of candidates) {
        const box = [x, y, x + w, y + h];
        if (isBoxFree(box, occupied, stationCount, cityPad)) return { x, y, box };
    }
    if (!allowSpiral) return null;

    // Dla miast wojewodzkich na malym zoomie przeszukuje waski pierscien wokol punktu miasta
    for (let r = 18; r <= 32; r += 5) {
        for (let a = 0; a < 12; a++) {
            const ang = (a * Math.PI) / 6;
            const x = px + Math.cos(ang) * r - w * 0.5;
            const y = py + Math.sin(ang) * r - h * 0.5;
            const box = [x, y, x + w, y + h];
            if (isBoxFree(box, occupied, stationCount, cityPad)) return { x, y, box };
        }
    }
    return null;
}

function buildPlacedMarker(map, city, spec, placement, showDot, isLight) {
    const [name, lat, lon] = city;
    const p = map.latLngToContainerPoint([lat, lon]);
    const dx = Math.round(placement.x - p.x);
    const dy = Math.round(placement.y - p.y);
    const themeCls = isLight ? 'city-lbl-light' : 'city-lbl-dark';
    const dotHtml = showDot ? `<span class="city-dot city-dot-${spec.cls} ${themeCls}"></span>` : '';
    const html = `${dotHtml}<span class="city-lbl city-lbl-${spec.cls} ${themeCls}" style="left:${dx}px;top:${dy}px;">${name}</span>`;
    const icon = L.divIcon({ className: 'custom-city-label', html, iconSize: [0, 0], iconAnchor: [0, 0] });
    return L.marker([lat, lon], { icon, interactive: false, pane: 'labelsPane' });
}

export function createCityLabelsGroup(map) {
    const group = L.layerGroup();
    let citiesData = [], isLightTheme = false, rafId = 0;

    function renderVisibleCities() {
        rafId = 0;
        if (!citiesData.length) return;
        group.clearLayers();
        if (!(document.getElementById('chk-cities')?.checked ?? true)) return;

        const z = map.getZoom(), sz = map.getSize();
        const zCfg = ZOOM_TIERS.find(t => z <= t.maxZoom) || ZOOM_TIERS[ZOOM_TIERS.length - 1];
        const stationBoxes = collectStationBoxes(map);
        const occupied = [...stationBoxes];
        const stationCount = stationBoxes.length;
        let placed = 0;

        for (let i = 0; i < citiesData.length && placed < zCfg.maxLabels; i++) {
            const city = citiesData[i];
            const [name, lat, lon, tier, isForeign] = city;
            if (tier > zCfg.maxTier) break;
            if (isForeign && tier > 1 && z < 7) continue;

            const p = map.latLngToContainerPoint([lat, lon]);
            if (p.x < 12 || p.x > sz.x - 12 || p.y < 12 || p.y > sz.y - 12) continue;

            const spec = getTierSpec(tier);
            const w = measureLabelWidth(name, tier);
            const nearStation = hasNearbyStation(p.x, p.y, stationBoxes);
            const pos = findFreePlacement(p.x, p.y, w, spec.h, occupied, stationCount, zCfg.pad, nearStation, tier === 1 && z <= 7);
            if (!pos) continue;

            occupied.push(pos.box);
            buildPlacedMarker(map, city, spec, pos, !nearStation, isLightTheme).addTo(group);
            placed++;
        }
    }

    function scheduleRender() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(renderVisibleCities);
    }

    function updateCityLabels(isLight) {
        isLightTheme = Boolean(isLight);
        scheduleRender();
    }

    fetch('assets/geo/cities_pl.json')
        .then(r => r.ok ? r.json() : [])
        .then(data => { citiesData = Array.isArray(data) ? data : []; scheduleRender(); })
        .catch(err => console.error('Błąd ładowania miast:', err));

    map.on('moveend zoomend resize', scheduleRender);
    group.addTo(map);
    window.refreshCityLabels = scheduleRender;
    return { group, updateCityLabels, refresh: scheduleRender };
}
