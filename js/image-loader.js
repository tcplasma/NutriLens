// ═══════════════════════════════════════════════
//  LOAD IMAGE & PREVIEW
// ═══════════════════════════════════════════════
function loadImageSrc(src) {
    const img = new Image();
    img.onload = () => {
        currentImg = img;
        const MAX = 400;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const cvs = document.getElementById('canvas-work');
        cvs.width = w; cvs.height = h;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        currentImageData = ctx.getImageData(0, 0, w, h);

        // Show preview
        document.getElementById('preview-img').src = src;
        document.getElementById('preview-section').style.display = 'block';
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('progress-wrap').style.display = 'none';
        document.getElementById('btn-analyze').disabled = false;

        // Clear overlay canvas
        const ov = document.getElementById('plate-overlay');
        ov.style.width = '0'; ov.style.height = '0';
    };
    img.src = src;
}
