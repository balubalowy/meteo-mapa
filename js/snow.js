// Moduł analizy pokrywy śnieżnej IMGW-PIB
// Źródło biuletynu: https://res4.imgw.pl/products/hydro/monitor-lite-products/Pokrywa_sniezna.pdf

(function() {
    let _snowCache = null;
    let _snowCacheTime = 0;
    const CACHE_TTL = 3600000; // 1 godzina cache

    const GATUNKI_SNIEGU = {
        1: 'puszysty, świeży',
        2: 'krupiasty, sypki',
        3: 'zsiadły lub przewiany',
        4: 'zbity',
        5: 'mokry (lepki)',
        6: 'powierzchnia zlodowaciała (szreń)',
        7: 'powierzchnia zlodowaciała (lodoszreń)',
        8: 'ziarnista',
        9: 'warstwa szadzi > 2cm'
    };

    // Ładowanie biblioteki pdf.js w razie potrzeby
    async function ensurePdfJs() {
        if (window.pdfjsLib) return;
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                if (window.pdfjsLib) {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                }
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Pobieranie tekstu z biuletynu PDF za pomocą pdf.js
    async function extractTextFromPdf(pdfUrl) {
        await ensurePdfJs();
        const loadingTask = window.pdfjsLib.getDocument({
            url: pdfUrl,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true
        });
        const doc = await loadingTask.promise;
        let fullText = '';
        for (let p = 1; p <= doc.numPages; p++) {
            const page = await doc.getPage(p);
            const content = await page.getTextContent();
            const pageStrings = content.items.map(item => item.str);
            fullText += pageStrings.join(' ') + '\n';
        }
        return fullText;
    }

    // Parsowanie danych ze stacji
    function parseSnowRecords(fullText, stationsMeta) {
        const recordsMap = new Map();
        
        // Wyciąganie daty biuletynu
        const mDate = fullText.match(/(\d{2}\.\d{2}\.\d{4})/);
        const reportDate = mDate ? mDate[1] : '';

        stationsMeta.forEach(meta => {
            const lp = meta.lp;
            const searchKey = lp + '. ';
            const idx = fullText.indexOf(searchKey);
            if (idx === -1) return;
            const nextKey = (lp + 1) + '. ';
            const nextIdx = fullText.indexOf(nextKey, idx);
            const chunk = nextIdx !== -1 ? fullText.substring(idx, nextIdx) : fullText.substring(idx, idx + 400);

            // Wyciąganie liczb na końcu wiersza
            const cleanChunk = chunk.replace(/(?:INSTYTUT\s+METEOROLOGII|sprawach\s+procesowych|Uwagi:|Objaśnienia:).*$/i, '').trim();
            const numsMatch = cleanChunk.match(new RegExp('(?:[a-zA-Z\\u0080-\\uFFFF]|\\))\\s+([\\d\\.\\s]+)$', 'i'));
            
            let grubosc = 0;
            let swiezy = null;
            let gatunek = null;
            let zapas = null;
            let obciazenie = 0;

            if (numsMatch) {
                const cleanNums = numsMatch[1].replace(/(\b\d)\s+(\d{3}\b)/g, '$1$2').trim();
                const numTokens = cleanNums.split(/\s+/);
                const middle = numTokens.slice(1, -1);
                
                if (middle.length > 0) {
                    grubosc = parseFloat(middle[0]) || 0;
                    for (let i = 1; i < middle.length; i++) {
                        const t = middle[i];
                        if (t.length === 1 && t >= '1' && t <= '9' && gatunek === null) {
                            gatunek = parseInt(t, 10);
                        } else if (t.length >= 3 && t[0] >= '1' && t[0] <= '9' && gatunek === null && zapas === null && t.indexOf('.') === -1) {
                            // Rozdzielenie sklejenia gatunek (1 cyfra) + zapas wody (2-3 cyfry), np. 7330 -> gatunek 7, zapas 330
                            gatunek = parseInt(t[0], 10);
                            zapas = parseFloat(t.substring(1)) || 0;
                        } else if (t.indexOf('.') !== -1 && obciazenie === 0) {
                            // Rozróżnienie świeżego śniegu vs obciążenia: świeży śnieg pojawia się PRZED kodem gatunku
                            if (gatunek === null && swiezy === null) {
                                swiezy = parseFloat(t) || 0;
                            } else {
                                obciazenie = parseFloat(t) || 0;
                            }
                        } else if (t.indexOf('.') === -1 && zapas === null) {
                            if (gatunek === null && swiezy === null) {
                                swiezy = parseFloat(t) || 0;
                            } else {
                                zapas = parseFloat(t) || 0;
                            }
                        }
                    }
                }
            }

            const norma = meta.norma || 1.0;
            const procNormy = norma > 0 ? Math.round((obciazenie / norma) * 100) : 0;

            recordsMap.set(lp, {
                ...meta,
                grubosc,
                swiezy,
                gatunek_kod: gatunek,
                gatunek_opis: gatunek ? (GATUNKI_SNIEGU[gatunek] || 'określony') : 'brak',
                zapas,
                obciazenie,
                procent_normy: procNormy,
                data: reportDate
            });
        });

        return Array.from(recordsMap.values());
    }

    // Główna funkcja pobierająca
    async function fetchSnowRecords() {
        const now = Date.now();
        if (_snowCache && (now - _snowCacheTime < CACHE_TTL)) {
            return _snowCache;
        }

        let stationsMeta = [];
        try {
            const respMeta = await fetch('dane/snow_stations.json');
            if (respMeta.ok) stationsMeta = await respMeta.json();
        } catch (e) {
            console.warn('Nie udało się załadować dane/snow_stations.json:', e);
        }

        let records = [];

        try {
            const pdfUrl = 'https://res4.imgw.pl/products/hydro/monitor-lite-products/Pokrywa_sniezna.pdf';
            const pdfText = await extractTextFromPdf(pdfUrl);
            if (pdfText && pdfText.length > 500 && stationsMeta.length > 0) {
                records = parseSnowRecords(pdfText, stationsMeta);
            }
        } catch (err) {
            console.warn('Przełączanie na fallback snow_latest.json po błędzie parsowania PDF:', err);
        }

        if (!records.length) {
            try {
                const respFallback = await fetch('dane/snow_latest.json');
                if (respFallback.ok) {
                    const fallbackData = await respFallback.json();
                    records = fallbackData.stacje || [];
                }
            } catch (errFallback) {
                console.error('Błąd wczytywania fallbacku snow_latest.json:', errFallback);
            }
        }

        _snowCache = records;
        _snowCacheTime = now;
        return records;
    }

    window.getSnowData = async function() {
        const records = await fetchSnowRecords();
        const dataObj = {
            'snieg': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [] },
            'snieg_swiezy': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [] },
            'snieg_zapas': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [] },
            'snieg_obciazenie': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [] },
            'snieg_norma': { pt_lats: [], pt_lons: [], pt_vals: [], pt_dirs: [], pt_txts: [], pt_hov: [], pt_foreign: [], pt_types: [] }
        };

        records.forEach(r => {
            const lat = r.lat;
            const lon = r.lon;
            const nazwa = r.name;
            const grubosc = r.grubosc || 0;
            const zapas = r.zapas != null ? r.zapas : null;
            const obciazenie = r.obciazenie || 0;
            const proc = r.procent_normy || 0;
            const dateStr = r.data ? ` (${r.data})` : '';

            const swiezyVal = (r.swiezy != null && !isNaN(r.swiezy)) ? r.swiezy : 0;

            const baseTooltip = 
                `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;">` +
                `<b style="font-size:0.85rem;">${nazwa}</b> [${r.woj || ''}, ${r.alt || '-'} m n.p.m.]` +
                `<span class="badge-odczyt">ODCZYT</span>` +
                `</div>` +
                `Grubość pokrywy: <b>${grubosc.toFixed(0)} cm</b>${dateStr}<br>` +
                (swiezyVal > 0 ? `Świeżo spadły śnieg: <b>${swiezyVal.toFixed(0)} cm</b><br>` : '') +
                `Gatunek śniegu: <b>${r.gatunek_opis || '-'}</b><br>` +
                `Zapas wody w śniegu: <b>${zapas != null ? zapas + ' mm' : 'brak'}</b><br>` +
                `Obciążenie śniegiem: <b>${obciazenie.toFixed(3)} kN/m²</b><br>` +
                `Norma obciążenia: <b>${r.norma || '-'} kN/m²</b> (${proc}% normy)`;

            dataObj['snieg'].pt_lats.push(lat);
            dataObj['snieg'].pt_lons.push(lon);
            dataObj['snieg'].pt_vals.push(grubosc);
            dataObj['snieg'].pt_dirs.push(null);
            dataObj['snieg'].pt_txts.push(`${grubosc.toFixed(0)}cm`);
            dataObj['snieg'].pt_hov.push(baseTooltip);
            dataObj['snieg'].pt_foreign.push(false);
            dataObj['snieg'].pt_types.push('ODCZYT');

            const swiezyTooltip = 
                `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;">` +
                `<b style="font-size:0.85rem;">${nazwa}</b> [${r.woj || ''}, ${r.alt || '-'} m n.p.m.]` +
                `<span class="badge-odczyt">ODCZYT</span>` +
                `</div>` +
                `Świeżo spadły śnieg: <b>${swiezyVal.toFixed(0)} cm</b>${dateStr}<br>` +
                `Całkowita pokrywa: <b>${grubosc.toFixed(0)} cm</b><br>` +
                `Gatunek śniegu: <b>${r.gatunek_opis || '-'}</b><br>` +
                `Zapas wody w śniegu: <b>${zapas != null ? zapas + ' mm' : 'brak'}</b><br>` +
                `Obciążenie śniegiem: <b>${obciazenie.toFixed(3)} kN/m²</b><br>` +
                `Norma obciążenia: <b>${r.norma || '-'} kN/m²</b> (${proc}% normy)`;

            dataObj['snieg_swiezy'].pt_lats.push(lat);
            dataObj['snieg_swiezy'].pt_lons.push(lon);
            dataObj['snieg_swiezy'].pt_vals.push(swiezyVal);
            dataObj['snieg_swiezy'].pt_dirs.push(null);
            dataObj['snieg_swiezy'].pt_txts.push(`${swiezyVal.toFixed(0)}cm`);
            dataObj['snieg_swiezy'].pt_hov.push(swiezyTooltip);
            dataObj['snieg_swiezy'].pt_foreign.push(false);
            dataObj['snieg_swiezy'].pt_types.push('ODCZYT');

            if (zapas != null) {
                dataObj['snieg_zapas'].pt_lats.push(lat);
                dataObj['snieg_zapas'].pt_lons.push(lon);
                dataObj['snieg_zapas'].pt_vals.push(zapas);
                dataObj['snieg_zapas'].pt_dirs.push(null);
                dataObj['snieg_zapas'].pt_txts.push(`${zapas}mm`);
                dataObj['snieg_zapas'].pt_hov.push(baseTooltip);
                dataObj['snieg_zapas'].pt_foreign.push(false);
                dataObj['snieg_zapas'].pt_types.push('ODCZYT');
            }

            dataObj['snieg_obciazenie'].pt_lats.push(lat);
            dataObj['snieg_obciazenie'].pt_lons.push(lon);
            dataObj['snieg_obciazenie'].pt_vals.push(obciazenie);
            dataObj['snieg_obciazenie'].pt_dirs.push(null);
            dataObj['snieg_obciazenie'].pt_txts.push(`${obciazenie.toFixed(2)}`);
            dataObj['snieg_obciazenie'].pt_hov.push(baseTooltip);
            dataObj['snieg_obciazenie'].pt_foreign.push(false);
            dataObj['snieg_obciazenie'].pt_types.push('ODCZYT');

            dataObj['snieg_norma'].pt_lats.push(lat);
            dataObj['snieg_norma'].pt_lons.push(lon);
            dataObj['snieg_norma'].pt_vals.push(proc);
            dataObj['snieg_norma'].pt_dirs.push(null);
            dataObj['snieg_norma'].pt_txts.push(`${proc}%`);
            dataObj['snieg_norma'].pt_hov.push(baseTooltip);
            dataObj['snieg_norma'].pt_foreign.push(false);
            dataObj['snieg_norma'].pt_types.push('ODCZYT');
        });

        return dataObj;
    };
})();
