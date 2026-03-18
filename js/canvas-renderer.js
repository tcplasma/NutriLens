// ═══════════════════════════════════════════════
//  CANVAS RENDERS
// ═══════════════════════════════════════════════
const CLUSTER_COLORS_VIZ = [
    [255, 80, 80], [80, 220, 120], [80, 140, 255],
    [255, 200, 80], [200, 80, 255], [80, 240, 240]
];

function drawMaskCanvas(foodMask, W, H) {
    const cvs = document.getElementById('canvas-mask');
    cvs.width = W; cvs.height = H;
    const ctx = cvs.getContext('2d');
    const id = ctx.createImageData(W, H);
    for (let i = 0; i < foodMask.length; i++) {
        const v = foodMask[i] ? 255 : 30;
        id.data[i * 4] = v;
        id.data[i * 4 + 1] = v;
        id.data[i * 4 + 2] = v;
        id.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(id, 0, 0);
}

function drawClusteredCanvas(foodMask, allLabels, centroids, W, H) {
    const cvs = document.getElementById('canvas-clustered');
    cvs.width = W; cvs.height = H;
    const ctx = cvs.getContext('2d');
    const id = ctx.createImageData(W, H);
    for (let i = 0; i < foodMask.length; i++) {
        const k = allLabels[i];
        const pi = i * 4;
        if (k < 0) {
            id.data[pi] = 20; id.data[pi + 1] = 20; id.data[pi + 2] = 30; id.data[pi + 3] = 255;
        } else {
            const c = CLUSTER_COLORS_VIZ[k % CLUSTER_COLORS_VIZ.length];
            id.data[pi] = c[0]; id.data[pi + 1] = c[1]; id.data[pi + 2] = c[2]; id.data[pi + 3] = 255;
        }
    }
    ctx.putImageData(id, 0, 0);
}

function drawPlateOverlay(center, radius) {
    const img = document.getElementById('preview-img');
    const ov = document.getElementById('plate-overlay');
    const displayW = img.offsetWidth || img.naturalWidth;
    const displayH = img.offsetHeight || img.naturalHeight;
    const scaleX = displayW / currentImageData.width;
    const scaleY = displayH / currentImageData.height;

    ov.width = displayW; ov.height = displayH;
    ov.style.width = displayW + 'px';
    ov.style.height = displayH + 'px';
    ov.style.position = 'absolute';
    ov.style.top = '0'; ov.style.left = '0';

    const ctx = ov.getContext('2d');
    ctx.clearRect(0, 0, displayW, displayH);
    ctx.beginPath();
    ctx.arc(center[0] * scaleX, center[1] * scaleY, radius * Math.min(scaleX, scaleY), 0, Math.PI * 2);
    ctx.strokeStyle = '#7fffd4';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
}
