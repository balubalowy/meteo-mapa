// Moduł analizy pokrywy śnieżnej IMGW-PIB
// Źródło biuletynu: https://res4.imgw.pl/products/hydro/monitor-lite-products/Pokrywa_sniezna.pdf

(function() {
    let _snowCache = null;
    let _snowCacheTime = 0;
    const CACHE_TTL = 3600000; // 1 godzina cache

    const GATUNKI_SNIEGU = {
        1: 'puszysty, świeży', 2: 'krupiasty, sypki', 3: 'zsiadły lub przewiany', 4: 'zbity', 5: 'mokry (lepki)',
        6: 'powierzchnia zlodowaciała (szreń)', 7: 'powierzchnia zlodowaciała (lodoszreń)', 8: 'ziarnista', 9: 'warstwa szadzi > 2cm'
    };

    async function ensurePdfJs() {
        if (window.pdfjsLib) return;
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            s.onload = () => { if (window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; resolve(); };
            s.onerror = reject; document.head.appendChild(s);
        });
    }

    async function extractTextFromPdf(pdfUrl) {
        await ensurePdfJs();
        const doc = await window.pdfjsLib.getDocument({ url: pdfUrl, cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/', cMapPacked: true }).promise;
        let fullText = '';
        for (let p = 1; p <= doc.numPages; p++) {
            const page = await doc.getPage(p), content = await page.getTextContent();
            fullText += content.items.map(item => item.str).join(' ') + '\n';
        }
        return fullText;
    }

    function parseSnowRecords(fullText, stationsMeta) {
        const recordsMap = new Map();
        const mDate = fullText.match(/(\d{2}\.\d{2}\.\d{4})/);
        const reportDate = mDate ? mDate[1] : '';

        stationsMeta.forEach(meta => {
            const lp = meta.lp, searchKey = lp + '. ';
            const idx = fullText.indexOf(searchKey);
            if (idx === -1) return;
            const nextKey = (lp + 1) + '. ', nextIdx = fullText.indexOf(nextKey, idx);
            const chunk = nextIdx !== -1 ? fullText.substring(idx, nextIdx) : fullText.substring(idx, idx + 400);

            const cleanChunk = chunk.replace(/(?:INSTYTUT\s+METEOROLOGII|sprawach\s+procesowych|Uwagi:|Objaśnienia:).*$/i, '').trim();
            const numsMatch = cleanChunk.match(new RegExp('(?:[a-zA-Z\\u0080-\\uFFFF]|\\))\\s+([\\d\\.\\s]+)$', 'i'));
            let grubosc = 0, swiezy = null, gatunek = null, zapas = null, obciazenie = 0;

            if (numsMatch) {
                const cleanNums = numsMatch[1].replace(/(\b\d)\s+(\d{3}\b)/g, '$1$2').trim();
                const numTokens = cleanNums.split(/\s+/), middle = numTokens.slice(1, -1);
                if (middle.length > 0) {
                    grubosc = parseFloat(middle[0]) || 0;
                    for (let i = 1; i < middle.length; i++) {
                        const t = middle[i];
                        if (t.length === 1 && t >= '1' && t <= '9' && gatunek === null) {
                            gatunek = parseInt(t, 10);
                        } else if (t.length >= 3 && t[0] >= '1' && t[0] <= '9' && gatunek === null && zapas === null && t.indexOf('.') === -1) {
                            gatunek = parseInt(t[0], 10); zapas = parseFloat(t.substring(1)) || 0;
                        } else if (t.indexOf('.') !== -1 && obciazenie === 0) {
                            if (gatunek === null && swiezy === null) swiezy = parseFloat(t) || 0;
                            else obciazenie = parseFloat(t) || 0;
                        } else if (t.indexOf('.') === -1 && zapas === null) {
                            if (gatunek === null && swiezy === null) swiezy = parseFloat(t) || 0;
                            else zapas = parseFloat(t) || 0;
                        }
                    }
                }
            }

            const norma = meta.norma || 1.0;
            const procNormy = norma > 0 ? Math.round((obciazenie / norma) * 100) : 0;
            recordsMap.set(lp, { ...meta, grubosc, swiezy, gatunek_kod: gatunek, gatunek_opis: gatunek ? (GATUNKI_SNIEGU[gatunek] || 'określony') : 'brak', zapas, obciazenie, procent_normy: procNormy, data: reportDate });
        });
        return Array.from(recordsMap.values());
    }

    async function fetchSnowRecords() {
        const now = Date.now();
        if (_snowCache && (now - _snowCacheTime < CACHE_TTL)) return _snowCache;
        let stationsMeta = await fetch('dane/snow_stations.json').then(r => r.ok ? r.json() : []).catch(() => []);
        let records = [];
        try {
            const pdfPromise = extractTextFromPdf('https://res4.imgw.pl/products/hydro/monitor-lite-products/Pokrywa_sniezna.pdf');
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500));
            const pdfText = await Promise.race([pdfPromise, timeoutPromise]);
            if (pdfText && pdfText.length > 500 && stationsMeta.length > 0) records = parseSnowRecords(pdfText, stationsMeta);
        } catch (_) {}
        if (!records.length) {
            records = await fetch('dane/snow_latest.json').then(r => r.ok ? r.json() : { stacje: [] }).then(d => d.stacje || []).catch(() => []);
        }
        if (records?.length > 0) { _snowCache = records; _snowCacheTime = now; }
        return records;
    }

    window.getSnowData = async function() {
        const records = await fetchSnowRecords();
        const makeP = () => ({ pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [], pt_meta: [], latestTimeMs: 0 });
        const dataObj = { snieg: makeP(), snieg_swiezy: makeP(), snieg_zapas: makeP(), snieg_obciazenie: makeP(), snieg_norma: makeP() };

        records.forEach(r => {
            const lat = r.lat, lon = r.lon, nazwa = r.name, grubosc = r.grubosc || 0, zapas = r.zapas, obciazenie = r.obciazenie || 0, proc = r.procent_normy || 0;
            const dateStr = r.data ? ` (${r.data})` : '';
            let isoDate = '';
            if (r.data) {
                const parts = r.data.split('.');
                if (parts.length === 3) {
                    const timeMs = Date.UTC(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10), 6, 0, 0);
                    if (timeMs > dataObj['snieg'].latestTimeMs) { dataObj['snieg'].latestTimeMs = timeMs; dataObj['snieg_swiezy'].latestTimeMs = timeMs; }
                    isoDate = new Date(timeMs).toISOString().replace('.000Z', 'Z');
                }
            }

            const swiezyVal = (r.swiezy != null && !isNaN(r.swiezy)) ? r.swiezy : 0;
            const metaItem = { id: String(r.kod || r.id || ''), nazwa, zrodlo: 'SNIEG', czas: isoDate };
            const snowTooltip = `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;"><b style="font-size:0.85rem;">${nazwa}</b> [${r.woj || ''}, ${r.alt || '-'} m n.p.m.]<span class="badge-odczyt">ODCZYT</span></div>Pokrywa śnieżna: <b>${grubosc.toFixed(0)} cm</b>${dateStr}<br>Świeży śnieg: <b>${swiezyVal.toFixed(0)} cm</b><br>Gatunek śniegu: <b>${r.gatunek_opis || '-'}</b><br>Zapas wody: <b>${zapas != null ? zapas + ' mm' : 'brak'}</b><br>Obciążenie: <b>${obciazenie.toFixed(3)} kN/m²</b><br>Norma: <b>${r.norma || '-'} kN/m²</b> (${proc}% normy)`;

            const addPt = (p, val, txt) => {
                dataObj[p].pt_lats.push(lat); dataObj[p].pt_lons.push(lon); dataObj[p].pt_vals.push(val);
                dataObj[p].pt_dirs.push(null); dataObj[p].pt_txts.push(txt); dataObj[p].pt_hov.push(snowTooltip);
                dataObj[p].pt_foreign.push(false); dataObj[p].pt_types.push('ODCZYT'); dataObj[p].pt_meta.push(metaItem);
            };

            addPt('snieg', grubosc, `${grubosc.toFixed(0)}cm`);
            addPt('snieg_swiezy', swiezyVal, `${swiezyVal.toFixed(0)}cm`);
            if (zapas != null) addPt('snieg_zapas', zapas, `${zapas}mm`);
            addPt('snieg_obciazenie', obciazenie, obciazenie.toFixed(2));
            addPt('snieg_norma', proc, `${proc}%`);
        });

        return dataObj;
    };
})();
