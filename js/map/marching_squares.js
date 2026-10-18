// js/map/marching_squares.js
// Algorytm Marching Squares z podpikselowa interpolacja liniowa i etykietami izolinii

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

function getSegmentsForThreshold(grid, gw, gh, T, scaleX, scaleY) {
    const segs = [];
    for (let j = 0; j < gh - 1; j++) {
        for (let i = 0; i < gw - 1; i++) {
            const idx = j * gw + i;
            const v0 = grid[idx], v1 = grid[idx + 1], v2 = grid[idx + gw + 1], v3 = grid[idx + gw];
            let mask = 0;
            if (v0 >= T) mask |= 1;
            if (v1 >= T) mask |= 2;
            if (v2 >= T) mask |= 4;
            if (v3 >= T) mask |= 8;
            if (mask === 0 || mask === 15) continue;

            const pt = (gx, gy) => ({ x: gx * scaleX, y: gy * scaleY });
            const itop = () => pt(i + (T - v0) / (v1 - v0), j);
            const iright = () => pt(i + 1, j + (T - v1) / (v2 - v1));
            const ibot = () => pt(i + (T - v3) / (v2 - v3), j + 1);
            const ileft = () => pt(i, j + (T - v0) / (v3 - v0));
            const center = (v0 + v1 + v2 + v3) * 0.25;

            if (mask === 1) segs.push([ileft(), itop()]);
            else if (mask === 2) segs.push([itop(), iright()]);
            else if (mask === 3) segs.push([ileft(), iright()]);
            else if (mask === 4) segs.push([iright(), ibot()]);
            else if (mask === 5) {
                if (center >= T) { segs.push([ileft(), itop()]); segs.push([iright(), ibot()]); }
                else { segs.push([ileft(), ibot()]); segs.push([itop(), iright()]); }
            } else if (mask === 6) segs.push([itop(), ibot()]);
            else if (mask === 7) segs.push([ileft(), ibot()]);
            else if (mask === 8) segs.push([ibot(), ileft()]);
            else if (mask === 9) segs.push([itop(), ibot()]);
            else if (mask === 10) {
                if (center >= T) { segs.push([itop(), iright()]); segs.push([ibot(), ileft()]); }
                else { segs.push([itop(), ileft()]); segs.push([ibot(), iright()]); }
            } else if (mask === 11) segs.push([iright(), ibot()]);
            else if (mask === 12) segs.push([ileft(), iright()]);
            else if (mask === 13) segs.push([itop(), iright()]);
            else if (mask === 14) segs.push([ileft(), itop()]);
        }
    }
    return segs;
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

export function drawIsolines(ctx, valGrid, gw, gh, w, h, cmin, cmax, stepVal, unit) {
    const smoothGrid = getSmoothGrid(valGrid, gw, gh);
    const step = (stepVal && !isNaN(stepVal) && stepVal > 0) ? stepVal : ((cmax - cmin) / 15);
    const startVal = Math.ceil(cmin / step) * step;
    const scaleX = w / (gw - 1);
    const scaleY = h / (gh - 1);

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const isoLabels = [];

    for (let T = startVal; T <= cmax; T += step) {
        const segs = getSegmentsForThreshold(smoothGrid, gw, gh, T, scaleX, scaleY);
        if (!segs.length) continue;

        ctx.beginPath();
        for (let s = 0; s < segs.length; s++) {
            ctx.moveTo(segs[s][0].x, segs[s][0].y);
            ctx.lineTo(segs[s][1].x, segs[s][1].y);
        }
        ctx.stroke();

        const cand = segs.filter(s => {
            const mx = (s[0].x + s[1].x) * 0.5, my = (s[0].y + s[1].y) * 0.5;
            return mx > w * 0.18 && mx < w * 0.82 && my > h * 0.18 && my < h * 0.82;
        });

        if (cand.length > 0) {
            const p = cand[Math.floor(cand.length / 2)];
            const lx = (p[0].x + p[1].x) * 0.5, ly = (p[0].y + p[1].y) * 0.5;
            const labelTxt = Number(T).toFixed(step < 1 ? 1 : 0) + (unit ? unit : '');
            isoLabels.push({ x: lx, y: ly, text: labelTxt });

            if (cand.length > 40) {
                const p2 = cand[Math.floor(cand.length * 0.2)];
                const lx2 = (p2[0].x + p2[1].x) * 0.5, ly2 = (p2[0].y + p2[1].y) * 0.5;
                if (Math.hypot(lx - lx2, ly - ly2) > 220) {
                    isoLabels.push({ x: lx2, y: ly2, text: labelTxt });
                }
            }
        }
    }

    drawLabels(ctx, isoLabels);
}
