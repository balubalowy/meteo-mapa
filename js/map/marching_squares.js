// js/map/marching_squares.js
// Algorytm Marching Squares z podpikselowa interpolacja liniowa i etykietami izolinii

const CELL_EDGES = {
    1: [[3, 0]],
    2: [[0, 1]],
    3: [[3, 1]],
    4: [[1, 2]],
    6: [[0, 2]],
    7: [[3, 2]],
    8: [[2, 3]],
    9: [[0, 2]],
    11: [[1, 2]],
    12: [[3, 1]],
    13: [[0, 1]],
    14: [[3, 0]]
};

function getSmoothGrid(valGrid, gw, gh) {
    const smooth = new Float32Array(gw * gh);
    for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
            const idx = y * gw + x;
            if (x === 0 || x === gw - 1 || y === 0 || y === gh - 1) {
                smooth[idx] = valGrid[idx];
            } else {
                smooth[idx] = (valGrid[idx] * 4 + valGrid[idx - 1] + valGrid[idx + 1] + valGrid[idx - gw] + valGrid[idx + gw]) / 8;
            }
        }
    }
    return smooth;
}

function getCellEdgePairs(mask, center, T) {
    if (mask === 5) return center >= T ? [[3, 0], [1, 2]] : [[3, 2], [0, 1]];
    if (mask === 10) return center >= T ? [[0, 1], [2, 3]] : [[0, 3], [1, 2]];
    return CELL_EDGES[mask] || null;
}

function interpolateEdgePoint(edgeIdx, i, j, v, T, scaleX, scaleY) {
    const pt = (gx, gy) => ({ x: gx * scaleX, y: gy * scaleY });
    switch (edgeIdx) {
        case 0: return pt(i + (T - v[0]) / (v[1] - v[0]), j);
        case 1: return pt(i + 1, j + (T - v[1]) / (v[2] - v[1]));
        case 2: return pt(i + (T - v[3]) / (v[2] - v[3]), j + 1);
        case 3: return pt(i, j + (T - v[0]) / (v[3] - v[0]));
        default: return { x: 0, y: 0 };
    }
}

function getSegmentsForThreshold(grid, dims, T) {
    const { gw, gh, scaleX, scaleY } = dims;
    const segs = [];
    for (let j = 0; j < gh - 1; j++) {
        for (let i = 0; i < gw - 1; i++) {
            const idx = j * gw + i;
            const v = [grid[idx], grid[idx + 1], grid[idx + gw + 1], grid[idx + gw]];
            let mask = 0;
            if (v[0] >= T) mask |= 1;
            if (v[1] >= T) mask |= 2;
            if (v[2] >= T) mask |= 4;
            if (v[3] >= T) mask |= 8;
            if (mask === 0 || mask === 15) continue;

            const center = (v[0] + v[1] + v[2] + v[3]) * 0.25;
            const edgePairs = getCellEdgePairs(mask, center, T);
            if (!edgePairs) continue;

            for (const [eA, eB] of edgePairs) {
                segs.push([
                    interpolateEdgePoint(eA, i, j, v, T, scaleX, scaleY),
                    interpolateEdgePoint(eB, i, j, v, T, scaleX, scaleY)
                ]);
            }
        }
    }
    return segs;
}

function extractIsoLabel(segs, T, step, unit, w, h) {
    const cand = segs.filter(s => {
        const mx = (s[0].x + s[1].x) * 0.5, my = (s[0].y + s[1].y) * 0.5;
        return mx > w * 0.18 && mx < w * 0.82 && my > h * 0.18 && my < h * 0.82;
    });
    if (!cand.length) return [];

    const labelTxt = Number(T).toFixed(step < 1 ? 1 : 0) + (unit || '');
    const mid = cand[Math.floor(cand.length / 2)];
    const lx = (mid[0].x + mid[1].x) * 0.5, ly = (mid[0].y + mid[1].y) * 0.5;
    const labels = [{ x: lx, y: ly, text: labelTxt }];

    if (cand.length > 40) {
        const p2 = cand[Math.floor(cand.length * 0.2)];
        const lx2 = (p2[0].x + p2[1].x) * 0.5, ly2 = (p2[0].y + p2[1].y) * 0.5;
        if (Math.hypot(lx - lx2, ly - ly2) > 220) {
            labels.push({ x: lx2, y: ly2, text: labelTxt });
        }
    }
    return labels;
}

function drawLabels(ctx, labels) {
    if (!labels.length) return;
    ctx.save();
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const lbl of labels) {
        const tw = ctx.measureText(lbl.text).width;
        const bw = tw + 10, bh = 17;
        const bx = lbl.x - bw / 2, by = lbl.y - bh / 2;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 4);
        else ctx.rect(bx, by, bw, bh);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(lbl.text, lbl.x, lbl.y + 0.5);
    }
    ctx.restore();
}

export function drawIsolines(ctx, valGrid, gridDim, isoConfig) {
    const dims = typeof gridDim === 'object' ? gridDim : { gw: arguments[2], gh: arguments[3], w: arguments[4], h: arguments[5] };
    const cfg = typeof isoConfig === 'object' ? isoConfig : { cmin: arguments[6], cmax: arguments[7], stepVal: arguments[8], unit: arguments[9] };
    const { gw, gh, w, h } = dims;
    const { cmin, cmax, stepVal, unit } = cfg;

    const smoothGrid = getSmoothGrid(valGrid, gw, gh);
    const step = (stepVal && !isNaN(stepVal) && stepVal > 0) ? stepVal : ((cmax - cmin) / 15);
    const startVal = Math.ceil(cmin / step) * step;
    const scaleX = w / (gw - 1), scaleY = h / (gh - 1);
    const thresholdDims = { gw, gh, scaleX, scaleY };

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const isoLabels = [];
    for (let T = startVal; T <= cmax; T += step) {
        const segs = getSegmentsForThreshold(smoothGrid, thresholdDims, T);
        if (!segs.length) continue;

        ctx.beginPath();
        for (let s = 0; s < segs.length; s++) {
            ctx.moveTo(segs[s][0].x, segs[s][0].y);
            ctx.lineTo(segs[s][1].x, segs[s][1].y);
        }
        ctx.stroke();

        isoLabels.push(...extractIsoLabel(segs, T, step, unit, w, h));
    }

    drawLabels(ctx, isoLabels);
}
