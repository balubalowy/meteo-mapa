// js/snow.js - Moduł analizy pokrywy śnieżnej IMGW-PIB
// Źródło biuletynu: https://res4.imgw.pl/products/hydro/monitor-lite-products/Pokrywa_sniezna.pdf

(function() {
    let _snowCache = null;
    let _snowCacheTime = 0;
    const CACHE_TTL = 3600000;

    const GATUNKI_SNIEGU = {
        1: 'puszysty, świeży', 2: 'krupiasty, sypki', 3: 'zsiadły lub przewiany', 4: 'zbity', 5: 'mokry (lepki)',
        6: 'powierzchnia zlodowaciała (szreń)', 7: 'powierzchnia zlodowaciała (lodoszreń)', 8: 'ziarnista', 9: 'warstwa szadzi > 2cm'
    };

    async function ensurePdfJs() {
        if (window.pdfjsLib) return;
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            s.onload = () => {
                if (window.pdfjsLib) {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                }
                resolve();
            };
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    async function extractTextFromPdf(pdfUrl) {
        await ensurePdfJs();
        const doc = await window.pdfjsLib.getDocument({
            url: pdfUrl,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true
        }).promise;

        let fullText = '';
        for (let p = 1; p <= doc.numPages; p++) {
            const page = await doc.getPage(p);
            const content = await page.getTextContent();
            fullText += content.items.map(item => item.str).join(' ') + '\n';
        }
        return fullText;
    }

    function assignSnowValue(state, val, hasDot) {
        if (state.gatunek === null && state.swiezy === null) {
            state.swiezy = val;
        } else if (hasDot && state.obciazenie === 0) {
            state.obciazenie = val;
        } else if (!hasDot && state.zapas === null) {
            state.zapas = val;
        }
    }

    function updateSnowState(state, token) {
        if (/^[1-9]$/.test(token) && state.gatunek === null) {
            state.gatunek = parseInt(token, 10);
            return;
        }
        if (/^[1-9]\d{2,}$/.test(token) && state.gatunek === null && state.zapas === null) {
            state.gatunek = parseInt(token[0], 10);
            state.zapas = parseFloat(token.substring(1)) || 0;
            return;
        }
        assignSnowValue(state, parseFloat(token) || 0, token.includes('.'));
    }

    function parseMiddleTokens(tokens) {
        const state = { grubosc: parseFloat(tokens[0]) || 0, swiezy: null, gatunek: null, zapas: null, obciazenie: 0 };
        for (let i = 1; i < tokens.length; i++) updateSnowState(state, tokens[i]);
        return state;
    }

    function extractStationChunk(lp, fullText) {
        const idx = fullText.indexOf(lp + '. ');
        if (idx === -1) return '';
        const nextIdx = fullText.indexOf((lp + 1) + '. ', idx);
        const raw = nextIdx !== -1 ? fullText.substring(idx, nextIdx) : fullText.substring(idx, idx + 400);
        return raw.replace(/(?:INSTYTUT\s+METEOROLOGII|sprawach\s+procesowych|Uwagi:|Objaśnienia:).*$/i, '').trim();
    }

    function parseStationChunk(cleanChunk) {
        const numsMatch = cleanChunk.match(/(?:[a-zA-Z\u0080-\uFFFF]|\))\s+([\d\.\s]+)$/i);
        if (!numsMatch) return { grubosc: 0, swiezy: null, gatunek: null, zapas: null, obciazenie: 0 };
        const cleanNums = numsMatch[1].replace(/(\b\d)\s+(\d{3}\b)/g, '$1$2').trim();
        const tokens = cleanNums.split(/\s+/).slice(1, -1);
        return tokens.length > 0 ? parseMiddleTokens(tokens) : { grubosc: 0, swiezy: null, gatunek: null, zapas: null, obciazenie: 0 };
    }

    function parseSingleSnowStation(meta, fullText, reportDate) {
        const chunk = extractStationChunk(meta.lp, fullText);
        if (!chunk) return null;
        const parsed = parseStationChunk(chunk);
        const norma = meta.norma || 1.0;
        const procNormy = norma > 0 ? Math.round((parsed.obciazenie / norma) * 100) : 0;
        const gatunekOpis = parsed.gatunek ? (GATUNKI_SNIEGU[parsed.gatunek] || 'określony') : 'brak';

        return { ...meta, ...parsed, gatunek_kod: parsed.gatunek, gatunek_opis: gatunekOpis, procent_normy: procNormy, data: reportDate };
    }

    function parseSnowRecords(fullText, stationsMeta) {
        const mDate = fullText.match(/(\d{2}\.\d{2}\.\d{4})/);
        const reportDate = mDate ? mDate[1] : '';
        return stationsMeta.map(meta => parseSingleSnowStation(meta, fullText, reportDate)).filter(Boolean);
    }

    async function fetchPdfSnowRecords(stationsMeta) {
        try {
            const pdfPromise = extractTextFromPdf('https://res4.imgw.pl/products/hydro/monitor-lite-products/Pokrywa_sniezna.pdf');
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500));
            const pdfText = await Promise.race([pdfPromise, timeoutPromise]);
            if (pdfText && pdfText.length > 500 && stationsMeta.length > 0) {
                return parseSnowRecords(pdfText, stationsMeta);
            }
        } catch (_) {}
        return [];
    }

    async function fetchFallbackSnowRecords() {
        return fetch('dane/snow_latest.json')
            .then(r => r.ok ? r.json() : { stacje: [] })
            .then(d => d.stacje || [])
            .catch(() => []);
    }

    async function fetchSnowRecords() {
        const now = Date.now();
        if (_snowCache && (now - _snowCacheTime < CACHE_TTL)) return _snowCache;

        const stationsMeta = await fetch('dane/snow_stations.json').then(r => r.ok ? r.json() : []).catch(() => []);
        let records = await fetchPdfSnowRecords(stationsMeta);
        if (!records.length) records = await fetchFallbackSnowRecords();

        if (records?.length > 0) {
            _snowCache = records;
            _snowCacheTime = now;
        }
        return records;
    }

    function parseReportTime(dateStr) {
        if (!dateStr) return { timeMs: 0, isoDate: '' };
        const parts = dateStr.split('.');
        if (parts.length !== 3) return { timeMs: 0, isoDate: '' };
        const timeMs = Date.UTC(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10), 6, 0, 0);
        return { timeMs, isoDate: new Date(timeMs).toISOString().replace('.000Z', 'Z') };
    }

    function createSnowTooltip(r, nazwa, dateStr, swiezyVal) {
        const alt = r.alt || '-';
        const zapasTxt = r.zapas != null ? `${r.zapas} mm` : 'brak';
        const obcTxt = (r.obciazenie || 0).toFixed(3);
        const normaTxt = `${r.norma || '-'} kN/m² (${r.procent_normy || 0}% normy)`;
        return `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;"><b style="font-size:0.85rem;">${nazwa}</b> [${r.woj || ''}, ${alt} m n.p.m.]<span class="badge-odczyt">ODCZYT</span></div>Pokrywa śnieżna: <b>${(r.grubosc || 0).toFixed(0)} cm</b>${dateStr}<br>Świeży śnieg: <b>${swiezyVal.toFixed(0)} cm</b><br>Gatunek śniegu: <b>${r.gatunek_opis || '-'}</b><br>Zapas wody: <b>${zapasTxt}</b><br>Obciążenie: <b>${obcTxt} kN/m²</b><br>Norma: <b>${normaTxt}</b>`;
    }

    function appendSnowStationData(r, dataObj) {
        const lat = r.lat, lon = r.lon, nazwa = r.name, grubosc = r.grubosc || 0;
        const zapas = r.zapas, obciazenie = r.obciazenie || 0, proc = r.procent_normy || 0;
        const dateStr = r.data ? ` (${r.data})` : '';
        const { timeMs, isoDate } = parseReportTime(r.data);

        if (timeMs > dataObj.snieg.latestTimeMs) {
            dataObj.snieg.latestTimeMs = timeMs;
            dataObj.snieg_swiezy.latestTimeMs = timeMs;
        }

        const swiezyVal = (r.swiezy != null && !isNaN(r.swiezy)) ? r.swiezy : 0;
        const metaItem = { id: String(r.kod || r.id || ''), nazwa, zrodlo: 'SNIEG', czas: isoDate };
        const hov = createSnowTooltip(r, nazwa, dateStr, swiezyVal);

        const addPt = (p, val, txt) => {
            dataObj[p].pt_lats.push(lat); dataObj[p].pt_lons.push(lon); dataObj[p].pt_vals.push(val);
            dataObj[p].pt_dirs.push(null); dataObj[p].pt_txts.push(txt); dataObj[p].pt_hov.push(hov);
            dataObj[p].pt_foreign.push(false); dataObj[p].pt_types.push('ODCZYT'); dataObj[p].pt_meta.push(metaItem);
        };

        addPt('snieg', grubosc, `${grubosc.toFixed(0)}cm`);
        addPt('snieg_swiezy', swiezyVal, `${swiezyVal.toFixed(0)}cm`);
        if (zapas != null) addPt('snieg_zapas', zapas, `${zapas}mm`);
        addPt('snieg_obciazenie', obciazenie, obciazenie.toFixed(2));
        addPt('snieg_norma', proc, `${proc}%`);
    }

    window.getSnowData = async function() {
        const records = await fetchSnowRecords();
        const makeP = () => ({ pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [], pt_meta: [], latestTimeMs: 0 });
        const dataObj = { snieg: makeP(), snieg_swiezy: makeP(), snieg_zapas: makeP(), snieg_obciazenie: makeP(), snieg_norma: makeP() };
        records.forEach(r => appendSnowStationData(r, dataObj));
        return dataObj;
    };
})();
