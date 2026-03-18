// ═══════════════════════════════════════════════
//  PLATE DETECTION & FOOD MASK
// ═══════════════════════════════════════════════
function detectPlate(imgData, sensitivity) {
    const { width: W, height: H, data } = imgData;

    // Sensitivity maps to white threshold
    const whiteSatThresh = [80, 60, 45, 35, 25][sensitivity - 1];
    const whiteBriThresh = [180, 170, 160, 150, 140][sensitivity - 1];

    // Find white pixel distribution to estimate plate bounds
    let minX = W, maxX = 0, minY = H, maxY = 0;
    let whiteCount = 0;

    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const { s, v } = rgbToHsv(r, g, b);
            if (s < whiteSatThresh / 100 && v > whiteBriThresh / 255) {
                minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                minY = Math.min(minY, y); maxY = Math.max(maxY, y);
                whiteCount++;
            }
        }
    }

    const detected = whiteCount > W * H * 0.05;
    if (detected && (maxX - minX) > W * 0.2) {
        const cx = Math.round((minX + maxX) / 2);
        const cy = Math.round((minY + maxY) / 2);
        const radius = Math.round(Math.max(maxX - minX, maxY - minY) / 2 * 0.95);
        return { center: [cx, cy], radius, detected: true };
    }

    // Fallback: use center
    return {
        center: [Math.round(W / 2), Math.round(H / 2)],
        radius: Math.round(Math.min(W, H) * 0.42),
        detected: false
    };
}

function createFoodMask(imgData, center, radius) {
    const { width: W, height: H, data } = imgData;
    const foodMask = new Uint8Array(W * H);
    const foodPixels = [];
    const [cx, cy] = center;
    const r2 = radius * radius;

    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const dx = x - cx, dy = y - cy;
            if (dx * dx + dy * dy > r2) continue;   // outside plate
            const i = (y * W + x) * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const { s, v } = rgbToHsv(r, g, b);
            if (s > 0.12 || v < 0.82) {         // not white → food
                foodMask[y * W + x] = 1;
                foodPixels.push({ x, y, r, g, b });
            }
        }
    }
    return { foodMask, foodPixels };
}
