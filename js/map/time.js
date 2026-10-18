// js/map/time.js
// Narzędzia formatowania czasu CET/CEST, strefy czasowej, kątów wiatru i punktu rosy

export const COMPASS_TO_DEG = {
    'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5, 'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
    'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5, 'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
};

export function calculateDewPoint(temp_c, rh_pct) {
    if (temp_c == null || rh_pct == null || rh_pct <= 0) return null;
    const a = 17.27, b = 237.7;
    const alpha = (a * temp_c) / (b + temp_c) + Math.log(rh_pct / 100.0);
    return (b * alpha) / (a - alpha);
}

export function toIsoUtc(input) {
    if (!input) return '';
    let ms = typeof input === 'number' ? input : NaN;
    if (isNaN(ms)) {
        const s = String(input).trim();
        const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s);
        ms = Date.parse(hasZone ? s : s.replace(' ', 'T') + 'Z');
    }
    return (isNaN(ms) || ms <= 0) ? '' : new Date(ms).toISOString().replace('.000Z', 'Z');
}

export function fmtPlTime(input, showSec = false) {
    if (!input) return '';
    let ms = typeof input === 'number' ? input : NaN;
    if (isNaN(ms)) {
        const s = String(input).trim();
        const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s);
        ms = Date.parse(hasZone ? s : s.replace(' ', 'T') + 'Z');
    }
    if (isNaN(ms) || ms <= 0) return '';
    const d = new Date(ms);
    const opts = { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit', ...(showSec ? { second: '2-digit' } : {}) };
    const hm = d.toLocaleTimeString('pl-PL', opts);
    const plH = parseInt(d.toLocaleTimeString('pl-PL', { timeZone: 'Europe/Warsaw', hour: '2-digit' }), 10);
    const diff = (plH - d.getUTCHours() + 24) % 24;
    return `${hm} ${diff === 2 ? 'CEST' : 'CET'}`;
}

export const fmtTime = s => {
    const pl = fmtPlTime(s);
    return pl ? ` <span style="font-size:0.75rem; color:#a1a1aa;">(${pl})</span>` : '';
};
