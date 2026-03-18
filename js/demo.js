// ═══════════════════════════════════════════════
//  DEMO GENERATORS
// ═══════════════════════════════════════════════
function loadDemo(type) {
    const cvs = document.createElement('canvas');
    cvs.width = 400; cvs.height = 400;
    const ctx = cvs.getContext('2d');

    // Background
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, 400, 400);

    // White plate
    ctx.beginPath();
    ctx.arc(200, 200, 170, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 3;
    ctx.stroke();

    if (type === 'balanced') {
        // Red items (protein)
        drawBlob(ctx, 160, 170, 50, '#d94040');
        drawBlob(ctx, 145, 230, 38, '#c83838');
        // Green items (veg)
        drawBlob(ctx, 260, 175, 55, '#3aab3a');
        drawBlob(ctx, 270, 250, 42, '#2e9c2e');
        // Orange items (carbs)
        drawBlob(ctx, 200, 270, 40, '#e8943a');
        drawBlob(ctx, 230, 220, 32, '#d8852a');
    } else if (type === 'protein') {
        // Mostly red/brown protein
        drawBlob(ctx, 200, 200, 80, '#b83030');
        drawBlob(ctx, 165, 230, 50, '#c84040');
        drawBlob(ctx, 240, 180, 45, '#a82020');
        drawBlob(ctx, 190, 160, 35, '#d05050');
        // A little green
        drawBlob(ctx, 260, 255, 30, '#3aab3a');
    } else {
        // veggie: lots of greens
        drawBlob(ctx, 200, 200, 65, '#2ea02e');
        drawBlob(ctx, 160, 170, 45, '#50c050');
        drawBlob(ctx, 250, 175, 48, '#1e8c1e');
        drawBlob(ctx, 230, 255, 40, '#3ab83a');
        drawBlob(ctx, 165, 255, 36, '#28a028');
        // small orange accent
        drawBlob(ctx, 270, 225, 22, '#e8943a');
    }

    loadImageSrc(cvs.toDataURL());
}

function drawBlob(ctx, cx, cy, r, color) {
    ctx.beginPath();
    // wavy circle for organic look
    for (let a = 0; a < Math.PI * 2; a += 0.15) {
        const rr = r + (Math.sin(a * 5) * r * 0.12);
        const x = cx + rr * Math.cos(a);
        const y = cy + rr * Math.sin(a);
        a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    // highlight
    ctx.beginPath();
    ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();
}
