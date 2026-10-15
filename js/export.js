// export.js - Eksport danych telemetrycznych i synoptycznych do formatu CSV
// Kompatybilny z pakietami sf / readr w R oraz Microsoft Excel (UTF-8 BOM).

(function() {
    const PARAM_UNITS = {
        'temp': 'degC',
        'grunt': 'degC',
        'rosy': 'degC',
        'wilg': '%',
        'lcl': 'm',
        'wiatr_sr': 'km/h',
        'wiatr': 'km/h',
        'cisnienie': 'hPa',
        'snieg': 'cm',
        'snieg_swiezy': 'cm',
        'snieg_zapas': 'mm',
        'snieg_obciazenie': 'kN/m2',
        'snieg_norma': '%'
    };

    function escapeCsv(val) {
        if (val === null || val === undefined) return '';
        const s = String(val);
        if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    }

    function buildRowsFromParam(paramKey, pData) {
        if (!pData || !Array.isArray(pData.pt_lats)) return [];
        const rows = [];
        const count = pData.pt_lats.length;
        const unit = PARAM_UNITS[paramKey] || '';

        for (let i = 0; i < count; i++) {
            const meta = (pData.pt_meta && pData.pt_meta[i]) || {};
            const isModel = (pData.pt_types && pData.pt_types[i] === 'PROGNOZA');
            const typ = isModel ? 'MODEL' : 'ODCZYT';
            const zrodlo = meta.zrodlo || (isModel ? 'ICON' : (pData.pt_foreign && pData.pt_foreign[i] ? 'ASOS' : 'IMGW'));
            const id = meta.id || '';
            const nazwa = meta.nazwa || '';
            const lat = pData.pt_lats[i];
            const lon = pData.pt_lons[i];
            const wartosc = pData.pt_vals[i];
            const kierunek = (pData.pt_dirs && pData.pt_dirs[i] !== null && !isNaN(pData.pt_dirs[i])) ? pData.pt_dirs[i] : '';
            const czas = meta.czas || (pData.latestTimeMs ? new Date(pData.latestTimeMs).toISOString().replace('.000Z', 'Z') : '');

            rows.push([
                escapeCsv(id),
                escapeCsv(nazwa),
                lat.toFixed(4),
                lon.toFixed(4),
                escapeCsv(paramKey),
                (wartosc !== null && !isNaN(wartosc)) ? wartosc.toFixed(2) : '',
                escapeCsv(unit),
                kierunek !== '' ? Number(kierunek).toFixed(0) : '',
                escapeCsv(czas),
                escapeCsv(zrodlo),
                escapeCsv(typ)
            ]);
        }
        return rows;
    }

    function triggerDownload(csvContent, filename) {
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function generateTimestamp() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}Z`;
    }

    function showStatus(btn, text, isError = false) {
        if (!btn) return;
        const prevText = btn.dataset.prevText || btn.textContent;
        btn.dataset.prevText = prevText;
        btn.textContent = text;
        if (isError) btn.style.borderColor = 'var(--accent-danger, #ef4444)';
        setTimeout(() => {
            btn.textContent = prevText;
            btn.style.borderColor = '';
        }, 3000);
    }

    window.exportCurrentParamCsv = async function(btn) {
        const paramEl = document.getElementById('imgw-zmienna');
        const param = paramEl ? paramEl.value : 'temp';
        if (btn) btn.disabled = true;

        try {
            const data = window.currentRenderedData || (window.getMapExportData ? (await window.getMapExportData(param))[param] : null);
            if (!data || !data.pt_lats || !data.pt_lats.length) {
                showStatus(btn, 'Brak danych', true);
                return;
            }

            const header = ['id_stacji', 'nazwa', 'lat', 'lon', 'parametr', 'wartosc', 'jednostka', 'kierunek_deg', 'czas_utc', 'zrodlo', 'typ'];
            const rows = buildRowsFromParam(param, data);
            const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\r\n');
            const filename = `bmapa_${param}_${generateTimestamp()}.csv`;
            
            triggerDownload(csv, filename);
            showStatus(btn, 'Pobrano CSV');
        } catch (err) {
            console.error('Błąd eksportu CSV:', err);
            showStatus(btn, 'Błąd eksportu', true);
        } finally {
            if (btn) btn.disabled = false;
        }
    };

    window.exportAllParamsCsv = async function(btn) {
        if (btn) btn.disabled = true;
        try {
            if (typeof window.getMapExportData !== 'function') {
                showStatus(btn, 'Silnik niedostępny', true);
                return;
            }
            const dataObj = await window.getMapExportData();
            if (!dataObj) {
                showStatus(btn, 'Brak danych', true);
                return;
            }

            const header = ['id_stacji', 'nazwa', 'lat', 'lon', 'parametr', 'wartosc', 'jednostka', 'kierunek_deg', 'czas_utc', 'zrodlo', 'typ'];
            const allRows = [];

            for (const paramKey of Object.keys(dataObj)) {
                const paramRows = buildRowsFromParam(paramKey, dataObj[paramKey]);
                allRows.push(...paramRows);
            }

            if (!allRows.length) {
                showStatus(btn, 'Brak danych', true);
                return;
            }

            const csv = [header.join(','), ...allRows.map(r => r.join(','))].join('\r\n');
            const filename = `bmapa_wszystkie_${generateTimestamp()}.csv`;
            
            triggerDownload(csv, filename);
            showStatus(btn, 'Pobrano CSV');
        } catch (err) {
            console.error('Błąd eksportu CSV wszystkich parametrów:', err);
            showStatus(btn, 'Błąd eksportu', true);
        } finally {
            if (btn) btn.disabled = false;
        }
    };
})();
