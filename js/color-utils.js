// ═══════════════════════════════════════════════
//  COLOR UTILITIES (English labels)
// ═══════════════════════════════════════════════
function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    return { s, v };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function luminance(r, g, b) {
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function rgbToHue(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max === min) return 0;
    let h;
    const d = max - min;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return h * 360;
}

function guessColorLabel(r, g, b) {
    const h = rgbToHue(r, g, b);
    const { s, v } = rgbToHsv(r, g, b);
    if (s < 0.15 && v > 0.85) return 'White / Starch';
    if (s < 0.15 && v < 0.35) return 'Dark / Charred';
    if (s < 0.15) return 'Gray-Brown';
    if (h < 20 || h >= 345) return 'Red / Meat';
    if (h < 45) return 'Orange-Red / Sauce';
    if (h < 70) return 'Yellow-Orange / Grain';
    if (h < 80) return 'Yellow / Egg';
    if (h < 165) return 'Green / Vegetables';
    if (h < 200) return 'Teal-Green';
    if (h < 260) return 'Blue-Purple';
    if (h < 300) return 'Purple / Eggplant';
    return 'Pink';
}

function colorToNutrition(r, g, b) {
    const h = rgbToHue(r, g, b);
    const { s, v } = rgbToHsv(r, g, b);

    if (s < 0.15 && v > 0.85)
        return { icon: '🍚', category: 'White Foods', hint: 'Starch, rice, tofu' };
    if (h >= 90 && h < 165)
        return { icon: '🥦', category: 'Green Vegetables', hint: 'Dietary fiber, Vitamin C' };
    if ((h < 20 || h >= 345) && s > 0.3)
        return { icon: '🥩', category: 'Red Foods', hint: 'Protein, iron' };
    if (h >= 20 && h < 55)
        return { icon: '🥕', category: 'Orange-Yellow Foods', hint: 'Beta-carotene, Vitamin A' };
    if (h >= 55 && h < 90)
        return { icon: '🌽', category: 'Yellow Foods', hint: 'Carbohydrates, lutein' };
    if (h >= 260 && h < 320)
        return { icon: '🍆', category: 'Purple Foods', hint: 'Anthocyanins, antioxidants' };
    if (s < 0.2)
        return { icon: '🍗', category: 'Brown Foods', hint: 'Cooked protein' };
    return { icon: '🍽️', category: 'Mixed Foods', hint: 'Balanced nutrients' };
}
// ── Full HSV conversions (for histogram EQ) ──
function rgbToHsvFull(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    let h = 0;
    if (d !== 0) {
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
    }
    return { h, s, v };
}

function hsvToRgb(h, s, v) {
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

// ── CIE LAB conversions ──────────────────────
function rgbToLab(r, g, b) {
    // sRGB → linear
    let R = r / 255, G = g / 255, B = b / 255;
    R = R > 0.04045 ? ((R + 0.055) / 1.055) ** 2.4 : R / 12.92;
    G = G > 0.04045 ? ((G + 0.055) / 1.055) ** 2.4 : G / 12.92;
    B = B > 0.04045 ? ((B + 0.055) / 1.055) ** 2.4 : B / 12.92;

    // Linear RGB → XYZ (D65 illuminant)
    const X = (R * 0.4124564 + G * 0.3575761 + B * 0.1804375) / 0.95047;
    const Y = (R * 0.2126729 + G * 0.7151522 + B * 0.0721750) / 1.00000;
    const Z = (R * 0.0193339 + G * 0.1191920 + B * 0.9503041) / 1.08883;

    // XYZ → LAB
    const f = t => t > 0.008856 ? t ** (1 / 3) : 7.787037 * t + 16 / 116;
    const fX = f(X), fY = f(Y), fZ = f(Z);

    return [116 * fY - 16, 500 * (fX - fY), 200 * (fY - fZ)];
}

function labToRgb(L, a, b) {
    // LAB → XYZ
    const fy = (L + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - b / 200;

    const inv = t => {
        const t3 = t * t * t;
        return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787037;
    };
    const X = 0.95047 * inv(fx);
    const Y = 1.00000 * inv(fy);
    const Z = 1.08883 * inv(fz);

    // XYZ → linear RGB
    let R =  3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
    let G = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z;
    let B =  0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;

    // Linear → sRGB
    const gamma = c => c > 0.0031308 ? 1.055 * c ** (1 / 2.4) - 0.055 : 12.92 * c;
    return [
        Math.max(0, Math.min(255, Math.round(gamma(R) * 255))),
        Math.max(0, Math.min(255, Math.round(gamma(G) * 255))),
        Math.max(0, Math.min(255, Math.round(gamma(B) * 255)))
    ];
}
