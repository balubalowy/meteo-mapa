// js/export.js - Eksport danych telemetrycznych i synoptycznych do formatu CSV
// Kompatybilny z pakietami sf / readr w R oraz Microsoft Excel (UTF-8 BOM).

(function() {
    const PARAM_UNITS = {
        temp: 'degC', grunt: 'degC', rosy: 'degC', wilg: '%', lcl: 'm',
        wiatr_sr: 'km/h', wiatr: 'km/h', cisnienie: 'hPa', snieg: 'cm',
        snieg_swiezy: 'cm', snieg_zapas: 'mm', snieg_obciazenie: 'kN/m2', snieg_norma: '%'
    };

    const pad = n => String(n).padStart(2, '0');
    const toUtcIso = d => d.toISOString().replace('.000Z', 'Z');
    const formatHmUtc = d => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    const formatYmdUtc = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;

    function escapeCsv(val) {
        if (val === null || val === undefined) return '';
        const s = String(val);
        return (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r'))
            ? `"${s.replace(/"/g, '""')}"` : s;
    }

    function determineDataType(pData, okres) {
        if (pData?.typ_danych) return pData.typ_danych;
        if (okres.startsWith('min')) return 'MINIMUM';
        if (okres.startsWith('max')) return 'MAKSIMUM';
        if (okres.startsWith('trend')) return 'TREND';
        return 'AKTUALNE';
    }

    function determineDateRange(pData, typDanych) {
        const dtDo = pData?.czas_do_utc ? new Date(pData.czas_do_utc) : new Date(pData?.latestTimeMs || Date.now());
        if (pData?.czas_od_utc) return { dtOd: new Date(pData.czas_od_utc), dtDo };
        const dtOd = typDanych === 'AKTUALNE' ? dtDo : new Date(dtDo.getTime() - 5 * 3600000);
        return { dtOd, dtDo };
    }

    function formatScopeDescriptions(typDanych, horyzont, dtOd, dtDo) {
        const dataStr = dtDo.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeDo = dtDo.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        const timeOd = dtOd.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        const ymd = formatYmdUtc(dtDo);
        const hmDo = `${pad(dtDo.getUTCHours())}${pad(dtDo.getUTCMinutes())}`;
        const hmOd = `${pad(dtOd.getUTCHours())}${pad(dtOd.getUTCMinutes())}`;

        if (typDanych === 'AKTUALNE') {
            return { opis: `Aktualne: ${dataStr}, ${timeDo} (${formatHmUtc(dtDo)} UTC)`, fileTag: `aktualne_${ymd}T${hmDo}Z` };
        }
        if (typDanych === 'MINIMUM' || typDanych === 'MAKSIMUM') {
            const lbl = typDanych === 'MINIMUM' ? 'Minimum' : 'Maksimum';
            const tag = typDanych === 'MINIMUM' ? 'min5h' : 'max5h';
            return { opis: `${lbl} (5h): ${dataStr}, ${timeOd}–${timeDo} (${formatHmUtc(dtOd)}–${formatHmUtc(dtDo)} UTC)`, fileTag: `${tag}_${ymd}T${hmOd}-${hmDo}Z` };
        }
        return { opis: `Trend (${horyzont}): ${dataStr}, ${timeOd}–${timeDo} (${formatHmUtc(dtOd)}–${formatHmUtc(dtDo)} UTC)`, fileTag: `${horyzont}_${ymd}T${hmOd}-${hmDo}Z` };
    }

    function resolveScope(pData) {
        const okres = window.currentRenderedOkres || 'now';
        const typDanych = determineDataType(pData, okres);
        const horyzont = pData?.horyzont || okres;
        const { dtOd, dtDo } = determineDateRange(pData, typDanych);
        const { opis, fileTag } = formatScopeDescriptions(typDanych, horyzont, dtOd, dtDo);

        return { typDanych, horyzont, czasOdIso: toUtcIso(dtOd), czasDoIso: toUtcIso(dtDo), opis, fileTag };
    }

    function resolvePointSource(meta, isModel, isForeign) {
        if (meta.zrodlo) return meta.zrodlo;
        if (isModel) return 'ICON';
        return isForeign ? 'ASOS' : 'IMGW';
    }

    function buildRowsFromParam(paramKey, pData) {
        if (!pData?.pt_lats?.length) return [];
        const rows = [];
        const unit = PARAM_UNITS[paramKey] || '';
        const scope = resolveScope(pData);

        for (let i = 0; i < pData.pt_lats.length; i++) {
            const meta = pData.pt_meta?.[i] || {};
            const isModel = pData.pt_types?.[i] === 'PROGNOZA', isForeign = Boolean(pData.pt_foreign?.[i]);
            const typ = isModel ? 'MODEL' : (meta.typ || 'ODCZYT');
            const zrodlo = resolvePointSource(meta, isModel, isForeign);
            const val = pData.pt_vals[i], dir = pData.pt_dirs?.[i];
            const dirTxt = (dir !== null && dir !== undefined && !isNaN(dir)) ? Number(dir).toFixed(0) : '';
            const valTxt = (val !== null && val !== undefined && !isNaN(val)) ? val.toFixed(2) : '';
            const czas = meta.czas || (pData.latestTimeMs ? toUtcIso(new Date(pData.latestTimeMs)) : scope.czasDoIso);

            rows.push([
                escapeCsv(meta.id || ''), escapeCsv(meta.nazwa || ''), pData.pt_lats[i].toFixed(4), pData.pt_lons[i].toFixed(4),
                escapeCsv(paramKey), valTxt, escapeCsv(unit), escapeCsv(scope.typDanych), escapeCsv(scope.horyzont),
                escapeCsv(scope.czasOdIso), escapeCsv(scope.czasDoIso), escapeCsv(czas), dirTxt, escapeCsv(zrodlo), escapeCsv(typ)
            ]);
        }
        return rows;
    }

    function triggerDownload(csvContent, filename) {
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url; link.download = filename;
        document.body.appendChild(link); link.click();
        document.body.removeChild(link); URL.revokeObjectURL(url);
    }

    window.updateExportMetaBadge = function(dataOverride) {
        const el = document.getElementById('export-meta-info');
        if (!el) return;
        const data = dataOverride || window.currentRenderedData;
        if (!data?.pt_lats?.length) {
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
        btn.dataset.prevText = prevText; btn.textContent = text;
        if (isError) btn.style.borderColor = 'var(--accent-danger, #ef4444)';
        setTimeout(() => { btn.textContent = prevText; btn.style.borderColor = ''; }, 3500);
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
            if (!data?.pt_lats?.length) {
                showStatus(btn, 'Brak danych', true);
                return;
            }
            const scope = resolveScope(data);
            const rows = buildRowsFromParam(param, data);
            const csv = [CSV_HEADER.join(','), ...rows.map(r => r.join(','))].join('\r\n');
            triggerDownload(csv, `bmapa_${param}_${scope.fileTag}.csv`);
            showStatus(btn, scope.typDanych === 'AKTUALNE' ? 'Pobrano aktualne' : `Pobrano ${scope.typDanych}`);
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
                allRows.push(...buildRowsFromParam(paramKey, dataObj[paramKey]));
                if (!latestScope) latestScope = resolveScope(dataObj[paramKey]);
            }

            if (!allRows.length) {
                showStatus(btn, 'Brak danych', true);
                return;
            }

            const tag = latestScope ? latestScope.fileTag : 'wszystkie';
            const csv = [CSV_HEADER.join(','), ...allRows.map(r => r.join(','))].join('\r\n');
            triggerDownload(csv, `bmapa_pomiary_zbiorcze_${tag}.csv`);
            showStatus(btn, 'Pobrano wszystkie');
        } catch (err) {
            console.error('Błąd eksportu zbiorczego CSV:', err);
            showStatus(btn, 'Błąd eksportu', true);
        } finally {
            if (btn) btn.disabled = false;
        }
    };
})();
