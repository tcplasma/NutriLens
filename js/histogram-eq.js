// ═══════════════════════════════════════════════
//  HISTOGRAM EQUALIZATION (V-channel)
// ═══════════════════════════════════════════════

/**
 * Global histogram equalization on the HSV Value channel.
 *
 * Normalizes brightness across all food pixels so that the same food colour
 * in shadow and highlight areas clusters together instead of splitting into
 * separate K-Means groups.
 *
 * @param {Array} foodPixels - Array of {x, y, r, g, b}
 * @returns {Array} New array of {x, y, r, g, b} with equalized brightness
 */
function equalizeV(foodPixels) {
    if (foodPixels.length === 0) return foodPixels;

    // 1. Build histogram of V values (0-255)
    const hist = new Uint32Array(256);
    const hsvCache = new Array(foodPixels.length);

    for (let i = 0; i < foodPixels.length; i++) {
        const p = foodPixels[i];
        const hsv = rgbToHsvFull(p.r, p.g, p.b);
        hsvCache[i] = hsv;
        hist[Math.round(hsv.v * 255)]++;
    }

    // 2. Cumulative distribution function
    const cdf = new Uint32Array(256);
    cdf[0] = hist[0];
    for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + hist[i];
    }

    // 3. Find CDF minimum (first non-zero bin)
    let cdfMin = 0;
    for (let i = 0; i < 256; i++) {
        if (cdf[i] > 0) { cdfMin = cdf[i]; break; }
    }

    // 4. Build lookup table
    const denom = foodPixels.length - cdfMin;
    const lut = new Uint8Array(256);
    if (denom > 0) {
        for (let i = 0; i < 256; i++) {
            lut[i] = Math.round((cdf[i] - cdfMin) / denom * 255);
        }
    }

    // 5. Remap V channel, preserve H and S
    const equalized = foodPixels.map((p, i) => {
        const hsv = hsvCache[i];
        const newV = lut[Math.round(hsv.v * 255)] / 255;
        const rgb = hsvToRgb(hsv.h, hsv.s, newV);
        return { x: p.x, y: p.y, r: rgb.r, g: rgb.g, b: rgb.b };
    });

    return { equalized, lut };
}
