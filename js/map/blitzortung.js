// js/map/blitzortung.js
// Odbiór i wizualizacja wyładowań atmosferycznych w czasie rzeczywistym z Blitzortung Live WebSocket

let activeStrikes = [];
let boSocket = null;
let boReconnectTimer = null;
let boRefreshInterval = null;
let lightningLayerGroup = null;

// Dekoder LZW strumienia danych sieci Blitzortung
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
    }
    if (ageMinutes < 15) {
        return { radius: 4.5, color: '#eab308', fillColor: '#fde047', fillOpacity: 0.9, weight: 1.5 };
    }
    if (ageMinutes < 30) {
        return { radius: 4, color: '#f97316', fillColor: '#fb923c', fillOpacity: 0.85, weight: 1 };
    }
    if (ageMinutes < 60) {
        return { radius: 3.5, color: '#ef4444', fillColor: '#f87171', fillOpacity: 0.75, weight: 1 };
    }
    return { radius: 3, color: '#7f1d1d', fillColor: '#991b1b', fillOpacity: 0.6, weight: 0.8 };
}

function updateStrikeCounterUI() {
    const countEl = document.getElementById('bo-strike-count');
    if (countEl) {
        countEl.textContent = activeStrikes.length > 0 ? `(${activeStrikes.length})` : '';
    }
}

function refreshStrikeStyles() {
    const now = Date.now();
    activeStrikes = activeStrikes.filter(s => {
        const ageMin = (now - s.time) / 60000;
        if (ageMin >= 120) {
            if (s.marker && lightningLayerGroup) lightningLayerGroup.removeLayer(s.marker);
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

function addStrikePoint(strike) {
    if (!lightningLayerGroup) return;
    const now = Date.now();
    const strikeTime = strike.time ? (strike.time > 1e15 ? Math.floor(strike.time / 1000000) : strike.time) : now;
    const ageMin = Math.max(0, (now - strikeTime) / 60000);

    const st = getStrikeStyle(ageMin);
    const marker = L.circleMarker([strike.lat, strike.lon], { ...st, pane: 'lightningPane' });

    const timeStr = new Date(strikeTime).toLocaleTimeString('pl-PL');
    marker.bindTooltip(`Wyładowanie: ${timeStr}<br>Pozycja: ${strike.lat.toFixed(3)}°N, ${strike.lon.toFixed(3)}°E`, { sticky: true });

    marker.addTo(lightningLayerGroup);
    activeStrikes.push({ lat: strike.lat, lon: strike.lon, time: strikeTime, marker });

    if (activeStrikes.length > 1500) {
        const oldest = activeStrikes.shift();
        if (oldest?.marker) lightningLayerGroup.removeLayer(oldest.marker);
    }
    updateStrikeCounterUI();
}

export function initBlitzortungWS() {
    if (boSocket) {
        try { boSocket.close(); } catch (_) {}
        boSocket = null;
    }
    if (boReconnectTimer) clearTimeout(boReconnectTimer);

    const hosts = ['wss://ws1.blitzortung.org/', 'wss://ws7.blitzortung.org/', 'wss://ws8.blitzortung.org/'];
    const host = hosts[Math.floor(Math.random() * hosts.length)];

    try {
        boSocket = new WebSocket(host);
        boSocket.onopen = () => boSocket.send(JSON.stringify({ a: 111 }));
        boSocket.onmessage = (event) => {
            try {
                const decoded = decodeBlitzortung(event.data);
                const strike = JSON.parse(decoded);
                if (strike?.lat && strike?.lon) {
                    // Filtr geograficzny: Europa Środkowa
                    if (strike.lat >= 35 && strike.lat <= 65 && strike.lon >= -15 && strike.lon <= 35) {
                        addStrikePoint(strike);
                    }
                }
            } catch (_) {}
        };
        boSocket.onerror = () => {
            if (window.MAP_LAYERS?.lightning?.visible) {
                boReconnectTimer = setTimeout(initBlitzortungWS, 4000);
            }
        };
        boSocket.onclose = () => {
            if (window.MAP_LAYERS?.lightning?.visible) {
                boReconnectTimer = setTimeout(initBlitzortungWS, 3000);
            }
        };
    } catch (err) {
        console.error("Blitzortung połączenie błąd:", err);
    }
}

export function initLightning(map) {
    lightningLayerGroup = L.layerGroup([], { pane: 'lightningPane' });
    initBlitzortungWS();
    if (boRefreshInterval) clearInterval(boRefreshInterval);
    boRefreshInterval = setInterval(refreshStrikeStyles, 10000);
    return lightningLayerGroup;
}
