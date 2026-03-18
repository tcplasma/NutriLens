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
