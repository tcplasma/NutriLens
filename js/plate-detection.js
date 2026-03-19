// ═══════════════════════════════════════════════
//  PLATE DETECTION & FOOD MASK  (v3 — radial gradient)
// ═══════════════════════════════════════════════

function detectPlate(imgData, sensitivity) {
    // 1. 計算每個像素的亮度梯度（Sobel）
    const grad = computeGradient(imgData);
    
    // 2. 用 Hough 累積器找最可能的圓心
    const result = houghCircle(imgData, grad, sensitivity);
    
    if (result.score > 0.15) {
        return { center: [result.cx, result.cy], radius: result.r, detected: true, method: 'hough' };
    }
    // fallback
    return {
        center: [Math.round(imgData.width / 2), Math.round(imgData.height / 2)],
        radius: Math.round(Math.min(imgData.width, imgData.height) * 0.42),
        detected: false,
        method: 'fallback'
    };
}

// ── Sobel 梯度（只算亮度通道）──────────────────
function computeGradient(imgData) {
    const { width: W, height: H, data } = imgData;
    const lum = new Float32Array(W * H);
    const gx  = new Float32Array(W * H);
    const gy  = new Float32Array(W * H);
    const mag = new Float32Array(W * H);

    // 計算亮度
    for (let i = 0; i < W * H; i++) {
        const p = i * 4;
        lum[i] = 0.299 * data[p] + 0.587 * data[p+1] + 0.114 * data[p+2];
    }

    // Sobel 3x3
    for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
            const i = y * W + x;
            const gX = (
                -lum[(y-1)*W+(x-1)] + lum[(y-1)*W+(x+1)]
                -2*lum[y*W+(x-1)]   + 2*lum[y*W+(x+1)]
                -lum[(y+1)*W+(x-1)] + lum[(y+1)*W+(x+1)]
            );
            const gY = (
                -lum[(y-1)*W+(x-1)] - 2*lum[(y-1)*W+x] - lum[(y-1)*W+(x+1)]
                +lum[(y+1)*W+(x-1)] + 2*lum[(y+1)*W+x] + lum[(y+1)*W+(x+1)]
            );
            gx[i] = gX;
            gy[i] = gY;
            mag[i] = Math.sqrt(gX*gX + gY*gY);
        }
    }
    return { gx, gy, mag };
}

// ── Hough 圓形累積（梯度方向投票）─────────────
function houghCircle(imgData, grad, sensitivity) {
    const { width: W, height: H } = imgData;
    const { gx, gy, mag } = grad;

    // 梯度閾值：只讓強邊緣投票，減少雜訊
    const magThresh = 25 + (5 - sensitivity) * 8;  // sens=5 → 25, sens=1 → 57

    // 候選半徑範圍：20%~48% 的圖片短邊
    const minD = Math.min(W, H);
    const rMin = Math.round(minD * 0.20);
    const rMax = Math.round(minD * 0.48);
    const rStep = Math.max(2, Math.round((rMax - rMin) / 8));

    // 累積器：用降採樣的 cx/cy 網格節省記憶體
    const acc = new Map();   // key = `cx,cy,r` → 累積票數
    const step = 8;          // 累積器解析度（px）

    for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
            const i = y * W + x;
            if (mag[i] < magThresh) continue;

            // 梯度方向的單位向量（指向圓心）
            const m = mag[i];
            const nx = gx[i] / m;
            const ny = gy[i] / m;

            // 沿梯度方向（正負兩向）各投票
            for (const sign of [1, -1]) {
                for (let r = rMin; r <= rMax; r += rStep) {
                    const cx = Math.round((x + sign * nx * r) / step) * step;
                    const cy = Math.round((y + sign * ny * r) / step) * step;
                    if (cx < 0 || cx >= W || cy < 0 || cy >= H) continue;
                    // 把 r snap 到最近的 rStep 格子
                    const rSnap = Math.round(r / rStep) * rStep;
                    const key = `${cx},${cy},${rSnap}`;
                    acc.set(key, (acc.get(key) || 0) + 1);
                }
            }
        }
    }

    if (acc.size === 0) return { score: 0, cx: W/2, cy: H/2, r: minD * 0.42 };

    // 找累積最高的候選
    let bestKey = '', bestVotes = 0;
    for (const [key, votes] of acc) {
        if (votes > bestVotes) { bestVotes = votes; bestKey = key; }
    }

    const [cx, cy, r] = bestKey.split(',').map(Number);

    // 用白色比例來驗證（但只看圓內，不和外側比）
    const whiteRatio = measureInnerWhiteRatio(imgData, cx, cy, r, sensitivity);

    // 綜合分數 = 梯度票數（正規化）* 白色比例加成
    const edgeScore = bestVotes / (2 * Math.PI * r / step * 2 + 1);
    const score = edgeScore * (0.4 + 0.6 * whiteRatio);

    return { score, cx, cy, r };
}

// ── 圓內白色比例（驗證用）─────────────────────
function measureInnerWhiteRatio(imgData, cx, cy, r, sensitivity) {
    const { width: W, height: H, data } = imgData;
    const satT  = [0.80, 0.60, 0.45, 0.35, 0.25][sensitivity - 1];
    const briT  = [180, 170, 160, 150, 140][sensitivity - 1] / 255;
    // 只採樣「邊緣帶內側 r*0.6 到 r」的環形區域（應該是白色餐盤）
    const rInner2 = (r * 0.6) * (r * 0.6);
    const r2 = r * r;
    let white = 0, total = 0;
    const sampleStep = 3;
    for (let y = Math.max(0, cy - r); y < Math.min(H, cy + r); y += sampleStep) {
        for (let x = Math.max(0, cx - r); x < Math.min(W, cx + r); x += sampleStep) {
            const dx = x - cx, dy = y - cy;
            const d2 = dx*dx + dy*dy;
            if (d2 < rInner2 || d2 > r2) continue;  // 只看環形帶
            total++;
            const i = (Math.round(y) * W + Math.round(x)) * 4;
            const { s, v } = rgbToHsv(data[i], data[i+1], data[i+2]);
            if (s < satT && v > briT) white++;
        }
    }
    return total > 0 ? white / total : 0;
}

// ── Food Mask ─────────────────────────────────
function createFoodMask(imgData, center, radius) {
    const { width: W, height: H, data } = imgData;
    const foodMask = new Uint8Array(W * H);
    const foodPixels = [];
    const [cx, cy] = center;
    const r2 = radius * radius;

    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const dx = x - cx, dy = y - cy;
            if (dx * dx + dy * dy > r2) continue;
            const i = (y * W + x) * 4;
            const rVal = data[i], gVal = data[i+1], bVal = data[i+2];
            const { s, v } = rgbToHsv(rVal, gVal, bVal);
            if (s > 0.12 || v < 0.82) {
                foodMask[y * W + x] = 1;
                foodPixels.push({ x, y, r: rVal, g: gVal, b: bVal });
            }
        }
    }
    return { foodMask, foodPixels };
}

// ── Ellipse Fitting & Mask ────────────────────
function fitEllipse(whitePixels) {
    if (whitePixels.length < 10) return null;
    let m00=0, m10=0, m01=0, m20=0, m02=0, m11=0;
    for (const {x, y} of whitePixels) {
        m00++; m10+=x; m01+=y;
        m20+=x*x; m02+=y*y; m11+=x*y;
    }
    const cx = m10/m00, cy = m01/m00;
    const mu20 = m20/m00 - cx*cx;
    const mu02 = m02/m00 - cy*cy;
    const mu11 = m11/m00 - cx*cy;
    const theta = 0.5 * Math.atan2(2*mu11, mu20-mu02);
    const common = Math.sqrt((mu20-mu02)**2 + 4*mu11**2);
    const a = Math.sqrt(2*(mu20+mu02+common));
    const b = Math.sqrt(2*(mu20+mu02-common));
    return { cx, cy, a, b, theta };
}

function createEllipseFoodMask(imgData, ellipse) {
    const { width: W, height: H, data } = imgData;
    const foodMask = new Uint8Array(W * H);
    const foodPixels = [];
    const { cx, cy, a, b, theta } = ellipse;
    const cosT = Math.cos(theta), sinT = Math.sin(theta);
    const a2 = a*a, b2 = b*b;
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const dx = x-cx, dy = y-cy;
            const rx = dx*cosT + dy*sinT;
            const ry = -dx*sinT + dy*cosT;
            if ((rx*rx)/a2 + (ry*ry)/b2 > 1) continue;
            const i = (y*W+x)*4;
            const rVal=data[i], gVal=data[i+1], bVal=data[i+2];
            const { s, v } = rgbToHsv(rVal, gVal, bVal);
            if (s > 0.12 || v < 0.82) {
                foodMask[y*W+x] = 1;
                foodPixels.push({ x, y, r: rVal, g: gVal, b: bVal });
            }
        }
    }
    return { foodMask, foodPixels };
}
