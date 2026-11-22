// history.js - trendy i ekstrema z historii IMGW zapisanej w Firebase RTDB (tylko portal meteo).
// Zrodlo: Firebase Realtime Database REST API, https://firebase.google.com/docs/reference/rest/database
// Snapshoty /imgw_historia zapisuje worker Cloudflare co 10 minut (retencja 12h).
// Wymaga window.BMapaApi (rejestrowane w mapa.js podczas initMapa).

(function () {
    const RTDB_HISTORY_URL = 'https://meteo-bbe28-default-rtdb.europe-west1.firebasedatabase.app/imgw_historia.json';
    const CACHE_TTL_MS = 60000;
    const MIN_TREND_HOURS = 0.16;

    let historyCache = null, historyCacheTime = 0;

    // Parsuje zarowno nowe znaczniki ISO z Z, jak i starsze wpisy bez strefy jako UTC
    function snapTime(snap) {
        const raw = String(snap?.czas || snap?.czas_pobrania || '').trim();
        if (!raw) return new Date(NaN);
        return new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw.replace(' ', 'T')}Z`);
    }

    function formatHm(dt) {
        if (!dt) return '';
        const hm = dt.toLocaleTimeString('pl-PL', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit' });
        const plH = parseInt(dt.toLocaleTimeString('pl-PL', { timeZone: 'Europe/Warsaw', hour: '2-digit' }), 10);
        const diff = (plH - dt.getUTCHours() + 24) % 24;
        return `${hm} ${diff === 2 ? 'CEST' : 'CET'}`;
    }

    function emptyResult() {
        return { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_meta: [] };
    }

    function isValValid(zmienna, val, stationName) {
        if (val == null || isNaN(val)) return false;
        return window.BMapaQC?.isValueInPhysicalRange ? window.BMapaQC.isValueInPhysicalRange(zmienna, val, stationName) : true;
    }

    function getStationVal(st, zmienna) {
        if (!st) return null;
        const map = { temp: st.temp ?? st.temperatura, grunt: st.temp_grunt ?? st.temperatura_gruntu, wilg: st.wilg ?? st.wilgotnosc, wiatr: st.wiatr_max ?? st.maks_poryw_kmh, wiatr_sr: st.wiatr_sr ?? st.wiatr_sr_kmh, cisnienie: st.cisnienie };
        const name = st.nazwa || window._stationMetaMap?.[String(st.kod)]?.nazwa || '';
        if (zmienna in map) {
            const val = map[zmienna];
            if (!isValValid(zmienna, val, name)) return null;
            if (zmienna === 'grunt' && window.BMapaQC?.isGroundTempConsistent && !window.BMapaQC.isGroundTempConsistent(val, st.temp ?? st.temperatura, 0, 0)) return null;
            return val;
        }
        if (zmienna === 'rosy') {
            const t = st.temp ?? st.temperatura, rh = st.wilg ?? st.wilgotnosc;
            if (!isValValid('temp', t, name) || !isValValid('wilg', rh, name)) return null;
            const dp = window.BMapaApi.calculateDewPoint(t, rh);
            return isValValid('rosy', dp, name) ? dp : null;
        }
        return null;
    }

    async function fetchFirebaseHistory() {
        const now = Date.now();
        if (historyCache && (now - historyCacheTime < CACHE_TTL_MS)) return historyCache;
        const token = window.getFirebaseToken ? await window.getFirebaseToken() : null;
        const res = await fetch(`${RTDB_HISTORY_URL}${token ? `?auth=${token}` : ''}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!data) return [];
        const list = Array.isArray(data) ? data : Object.values(data);
        historyCache = list.filter(s => s?.stacje && !isNaN(snapTime(s).getTime())).sort((a, b) => snapTime(a) - snapTime(b));
        historyCacheTime = now;
        return historyCache;
    }

    function findClosestSnapshot(snapshots, targetDt) {
        let best = null, minDiff = Infinity;
        for (let i = 0; i < snapshots.length - 1; i++) {
            const diff = Math.abs(snapTime(snapshots[i]) - targetDt);
            if (diff < minDiff) { minDiff = diff; best = snapshots[i]; }
        }
        return best;
    }

    function pushTrendPoint(result, ctx, ptData) {
        const { meta, vNow, vPast } = ptData;
        const delta = Math.round((vNow - vPast) * 10) / 10, rate = Math.round((delta / ctx.dtHours) * 10) / 10;
        const znak = rate > 0 ? '+' : '', dZnak = delta > 0 ? '+' : '';
        result.pt_lats.push(meta.lat); result.pt_lons.push(meta.lon); result.pt_vals.push(rate);
        result.pt_dirs.push(null); result.pt_txts.push(`${znak}${rate.toFixed(1)}`);
        result.pt_hov.push(`<b>${meta.nazwa}</b><br>Trend ${ctx.zi.nazwa}: <b>${znak}${rate.toFixed(1)} ${ctx.zi.unit}/h</b><br>Zmiana w ${ctx.dtHours.toFixed(1)}h: ${dZnak}${delta.toFixed(1)} ${ctx.zi.unit} (z ${vPast} o ${ctx.pTime} do ${vNow} o ${ctx.nTime})`);
        result.pt_meta.push({ id: meta.kod || meta.id || '', nazwa: meta.nazwa || '', czas: ctx.nTimeIso || '', zrodlo: 'IMGW', typ: 'TREND' });
    }

    // Tempo zmian na godzine miedzy najnowszym snapshotem a snapshotem sprzed N godzin
    function computeTrendData(snapshots, zmienna, okres) {
        if (snapshots.length < 2) {
            const firstTime = snapshots[0]?.czas ? snapshots[0].czas.slice(11, 16) : '--:--';
            return { error: `Oczekiwanie na kolejny pomiar historii (zapisano 1 snapshot o ${firstTime}). Cloudflare zapisuje dane co 10 minut.` };
        }
        const hoursBack = parseInt(okres.replace('trend', '').replace('h', ''), 10) || 1;
        const latestSnap = snapshots[snapshots.length - 1];
        const latestDt = snapTime(latestSnap);
        const pastSnap = findClosestSnapshot(snapshots, new Date(latestDt.getTime() - hoursBack * 3600000));
        if (!pastSnap) return { error: 'Brak wcześniejszego pomiaru w historii do obliczenia trendu.' };

        const pastDt = snapTime(pastSnap);
        const dtHours = (latestDt - pastDt) / 3600000;
        if (dtHours < MIN_TREND_HOURS) {
            return { error: `Zbyt mały odstęp czasu między pomiarami (${Math.round(dtHours * 60)} min). Wymagane min. 10 min.` };
        }

        const pastMap = new Map((pastSnap.stacje || []).map(s => [String(s.kod), s]));
        const zi = window.BMapaApi.DEFAULT_ZMIENNE[zmienna] || window.BMapaApi.DEFAULT_ZMIENNE['temp'];
        const ctx = { zi, dtHours, pTime: formatHm(pastDt), nTime: formatHm(latestDt), pTimeIso: pastDt.toISOString(), nTimeIso: latestDt.toISOString() };
        const result = emptyResult();
        result.horyzont = okres; result.typ_danych = 'TREND';
        result.czas_od_utc = pastDt.toISOString(); result.czas_do_utc = latestDt.toISOString(); result.latestTimeMs = latestDt.getTime();

        for (const st of (latestSnap.stacje || [])) {
            const kod = String(st.kod);
            const meta = window._stationMetaMap ? window._stationMetaMap[kod] : null;
            const vNow = getStationVal(st, zmienna);
            const vPast = getStationVal(pastMap.get(kod), zmienna);
            if (!meta || vNow === null || vPast === null) continue;
            pushTrendPoint(result, ctx, { meta, vNow, vPast });
        }
        window.BMapaQC?.filterSpatialOutliers?.(result, zmienna);
        return result;
    }

    function collectStationHistory(snapshots, zmienna) {
        const history = new Map();
        for (const snap of snapshots) {
            const sDt = snapTime(snap), sTime = formatHm(sDt), sIso = sDt.toISOString();
            for (const st of (snap.stacje || [])) {
                const val = getStationVal(st, zmienna);
                if (val === null) continue;
                const kod = String(st.kod);
                if (!history.has(kod)) history.set(kod, []);
                history.get(kod).push({ val, time: sTime, iso: sIso, dir: st.kierunek ?? st.wiatr_kierunek });
            }
        }
        return history;
    }

    // Minimum lub maksimum wartosci w wybranym oknie czasowym (6h lub 12h)
    function computeMinMaxData(snapshots, zmienna, okres) {
        if (!snapshots.length) return { error: 'Brak snapshotów w historii Firebase.' };
        const isMax = okres.startsWith('max'), hoursBack = parseInt(okres.replace(/\D/g, ''), 10) || 6;
        const zi = window.BMapaApi.DEFAULT_ZMIENNE[zmienna] || window.BMapaApi.DEFAULT_ZMIENNE['temp'];
        const latestDt = snapTime(snapshots[snapshots.length - 1]);
        const windowed = snapshots.filter(s => snapTime(s).getTime() >= latestDt.getTime() - hoursBack * 3600000 - 900000);
        const activeSnaps = windowed.length ? windowed : snapshots;
        const pastDt = snapTime(activeSnaps[0]), result = emptyResult();
        result.horyzont = okres; result.typ_danych = isMax ? 'MAKSIMUM' : 'MINIMUM';
        result.czas_od_utc = pastDt.toISOString(); result.czas_do_utc = latestDt.toISOString(); result.latestTimeMs = latestDt.getTime();

        collectStationHistory(activeSnaps, zmienna).forEach((entries, kod) => {
            const meta = window._stationMetaMap ? window._stationMetaMap[kod] : null;
            if (!meta || !entries.length) return;
            const best = entries.reduce((b, e) => (isMax ? e.val > b.val : e.val < b.val) ? e : b);
            result.pt_lats.push(meta.lat); result.pt_lons.push(meta.lon); result.pt_vals.push(best.val);
            result.pt_dirs.push(best.dir ?? null); result.pt_txts.push(`${best.val.toFixed(1)}`);
            result.pt_hov.push(`<b>${meta.nazwa}</b><br>${isMax ? 'Maksimum' : 'Minimum'} ${zi.nazwa}: <b>${best.val.toFixed(1)} ${zi.unit}</b> (${best.time})`);
            result.pt_meta.push({ id: kod, nazwa: meta.nazwa || '', czas: best.iso || latestDt.toISOString(), zrodlo: 'IMGW', typ: isMax ? 'MAKSIMUM' : 'MINIMUM' });
        });
        window.BMapaQC?.filterSpatialOutliers?.(result, zmienna);
        return result;
    }

    window.getIMGWHistoryData = async function (zmienna, okres) {
        if (!window._stationMetaMap || !Object.keys(window._stationMetaMap).length) await window.BMapaApi.getLiveData();
        const snapshots = await fetchFirebaseHistory();
        return okres.startsWith('trend') ? computeTrendData(snapshots, zmienna, okres) : computeMinMaxData(snapshots, zmienna, okres);
    };

    window.isHistoryDbEnabled = () => !!(window.firebaseUser && document.getElementById('chk-db-connect')?.checked);

    window.toggleDatabaseConnection = function (forcedState) {
        const chk = document.getElementById('chk-db-connect');
        if (!chk) return;
        if (typeof forcedState === 'boolean') chk.checked = forcedState;
        chk.setAttribute('data-user-set', 'true');
        const isEnabled = !!(window.firebaseUser && chk.checked);
        const badge = document.getElementById('rtdb-status-badge');
        if (badge) {
            badge.textContent = !window.firebaseUser ? 'Brak log.' : (isEnabled ? 'RTDB' : 'RTDB wył.');
            badge.style.color = isEnabled ? '#e5e5e5' : '#777777';
        }
        const okresSelect = document.getElementById('imgw-okres');
        if (!okresSelect) return;
        okresSelect.querySelectorAll('option').forEach(opt => {
            if (opt.value === 'now') return;
            opt.disabled = !isEnabled;
            opt.title = isEnabled ? '' : (window.firebaseUser ? 'Włącz przełącznik RTDB' : 'Wymaga logowania kontem Google');
        });
        if (!isEnabled && okresSelect.value !== 'now') {
            okresSelect.value = 'now';
            if (typeof window.renderIMGW === 'function') window.renderIMGW();
        }
    };
})();
