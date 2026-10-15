// export.js - Eksport danych telemetrycznych i synoptycznych do formatu CSV
// Kompatybilny z pakietami sf / readr w R oraz Microsoft Excel (UTF-8 BOM).

(function() {
    const PARAM_UNITS = {
        'temp': 'degC', 'grunt': 'degC', 'rosy': 'degC', 'wilg': '%',
        'lcl': 'm', 'wiatr_sr': 'km/h', 'wiatr': 'km/h', 'cisnienie': 'hPa',
        'snieg': 'cm', 'snieg_swiezy': 'cm', 'snieg_zapas': 'mm',
        'snieg_obciazenie': 'kN/m2', 'snieg_norma': '%'
    };

    const pad = (n) => String(n).padStart(2, '0');
    const toUtcIso = (d) => d.toISOString().replace('.000Z', 'Z');
    const formatHmUtc = (d) => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    const formatYmdUtc = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;

    function escapeCsv(val) {
        if (val === null || val === undefined) return '';
        const s = String(val);
        if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    }

    function resolveScope(pData) {
        const okres = window.currentRenderedOkres || 'now';
        let typDanych = pData?.typ_danych;
        if (!typDanych) {
            if (okres.startsWith('min')) typDanych = 'MINIMUM';
            else if (okres.startsWith('max')) typDanych = 'MAKSIMUM';
            else if (okres.startsWith('trend')) typDanych = 'TREND';
            else typDanych = 'AKTUALNE';
        }

        const horyzont = pData?.horyzont || okres;
        const dtDo = pData?.czas_do_utc ? new Date(pData.czas_do_utc) : new Date(pData?.latestTimeMs || Date.now());
        const dtOd = pData?.czas_od_utc ? new Date(pData.czas_od_utc) : (
            typDanych === 'AKTUALNE' ? dtDo : new Date(dtDo.getTime() - 5 * 3600000)
        );

        let opis = '';
        let fileTag = '';
        const dataStr = dtDo.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeDoLocal = dtDo.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        const timeOdLocal = dtOd.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

        if (typDanych === 'AKTUALNE') {
            opis = `Aktualne: ${dataStr}, ${timeDoLocal} (${formatHmUtc(dtDo)} UTC)`;
            fileTag = `aktualne_${formatYmdUtc(dtDo)}T${pad(dtDo.getUTCHours())}${pad(dtDo.getUTCMinutes())}Z`;
        } else if (typDanych === 'MINIMUM') {
            opis = `Minimum (5h): ${dataStr}, ${timeOdLocal}–${timeDoLocal} (${formatHmUtc(dtOd)}–${formatHmUtc(dtDo)} UTC)`;
            fileTag = `min5h_${formatYmdUtc(dtDo)}T${pad(dtOd.getUTCHours())}${pad(dtOd.getUTCMinutes())}-${pad(dtDo.getUTCHours())}${pad(dtDo.getUTCMinutes())}Z`;
        } else if (typDanych === 'MAKSIMUM') {
            opis = `Maksimum (5h): ${dataStr}, ${timeOdLocal}–${timeDoLocal} (${formatHmUtc(dtOd)}–${formatHmUtc(dtDo)} UTC)`;
            fileTag = `max5h_${formatYmdUtc(dtDo)}T${pad(dtOd.getUTCHours())}${pad(dtOd.getUTCMinutes())}-${pad(dtDo.getUTCHours())}${pad(dtDo.getUTCMinutes())}Z`;
        } else {
            opis = `Trend (${horyzont}): ${dataStr}, ${timeOdLocal}–${timeDoLocal} (${formatHmUtc(dtOd)}–${formatHmUtc(dtDo)} UTC)`;
            fileTag = `${horyzont}_${formatYmdUtc(dtDo)}T${pad(dtOd.getUTCHours())}${pad(dtOd.getUTCMinutes())}-${pad(dtDo.getUTCHours())}${pad(dtDo.getUTCMinutes())}Z`;
        }

        return { typDanych, horyzont, czasOdIso: toUtcIso(dtOd), czasDoIso: toUtcIso(dtDo), opis, fileTag };
    }

    function buildRowsFromParam(paramKey, pData) {
        if (!pData || !Array.isArray(pData.pt_lats)) return [];
        const rows = [];
        const count = pData.pt_lats.length;
        const unit = PARAM_UNITS[paramKey] || '';
        const scope = resolveScope(pData);

        for (let i = 0; i < count; i++) {
            const meta = (pData.pt_meta && pData.pt_meta[i]) || {};
            const isModel = (pData.pt_types && pData.pt_types[i] === 'PROGNOZA');
            const typ = isModel ? 'MODEL' : (meta.typ || 'ODCZYT');
            const zrodlo = meta.zrodlo || (isModel ? 'ICON' : (pData.pt_foreign && pData.pt_foreign[i] ? 'ASOS' : 'IMGW'));
            const id = meta.id || '';
            const nazwa = meta.nazwa || '';
            const lat = pData.pt_lats[i];
            const lon = pData.pt_lons[i];
            const wartosc = pData.pt_vals[i];
            const kierunek = (pData.pt_dirs && pData.pt_dirs[i] !== null && !isNaN(pData.pt_dirs[i])) ? pData.pt_dirs[i] : '';
            const czas = meta.czas || (pData.latestTimeMs ? toUtcIso(new Date(pData.latestTimeMs)) : scope.czasDoIso);

            rows.push([
                escapeCsv(id), escapeCsv(nazwa),
                lat.toFixed(4), lon.toFixed(4),
                escapeCsv(paramKey),
                (wartosc !== null && !isNaN(wartosc)) ? wartosc.toFixed(2) : '',
                escapeCsv(unit),
                escapeCsv(scope.typDanych), escapeCsv(scope.horyzont),
                escapeCsv(scope.czasOdIso), escapeCsv(scope.czasDoIso),
                escapeCsv(czas),
                kierunek !== '' ? Number(kierunek).toFixed(0) : '',
                escapeCsv(zrodlo), escapeCsv(typ)
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

    window.updateExportMetaBadge = function(dataOverride) {
        const el = document.getElementById('export-meta-info');
        if (!el) return;
        const data = dataOverride || window.currentRenderedData;
        if (!data || !data.pt_lats || !data.pt_lats.length) {
            el.textContent = 'Brak danych do eksportu';
            el.style.color = 'var(--text-muted, #94a3b8)';
            return;
        }
        const scope = resolveScope(data);
        el.textContent = scope.opis;
        el.style.color = 'var(--text-secondary, #cbd5e1)';
    };

    function showStatus(btn, text, isError = false) {
        if (!btn) return;
        const prevText = btn.dataset.prevText || btn.textContent;
        btn.dataset.prevText = prevText;
        btn.textContent = text;
        if (isError) btn.style.borderColor = 'var(--accent-danger, #ef4444)';
        setTimeout(() => {
            btn.textContent = prevText;
            btn.style.borderColor = '';
        }, 3500);
    }

    const CSV_HEADER = [
        'id_stacji', 'nazwa', 'lat', 'lon', 'parametr', 'wartosc', 'jednostka',
        'typ_danych', 'horyzont', 'czas_od_utc', 'czas_do_utc', 'czas_utc',
        'kierunek_deg', 'zrodlo', 'typ'
    ];

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

            const scope = resolveScope(data);
            const rows = buildRowsFromParam(param, data);
            const csv = [CSV_HEADER.join(','), ...rows.map(r => r.join(','))].join('\r\n');
            const filename = `bmapa_${param}_${scope.fileTag}.csv`;
            
            triggerDownload(csv, filename);
            showStatus(btn, `${scope.typDanych === 'AKTUALNE' ? 'Pobrano aktualne' : 'Pobrano ' + scope.typDanych}`);
            window.updateExportMetaBadge(data);
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

            const allRows = [];
            let latestScope = null;
            for (const paramKey of Object.keys(dataObj)) {
                const paramRows = buildRowsFromParam(paramKey, dataObj[paramKey]);
                allRows.push(...paramRows);
                if (!latestScope) latestScope = resolveScope(dataObj[paramKey]);
            }

            if (!allRows.length) {
                showStatus(btn, 'Brak danych', true);
                return;
            }

            const scope = latestScope || resolveScope(null);
            const csv = [CSV_HEADER.join(','), ...allRows.map(r => r.join(','))].join('\r\n');
            const filename = `bmapa_wszystkie_${scope.fileTag}.csv`;
            
            triggerDownload(csv, filename);
            showStatus(btn, 'Pobrano wszystkie');
        } catch (err) {
            console.error('Błąd eksportu CSV wszystkich parametrów:', err);
            showStatus(btn, 'Błąd eksportu', true);
        } finally {
            if (btn) btn.disabled = false;
        }
    };
})();
